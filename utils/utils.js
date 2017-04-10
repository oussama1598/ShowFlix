const cheerio = require('cheerio');
const del = require('del');
const _ = require('underscore');
const NodeCache = require('node-cache');
const Bypasser = require('node-bypasser');
const fetch = require('node-fetch');
const search = require('../modules/searchAPI');
const cloudscraper = require('cloudscraper');

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
const getHtml = (
        _url,
        json,
        method = 'GET',
        form = {},
        headers = {},
        timeout = 20000
    ) => fetch(encodeURI(_url), {
        timeout,
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
        return Promise.reject(err);
    });
const filesUpdated = () => cache().delete('medias');
const deleteFromQueue = ({
    episode,
    season,
    name
}, db) => Promise.resolve().then(() => {
    db.get('queue')
        .remove({
            episode,
            season,
            name
        })
        .write();
});

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

function byPassCloudflare(url) {
    return new Promise((resolve, reject) => {
        cloudscraper.get(encodeURI(url), (err, res, body) => {
            if (err || res.statusCode !== 200) {
                global.log(err.toString());
                return reject(err ? err.toString() : 'Unknown response header');
            }

            return resolve(cheerio.load(body));
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

// replace multiple strings in a string
const replaceAll = (_str, toReplace, replaceWith) => {
    let str = _str;
    toReplace.forEach(item => {
        str = str.replace(new RegExp(item, 'g'), replaceWith);
    });
    return str.trim();
};

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
    getLastEpisode,
    byPassCloudflare,
    deleteFromQueue,
    replaceAll
};
