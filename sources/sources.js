const Q = require("q");
const downloader = require("../modules/downloader");
const utils = require("../utils/utils");
const colors = require("colors");
const path = require("path");
const fs = require("fs");
const config = require("../modules/config");
const dbHandler = require("../modules/db-handler");

// load the dbs
const infosdb = new dbHandler(config("INFOS_PATH"), {
    queue: "0",
    sources: [],
    tvshowtimefeed: []
});

const queuedb = new dbHandler(config("QUEUEPATH"), []);

function get(name) {
    // find the source by name
    const source = infosdb.find("sources", {
        name
    }).value();

    // if the source is not found
    if (!source) throw (new Error("This source can't be found"));

    // if found return its name with the js file
    return {
        name,
        require: require(`./${name}`)
    };
}

function add(arr) {
    // adds to the infos db
}

function MoveToNext(details, notDone) { // details are episode name, number season
    if (global.NOMORE) return; // this will return without doing nothing if the parsing is Stopped

    queuedb.db().find(details).assign({
        done: !not,
        tried: true
    }).write(); // update the queue element with done and tried

    BuildNextElement(queuedb.get("queue").value()).then(() => {
        parseQueue();
    }); // build the next element means add one to queue index
}

function parseQueue() {
    const queueData = queuedb.db(), // get the db instance
        index = infosdb.get("queue").value(), // get the queue index
        episodeEl = queueData.value()[index]; // get the queue index

    if (queueData.value().length === 0 || !episodeEl) {
        console.log("All Done".green);
        global.NOMORE = true; // stop the parsing
        return; // exit this function with nothing
    }

    episodeEl.index = parseInt(index); // add the index to it cause its needed in some functions

    if (!episodeEl.done) {
        getMediaUrlFor({
            name: el.provider,
            prov: 0,
            code: null,
            index: null
        }, episodeEl); // the episodeEl here is called details in some functions
    } else {
        MoveToNext(episodeEl); //if the episodeEl is already downloaded move to the next one
    }
}

function TryNextProv(src, data, details, code) {
    src.canNextProvider(data.prov).then(num => {
        // build up the next data to be sent to the getMediaUrl and then to the downloader
        data = {
            name: data.name,
            prov: num,
            code
        };
        // here where is the downloader being called
        getMediaUrlFor(data, details, true);
    }).catch(() => {
        MoveToNext(details, true); // details is the episode name and season and episode Number
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
        if (url) console.log(`Url Found ${url}`.green);
        // add needed information to the details to determine the exact file in downloads data
        details.providerCode = data.prov;
        details.code = code;

        return downloader(url, details, overWrite)
    }).then(() => {
        console.log("Next Element".green)
        MoveToNext(details);
    }).catch(({
        next,
        code
    }) => {
        if (next == undefined) {
            TryNextProv(src, data, details, code)
        } else {
            console.log("Passing this episode".red);
            MoveToNext(details, true); // move to the next one
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
            let infos = utils.getInfosData(config('INFOS_PATH')); // can be improved
            details.providerUrl = url;

            infos.providers[provider] = {
                url: url,
                name: details.keyword,
                season: details.season
            };

            utils.UpdateInfosData({
                providers: infos.providers
            }, config("INFOS_PATH"));

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

function clearQueue() {
    // retreive queue data
    const data = queuedb.db();

    // check if the data is empty if so reject the promise
    if (data.value().length == 0) return Promise.reject("Data is empty please try again.");

    //if all good the resolve the promise
    return Promise.resolve();
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

function BuildNextElement(index = -1) { // the queue index default to -1
    const db = queuedb.db(),
        data = db.value(),
        // if the index is the last one do not repeat those who are already tried
        results = db.filter(item => !item.done && (parseInt(index) != (data.length - 1) ? true : !item.tried));

    index = (parseInt(index) + 1).toString(); // this simply adds one to the index and converts it to a string
    if (parseInt(index) > (data.length - 1) && results.length > 0) infos.queue = "0"; // this returns to the first element in the queue

    infosdb.update("queue", index); // update the queue index in infos db
    return Promise.resolve(); // resolve the promise
}

function start(index) {
    if (!global.NOMORE) return Promise().resolve(); // if the parsing is already started then do nothing

    global.NOMORE = false; // set the parsing as started (NOTE: this will change later)

    // remove finished episodes
    return clearQueue().then(() => {
        // build the next episode
        return BuildNextElement(index == null ? -1 : index).then(() => { // if the we have an index set it to it or use -1
            _log("Parsing Started".yellow); // log to the terminal that the parse is started
            parseQueue();
        });
    }).catch(err => {
        console.log(err.red); // log the error to the client

        global.NOMORE = true; // set the parsing to stopped (NOTE: this will change later)
        return err; // return the error
    })
}

function stop(name) {
    global.NOMORE = true; // should be changed to something more convinient
    _log("Parsing Stopped".yellow);
    if (global.Dl) global.Dl.pause(); // pause the download
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
    parseProviderFromUrl,
    BuildNextElement
};
