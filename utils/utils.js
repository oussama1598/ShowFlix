const cheerio = require('cheerio');
const del = require('del');
const _ = require('underscore');
const NodeCache = require('node-cache');
const Bypasser = require('node-bypasser');
const fetch = require('node-fetch');
const search = require('../modules/searchAPI');

const myCache = new NodeCache({
    stdTTL: 60 * 60 * 24,
    checkperiod: 120
});

const ObjectSize = object => Object.keys(object).length;
const deleteFile = uri => del(uri, {
    force: true
});
const searchAPI = cx => search(cx);
const cache = () => ({
    get: key => myCache.get(key),
    set: (key, data) => myCache.set(key, data),
    delete: key => myCache.del(key)
});
const getHtml = (_url, json, method = 'GET', form = {}, headers = {}) => fetch(encodeURI(_url), {
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
const filesUpdated = () => cache().delete('medias');

function arrayDeffrence(_arr, _target) {
    const containsEquals = (obj, target) => {
        if (obj == null) return false;
        return _.any(obj, value => _.isEqual(value, target));
    };

    return _.filter(_arr, value => !containsEquals(_target, value));
}

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
    return new Promise((resolve, reject) => {
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

module.exports = {
    getHtml,
    ObjectSize,
    deleteFile,
    filesUpdated,
    arrayDeffrence,
    searchAPI,
    cache,
    fixInt,
    pad,
    Bypass,
    getLastEpisode
};
