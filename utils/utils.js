const Q = require("q")
const cheerio = require("cheerio")
const fs = require("fs");
const colors = require("colors");
const del = require("del");
const _ = require("underscore");
const extend = require("extend");
const path = require("path");
const NodeCache = require("node-cache");
const myCache = new NodeCache({
    stdTTL: 60 * 60 * 24,
    checkperiod: 120
});
const Bypasser = require('node-bypasser');
const fetch = require('node-fetch');
const FormData = require('form-data');
const low = require("lowdb");

function getHtml(url, json, method = "GET", form = {}, headers = {}) {
    url = encodeURI(url);
    return fetch(url, {
            timeout: 20000,
            method,
            body: generateFormData(form),
            headers
        })
        .then(res => {
            return res.text();
        }).then(body => {
            return json ? JSON.parse(body) : cheerio.load(body);
        }).catch(err => {
            console.log(err.toString().red);
            return err;
        });
}

function cache() {
    return {
        get: key => {
            return myCache.get(key);
        },
        set: (key, data) => {
            myCache.set(key, data);
        },
        delete: key => {
            myCache.del(key);
        }
    }
}

function filesUpdated() {
    cache().delete("medias")
}

function parseCookies(res) {
    let list = [],
        rc = res.headers['set-cookie'];

    rc && rc.forEach(cookie => {
        let parts = cookie.split(";")[0];
        list.push(parts);
    })

    return list;
}

function getInfosData(INFOS_PATH) {
    return low(INFOS_PATH).getState();
} // to be deleted soon


function UpdateInfosData(obj, INFOS_PATH, cb) {
    low(INFOS_PATH).assign(obj).write();
    if (cb) cb();
}

function ElementDone(QUEUEPATH, index, not) {
    return Q.Promise((resolve, reject) => {
        getQueue(QUEUEPATH).then(data => {
            data[index].done = !not;
            data[index].tried = true;

            updateState(data, QUEUEPATH);
            resolve();
        }).catch(() => {
            reject()
        })
    })
}

function updateJSON(object, path, done) {
    low(path).assign(object).write();
}

function ObjectSize(object) {
    let size = 0;
    for (key in object) {
        if (object.hasOwnProperty(key))
            ++size;
    }
    return size;
}

function deleteFile(uri) {
    return Q.Promise((resolve, reject) => {
        fs.exists(uri, (err, exists) => {
            if (err || !exists) reject("This File does not exist");

            del(uri, {
                force: true
            }).then(() => {
                resolve()
            }).catch(err => {
                reject(err)
            });
        })
    })
}

function arrayDeffrence(array) {
    let rest = Array.prototype.concat.apply(Array.prototype, Array.prototype.slice.call(arguments, 1));

    let containsEquals = function(obj, target) {
        if (obj == null) return false;
        return _.any(obj, function(value) {
            return _.isEqual(value, target);
        });
    };

    return _.filter(array, function(value) {
        return !containsEquals(rest, value);
    });
}

function getQueue(QUEUEPATH, force = false) {
    return Q.Promise((resolve, reject) => {
        if (!fs.existsSync(QUEUEPATH)) {
            console.log("Unable to find queue data".red);
            return reject();
        } else {

            const data = low(QUEUEPATH).getState();

            if (ObjectSize(data) <= 0 && !force) {
                console.log("Data is empty please try again.".red);
                return reject("Data is empty please try again.");
            }

            resolve(data);
        }
    })
} // this should be deleted soon


function getQueueValue(QUEUEPATH, index) {
    return Q.Promise((resolve, reject) => {
        getQueue(QUEUEPATH).then(data => {
            const arr = data.filter((val, key) => key === index);
            if (arr.length > 0) {
                resolve(arr[0])
            } else {
                reject();
            }
        }).catch(err => {
            reject(err)
        });
    })
} // to be deleted

function clearQueue(QUEUEPATH, cb) {
    getQueue(QUEUEPATH).then(data => {
        const newArr = [];
        _.each(data, (val, key) => {
            if (!val.done) newArr.push(val);
        });
        updateState(newArr, QUEUEPATH)

        if (cb) cb()
    }).catch(err => {
        if (cb) cb(err)
    });
} // to be deleted

function searchAPI(cx) {
    return require("../modules/searchAPI")(cx);
}

function updateConfig(obj, queuepath, cb) {
    updateJSON(obj, queuepath, cb);
} // to be deleted

function fixInt(num) {
    return isNaN(parseInt(num)) ? null : parseInt(num);
}

function deleteFromQueue({
    episode,
    season,
    name
}, queuepath) {
    return Q.Promise((resolve, reject) => {
        getQueue(queuepath, true).then(data => {

            for (let i = data.length - 1; i >= 0; i--) {
                const val = data[i];
                if (val.name === name && val.episode == episode && val.season == season) {
                    data.splice(i, 1);
                }
            }

            updateState(data, queuepath)
            resolve();
        }).catch(err => {
            reject(err);
        });
    });
} // to be deleted

function pad(num, size) {
    let s = num.toString();
    while (s.length < size) s = "0" + s;
    return s;
}

function Bypass(url) {
    return Q.Promise((resolve, reject) => {
        new Bypasser(url).decrypt(function(err, result) {
            if (err) return reject();
            resolve(result);
        });
    })
}

function generateFormData(obj) {
    let str = "";
    for (key in obj) {
        if (obj.hasOwnProperty(key)) {
            str += `${key}=${obj[key]}`;
        }
    }
    return str;
}

function getLastEpisode(obj) {
    let last = 0;
    Object.keys(obj).forEach(episode => {
        episode = parseInt(episode);
        if (episode > last) last = episode;
    });

    return last;
}

function updateState(data, URI){
  low(URI).setState(data);
}

module.exports = {
    getHtml,
    ObjectSize,
    deleteFile,
    filesUpdated,
    arrayDeffrence,
    getQueueValue,
    clearQueue,
    searchAPI,
    getInfosData,
    UpdateInfosData,
    updateConfig,
    getQueue,
    cache,
    fixInt,
    deleteFromQueue,
    pad,
    Bypass,
    getLastEpisode,
    updateState
}
