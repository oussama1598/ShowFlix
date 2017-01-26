const Q = require("q");
const downloader = require("../modules/downloader");
const utils = require("../utils/utils");
const colors = require("colors");
const path = require("path");
const fs = require("fs");
const config = require("../modules/config");


const QUEUEPATH = config('QUEUEPATH');
const INFOS_PATH = config('INFOS_PATH');

let sources = [];

function get(name) {
    for (key in sources) {
        if (sources[key].name === name)
            return sources[key].require;
    }
    throw (new Error("This source can't be found"));
}

function add(arr) {
    if (arr.constructor === Array) {
        arr.forEach(name => {
            sources.push({ name, require: require(`./${name}`) });
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

function TryNextProv(src, data, details, code, index) {
    src.canNextProvider(data.prov).then(num => {
        data = { name: data.name, prov: num, code, index };
        getMediaUrlFor(data, details);
    }).catch(() => {
        MoveToNext(data.name, details.index)
    })
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
                TryNextProv(src, data, details, code, index);
            })
        }).catch(err => {
           TryNextProv(src, data, details, code, null);
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

function addtoQueue(details) {
    return Q.Promise((resolve, reject) => {
        search(0, details, ({ url, provider }) => {
            let infos = utils.getInfosData(INFOS_PATH);

            details.providerUrl = url;

            infos.providers[provider] = { url: url, name: details.keyword, season: details.season };
            utils.UpdateInfosData(infos, INFOS_PATH);

            get(provider).addToQueueFromTo(details, QUEUEPATH).then(() => {
                resolve();
            }).catch(err => {
                reject(err);
            });
        }, err => {
            reject(err);
        })
    })
}

function clearQueue(cb) {
    utils.clearQueue(QUEUEPATH, cb);
}

function search(index, details, success, error) {
    const prov = sources[index].require;

    let infos = utils.getInfosData(INFOS_PATH);
    let SearchInfos = infos.providers[prov.name];

    if (SearchInfos) {
        SearchInfos.name = SearchInfos.name ? SearchInfos.name.toLowerCase() : null;
        SearchInfos.season = SearchInfos.season ? SearchInfos.season : null;
    }

    details.keyword = details.keyword.toLowerCase();

    if (SearchInfos && SearchInfos.name === details.keyword && SearchInfos.season === details.season) {
        success({ url: infos.providers[name].url, provider: prov.name });
    } else {
        if (prov.cansearch()) {
            prov.search(details).then(url => {
                success({ url, provider: prov.name });
            }).catch(err => {
                if (index === (sources.length - 1)) {
                    error(err);
                } else {
                    search(++index, details, success, error);
                }
            });
        } else {
            if (index === (sources.length - 1)) {
                error("Can't Find anything");
            } else {
                search(++index, details, success, error);
            }
        }
    }
}

function searchAndAddEpisode(details) {
    const { name, episode, season } = details;

    return addtoQueue({ name, season, from: episode, to: episode });
}

function searchAndAddSeason(details) {
    const { name, season } = details;

    return addtoQueue({ name, season });
}

function start() {
    return Q.Promise((resolve, reject) => {
        if(!global.NOMORE) return resolve();
        let infos = utils.getInfosData(INFOS_PATH);

        global.NOMORE = false;

        clearQueue(err => {
            if (!err) {
                infos.queue = -1;
                utils.BuildNextElement(infos, INFOS_PATH, () => {
                    _log("Parsing Started".yellow);
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
    _log("Parsing Started".yellow);
    if (global.Dl) global.Dl.pause();
}

add(["4helal", "cera", "cimaclub", "mosalsl"]);

module.exports = {
    addtoQueue,
    start,
    stop,
    clearQueue,
    addOnetoQueue,
    searchAndAddEpisode,
    searchAndAddSeason,
    search
};
