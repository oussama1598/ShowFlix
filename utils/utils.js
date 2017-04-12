const cheerio = require('cheerio');
const rimraf = require('rimraf');
const _ = require('underscore');
const NodeCache = require('node-cache');
const fetch = require('node-fetch');

const myCache = new NodeCache({
    stdTTL: 60 * 60 * 24,
    checkperiod: 120
});
const deleteFile = uri => new Promise(resolve => {
    rimraf(uri, () => resolve());
});
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
    .then(res => {
        if (res.status !== 200) return Promise.reject(new Error(res.statusText));
        return res.text();
    })
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

function generateFormData(obj) {
    let str = '';

    _.each(obj, (item, key) => {
        str += `${key}=${item}`;
    });

    return str;
}

module.exports = {
    getHtml,
    deleteFile,
    filesUpdated,
    arrayDeffrence,
    cache,
    fixInt,
    pad,
    deleteFromQueue
};
