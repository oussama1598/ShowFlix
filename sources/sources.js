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
            sources.push({
                name,
                require: require(`./${name}`)
            });
        });
    }
}

function MoveToNext(name, key, notDone) {
    if (!global.NOMORE) {
        let infos = utils.getInfosData(config('INFOS_PATH'));

        utils.ElementDone(config('QUEUEPATH'), key, notDone).then(() => {
            utils.BuildNextElement(infos, config('INFOS_PATH'), config('QUEUEPATH'), i => {
                infos = i;
                parseQueue();
            });
        }).catch(() => {
            global.NOMORE = true
        });
    }
}

function parseQueue() {
    let infos = utils.getInfosData(config('INFOS_PATH'));

    utils.getQueueValue(config('QUEUEPATH'), parseInt(infos.queue)).then(el => {
        el.index = parseInt(infos.queue);

        if (!el.done) {
            getMediaUrlFor({
                name: el.provider,
                prov: 0,
                code: null,
                index: null
            }, el);
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
        data = {
            name: data.name,
            prov: num,
            code,
            index
        };
        getMediaUrlFor(data, details, true);
    }).catch(() => {
        MoveToNext(data.name, details.index, true)
    })
}

function getMediaUrlFor(data, details, overWrite) {
    const src = get(data.name);

    src.parseUrl(details, data.code).then(code => {
        if (!code) {
            console.log("Can't parse this url check again".red);
            return Promise.reject({
                next: true
            });
        }
        return src.decodeForProvider(code, data.prov).then(url => {
            return {
                url,
                code
            };
        });
    }).then(({
        url,
        code
    }) => {
        console.log(`Url Found ${url}`.green);
        return downloader.download(url, details, data.index, overWrite, code)
    }).then(() => {
        console.log("Next Element".green)
        MoveToNext(data.name, details.index)
    }).catch(({
        next,
        index,
        code
    }) => {
        if (index == null || index != undefined) TryNextProv(src, data, details, code, index);
        if (next != undefined) {
            console.log("Passing this episode".red);
            MoveToNext(data.name, details.index, true)
        }
    })
}


function addtoQueue(details, ParticularEpisode, withoutSearch) {
    return Q.Promise((resolve, reject) => {
        search({
            index: 0,
            details,
            ParticularEpisode,
            withoutSearch
        }, ({
            url,
            provider
        }) => {
            let infos = utils.getInfosData(config('INFOS_PATH'));
            details.providerUrl = url;

            infos.providers[provider] = {
                url: url,
                name: details.keyword,
                season: details.season
            };

            utils.UpdateInfosData({providers: infos.providers}, config("INFOS_PATH"));

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

function search({
    index,
    details,
    ParticularEpisode,
    withoutSearch
}, success, error) {
    if (withoutSearch) return success(withoutSearch);

    const prov = sources[index].require;

    let infos = utils.getInfosData(config('INFOS_PATH'));
    let SearchInfos = infos.providers[prov.name];

    if (SearchInfos) {
        SearchInfos.name = SearchInfos.name ? SearchInfos.name.toLowerCase() : null;
        SearchInfos.season = SearchInfos.season ? SearchInfos.season : null;
    }

    details.keyword = details.keyword.toLowerCase();

    if (!ParticularEpisode && SearchInfos && SearchInfos.name === details.keyword && SearchInfos.season === details.season) {
        success({
            url: infos.providers[prov.name].url,
            provider: prov.name
        });
    } else {
        if (prov.cansearch()) {
            prov.search(details, ParticularEpisode).then(url => {
                success({
                    url,
                    provider: prov.name
                });
            }).catch(err => {
                if (index === (sources.length - 1)) {
                    error(err);
                } else {
                    search({
                        index: ++index,
                        details,
                        ParticularEpisode
                    }, success, error);
                }
            });
        } else {
            if (index === (sources.length - 1)) {
                error("Can't Find anything");
            } else {
                search({
                    index: ++index,
                    details,
                    ParticularEpisode
                }, success, error);
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
                infos.queue = index === null ? -1 : index;

                utils.BuildNextElement(infos, config('INFOS_PATH'), config("QUEUEPATH"), () => {
                    _log("Parsing Started".yellow);
                    resolve();
                    parseQueue();
                });
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

function parseProviderFromUrl(url) {
    for (source of sources) {
        if (url.indexOf(source.require.Url) > -1) {
            return source.name;
            break;
        }
    }

    return null;
}

add(["cimaclub", "4filmk", "cera", "seri-ar", "4helal", "mosalsl"]);

module.exports = {
    addtoQueue,
    start,
    stop,
    clearQueue,
    search,
    parseProviderFromUrl
};
