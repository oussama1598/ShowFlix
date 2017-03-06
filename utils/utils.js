const Q = require('q');
const cheerio = require('cheerio');
const fs = require('fs');
const del = require('del');
const _ = require('underscore');
const NodeCache = require('node-cache');
const Bypasser = require('node-bypasser');
const fetch = require('node-fetch');
const low = require('lowdb');

const myCache = new NodeCache({
    stdTTL: 60 * 60 * 24,
    checkperiod: 120
});

function getHtml(_url, json, method = 'GET', form = {}, headers = {}) {
    const url = encodeURI(_url);
    return fetch(url, {
            timeout: 20000,
            method,
            body: generateFormData(form),
            headers
        })
        .then(res => res.text())
        .then(body => {
            if (json) return JSON.parse(body);
            return cheerio.load(body);
        }).catch(err => {
            console.log(err.toString().red);
            return err;
        });
}

function cache() {
    return {
        get: key => myCache.get(key),
        set: (key, data) => {
            myCache.set(key, data);
        },
        delete: key => {
            myCache.del(key);
        }
    };
}

function filesUpdated() {
    cache().delete('medias');
}

function getInfosData(INFOS_PATH) {
    return low(INFOS_PATH).getState();
} // to be deleted soon


function UpdateInfosData(obj, INFOS_PATH, cb) {
    low(INFOS_PATH).assign(obj).write();
    if (cb) cb();
}

function updateJSON(object, path) {
    low(path).assign(object).write();
}

const ObjectSize = object => Object.keys(object).length;

function deleteFile(uri) {
    return Q.Promise((resolve, reject) => {
        fs.exists(uri, (error, exists) => {
            if (error || !exists) reject('This File does not exist');

            del(uri, {
                force: true
            }).then(() => {
                resolve();
            }).catch(err => {
                reject(err);
            });
        });
    });
}

function arrayDeffrence(array) {
    const rest = Array.prototype.concat.apply(
        Array.prototype,
        Array.prototype.slice.call(arguments, 1)
    );

    const containsEquals = (obj, target) => {
        if (obj == null) return false;
        return _.any(obj, value => _.isEqual(value, target));
    };

    return _.filter(array, value => !containsEquals(rest, value));
}

function searchAPI(cx) {
    return require('../modules/searchAPI')(cx);
}

function updateConfig(obj, queuepath, cb) {
    updateJSON(obj, queuepath, cb);
} // to be deleted

function fixInt(num) {
    return isNaN(parseInt(num, 10)) ? null : parseInt(num, 10);
}

// function deleteFromQueue({
//     episode,
//     season,
//     name
// }, queuepath) {
//     return Q.Promise((resolve, reject) => {
//         // getQueue(queuepath, true).then(data => {
//         //
//         //     for (let i = data.length - 1; i >= 0; i--) {
//         //         const val = data[i];
//         //         if (val.name === name && val.episode === episode && val.season === season) {
//         //             data.splice(i, 1);
//         //         }
//         //     }
//         //
//         //     updateState(data, queuepath);
//         //     resolve();
//         // }).catch(err => {
//         //     reject(err);
//         // });
//     });
// } // to be deleted

function pad(num, size) {
    let s = num.toString();
    while (s.length < size) s = `0${s}`;
    return s;
}

function Bypass(url) {
    return Q.Promise((resolve, reject) => {
        new Bypasser(url).decrypt((err, result) => {
            if (err) return reject();
            resolve(result);
        });
    });
}

function generateFormData(obj) {
    let str = '';

    _.each(obj, (item, key) => {
        str += `${key}=${item}`;
    });

    return str;
}

function getLastEpisode(obj) {
    let last = 0;
    Object.keys(obj).forEach(_episode => {
        const episode = parseInt(_episode, 10);
        if (episode > last) last = episode;
    });

    return last;
}

function updateState(data, URI) {
    low(URI).setState(data);
}

module.exports = {
    getHtml,
    ObjectSize,
    deleteFile,
    filesUpdated,
    arrayDeffrence,
    searchAPI,
    getInfosData,
    UpdateInfosData,
    updateConfig,
    cache,
    fixInt,
    pad,
    Bypass,
    getLastEpisode,
    updateState
};
