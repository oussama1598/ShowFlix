const Q = require("q");
const downloader = require("../modules/downloader");
const utils = require("../utils/utils");
const colors = require("colors");
const path = require("path");
const fs = require("fs");
const config = require("../modules/config")();


const QUEUEPATH = config['QUEUEPATH'];
const INFOS_PATH = config['INFOS_PATH'];

let sources = {};

function get(name) {
    const source = sources[name];
    if (source)
        return source;
    else
        throw (new Error("This source can't be found"));
}

function add(arr) {
    if (arr.constructor === Array) {
        arr.forEach(val => {
            sources[val] = require(`./${val}`);
        });
    }
}

function MoveToNext(name, key) {
    if (!global.NOMORE) {
        let infos = utils.getInfosData(INFOS_PATH);

        utils.ElementDone(QUEUEPATH, key).then(() => {
            utils.BuildNextElement(infos, INFOS_PATH, i => {
                infos = i;
                parseQueue(name, 0);
            });
        }).catch(() => { global.NOMORE = true });
    }
}

function parseQueue() {
    let infos = utils.getInfosData(INFOS_PATH);

    utils.getQueueValue(QUEUEPATH, parseInt(infos.queue)).then(el => {
        el.index = parseInt(infos.queue);

        if (!el.done) {
            getMediaUrlFor({ name: el.provider, prov: 0, code: null, index: null }, el);
        } else {
            MoveToNext(el.provider, el.index);
        }

    }).catch(() => {
        console.log("All Done".green)
        global.NOMORE = true;
    });
}

function getMediaUrlFor(data, details) {
    const src = get(data.name);

    src.parseUrl(details, data.code).then(code => {
        if (!code) {
            console.log("Can't parse this url check again".red);
            console.log("Passing this episode".red);

            MoveToNext(data.name, details.index)
            return;
        }

        src.decodeForProvider(code, data.prov).then(url => {
            console.log(`Url Found ${url}`.green)

            downloader.download(url, details, data.index).then(() => {
                console.log("Next Element".green)
                MoveToNext(data.name, details.index)

            }).catch(index => {
                src.canNextProvider(data.prov).then(num => {
                    data = { name: data.name, prov: num, code, index };
                    getMediaUrlFor(data, details);
                }).catch(() => {
                    MoveToNext(data.name, details.index)
                })

            })
        })

    }).catch(next => {
        if (next) {
            console.log("Passing this episode".red);
            MoveToNext(data.name, details.index)
        }
    })
}

function addOnetoQueue(name, details) {
    const arr = [{
        provider: name,
        url: details.url,
        name: details.name,
        episode: details.episode,
        season: details.season,
        done: false
    }];

    utils.addToQueue(QUEUEPATH, arr);
}

function addtoQueue(name, details) {
    const provider = get(name);
    return Q.Promise((resolve, reject) => {
        let infos = utils.getInfosData(INFOS_PATH);
        let SearchInfos = infos.providers[name];

        SearchInfos.name = SearchInfos.name ? SearchInfos.name.toLowerCase() : null;
        SearchInfos.season = SearchInfos.season ? SearchInfos.season : null;

        details.name = details.name.toLowerCase();

        if (SearchInfos && SearchInfos.name === details.name && SearchInfos.season === details.season) {
            details.providerUrl = infos.providers[name].url;
            _addtoQueue().then(() => { resolve() })
        } else {
            provider.cansearch().then(() => {
                search(name, details).then(url => {
                    details.providerUrl = url;

                    infos.providers[name] = { url: url, name: details.name, season: details.season };
                    utils.UpdateInfosData(infos, INFOS_PATH);

                    _addtoQueue().then(() => { resolve() })
                }).catch(err => {
                    reject(err);
                })
            }).catch(err => {
                reject(err);
            })
        }

        function _addtoQueue() {
            return provider.addToQueueFromTo(details, QUEUEPATH);
        }
    })
}

function clearQueue(cb) {
    utils.clearQueue(QUEUEPATH, cb);
}

function search(name, details) {
    return get(name).search(details);
}

function searchAndAddEpisode(srcname, details) {
    const { name, episode, season } = details;

    return addtoQueue(srcname, { name, season, from: episode, to: episode });
}

function searchAndAddSeason(srcname, details) {
    const { name, season } = details;

    return addtoQueue(srcname, { name, season });
}

function start(cb) {
    return Q.Promise((resolve, reject) => {
        let infos = utils.getInfosData(INFOS_PATH);

        global.NOMORE = false;
        
        clearQueue(err => {
            if (!err) {
                infos.queue = -1;
                utils.BuildNextElement(infos, INFOS_PATH, () => {
                    resolve();
                    parseQueue();
                })
            } else {
                reject(err);
                global.NOMORE = true;
            }
        });
    })
}

function stop(name) {
    global.NOMORE = true;
    if (global.Dl)
        global.Dl.pause();
}

add(["4helal", "cera", "cimaclub", "mosalsl"]);

module.exports = {
    addtoQueue,
    start,
    stop,
    clearQueue,
    addOnetoQueue,
    searchAndAddEpisode,
    searchAndAddSeason
};
