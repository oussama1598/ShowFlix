const Q = require("q")
const request = require("request")
const cheerio = require("cheerio")
const fs = require("fs");
const colors = require("colors");
const apicache = require("apicache");
const del = require("del");
const _ = require("underscore");

function getHtml(url, json, cookies) {
    var defer = Q.defer();
    url = encodeURI(url);
    request(url, (error, response, body) => {
        if (!error && response.statusCode == 200) {
            if (json) {
                defer.resolve(body);
            } else {
                const $ = cheerio.load(body);

                defer.resolve((!cookies) ? $ : { $: $, cookies: parseCookies(response) });
            }
        } else {
            console.log("Error occured when requesting this url".red);
            defer.reject(new Error(error))
        }
    });

    return defer.promise;
}

function filesUpdated() {
    apicache.clear();
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


function BuildNextElement(infos, cb) {
    infos.queue = ('' + (parseInt(infos.queue) + 1));
    updateJSON(infos, "./data/infos.json", () => {
        cb(infos);
    });
}

function ElementDone(QUEUEPATH, index) {
    return Q.Promise((resolve, reject) => {
        getQueue(QUEUEPATH).then(data => {
            data[index].done = true;
            updateJSON(data, QUEUEPATH, () => {
                resolve();
            })
        }).catch(() => { reject() })
    })
}

function addToQueue(QUEUEPATH, arr, done) {
    getQueue(QUEUEPATH, true).then(data => {
        for (key in arr) {
            const val = arr[key],
                result = data.filter(val1 => (val1.episode === val.episode && val1.season === val.season) && val1.name === val.name);
            if (result.length > 0) {
                arr.splice(key, 1);
            }
        }

        data = data.concat(arr);
        updateJSON(data, QUEUEPATH, () =>{
            if(done)
                done();
        })
    })
}

function updateJSON(object, path, done) {
    fs.writeFile(path, JSON.stringify(object, null, 3), function(err) {
        if (err) return console.log(err);
        if (done)
            done()
    });
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
    if (fs.existsSync(uri)) {
        return del(uri, { force: true });
    }
}

function arrayDeffrence(array) {
    var rest = Array.prototype.concat.apply(Array.prototype, Array.prototype.slice.call(arguments, 1));

    var containsEquals = function(obj, target) {
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
            reject();
            return;
        } else {

            delete require.cache[require.resolve(QUEUEPATH)];
            const data = require(QUEUEPATH);

            if (ObjectSize(data) <= 0 && !force) {
                console.log("Data is empty please try again.".red);
                reject();
                return;
            }

            resolve(data);
        }
    })
}

function getQueueValue(QUEUEPATH, index) {
    return Q.Promise((resolve, reject) => {
        getQueue(QUEUEPATH).then(data => {
            const arr = data.filter((val, key) => key === index);
            if (arr.length > 0) { resolve(arr[0]) } else { reject(); }
        }).catch(() => { reject() });
    })
}

function clearQueue(QUEUEPATH) {
    getQueue(QUEUEPATH).then(data => {
        _.each(data, (val, key) => {
            if (val.done) data.splice(key, 1);
        });
        updateJSON(data, QUEUEPATH)
    })
}

function searchAPI(cx){
    return require("../modules/searchAPI")(cx);
}

module.exports = {
    getHtml,
    BuildNextElement,
    addToQueue,
    ObjectSize,
    deleteFile,
    filesUpdated,
    arrayDeffrence,
    getQueueValue,
    ElementDone,
    clearQueue,
    searchAPI,
    updateJSON
}
