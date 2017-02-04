const Q = require("q");
const downloader = require("../modules/downloader");
const utils = require("../utils/utils");
const colors = require("colors");
const path = require("path");
const fs = require("fs");
const config = require("../modules/config");

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
        let infos = utils.getInfosData(config('INFOS_PATH'));

        utils.ElementDone(config('QUEUEPATH'), key).then(() => {
            _log(key);
            utils.BuildNextElement(infos, config('INFOS_PATH'), config('QUEUEPATH'), i => {
                infos = i;
                parseQueue(name, 0);
            });
        }).catch(() => { global.NOMORE = true });
    }
}

function parseQueue() {
    let infos = utils.getInfosData(config('INFOS_PATH'));

    utils.getQueueValue(config('QUEUEPATH'), parseInt(infos.queue)).then(el => {
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
        getMediaUrlFor(data, details, true);
    }).catch(() => {
        MoveToNext(data.name, details.index)
    })
}

function getMediaUrlFor(data, details, overWrite) {
    const src = get(data.name);

    src.parseUrl(details, data.code).then(code => {
        if (!code) {
            console.log("Can't parse this url check again".red);
            console.log("Passing this episode".red);

            MoveToNext(data.name, details.index)
            return;
        }

        src.decodeForProvider(code, data.prov, overWrite).then(url => {
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

    utils.addToQueue(config('QUEUEPATH'), arr);
}

function addtoQueue(details, ParticularEpisode) {
    return Q.Promise((resolve, reject) => {
        search(0, details, ParticularEpisode, ({ url, provider }) => {
            let infos = utils.getInfosData(config('INFOS_PATH'));
            details.providerUrl = url;

            infos.providers[provider] = { url: url, name: details.keyword, season: details.season };

            utils.UpdateInfosData(infos, config('INFOS_PATH'));

            get(provider).addToQueueFromTo(details, config('QUEUEPATH')).then(() => {
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
    utils.clearQueue(config('QUEUEPATH'), cb);
}

function search(index, details, ParticularEpisode, success, error) {
    const prov = sources[index].require;

    let infos = utils.getInfosData(config('INFOS_PATH'));
    let SearchInfos = infos.providers[prov.name];

    if (SearchInfos) {
        SearchInfos.name = SearchInfos.name ? SearchInfos.name.toLowerCase() : null;
        SearchInfos.season = SearchInfos.season ? SearchInfos.season : null;
    }

    details.keyword = details.keyword.toLowerCase();

    if (!ParticularEpisode && SearchInfos && SearchInfos.name === details.keyword && SearchInfos.season === details.season) {
        success({ url: infos.providers[prov.name].url, provider: prov.name });
    } else {
        if (prov.cansearch()) {
            prov.search(details, ParticularEpisode).then(url => {
                success({ url, provider: prov.name });
            }).catch(err => {
                if (index === (sources.length - 1)) {
                    error(err);
                } else {
                    search(++index, details, ParticularEpisode, success, error);
                }
            });
        } else {
            if (index === (sources.length - 1)) {
                error("Can't Find anything");
            } else {
                search(++index, details, ParticularEpisode, success, error);
            }
        }
    }
}

function start(index) {
    return Q.Promise((resolve, reject) => {
        if (!global.NOMORE) return resolve();
        let infos = utils.getInfosData(config('INFOS_PATH'));

        global.NOMORE = false;

        clearQueue(err => {
            if (!err) {
                infos.queue = index || -1;
                utils.BuildNextElement(infos, config('INFOS_PATH'), config("QUEUEPATH"), () => {
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
    _log("Parsing Stopped".yellow);
    if (global.Dl) global.Dl.pause();
}

add(["4helal", "cera", "cimaclub", "mosalsl"]);

module.exports = {
    addtoQueue,
    start,
    stop,
    clearQueue,
    addOnetoQueue,
    search
};
