const downloader = require('../modules/downloader');

function get(name) {
    const source = global.infosdb.db().get('sources').find({
        name
    }).value(); // find the source by name

    if (!source) throw (new Error('This source can\'t be found')); // if the source is not found

    // if found return the js file as form of require
    return require(`./${name}`);
}

function getSources() {
    return global.infosdb.db().get('sources').value();
}

function MoveToNext(details, notDone) { // details are episode name, number season
    if (global.NOMORE) return; // this will return without doing nothing if the parsing is Stopped

    global.queuedb.db().get('queue').find({
            url: details.url
        })
        .assign({
            done: !notDone,
            tried: true
        })
        .write(); // update the queue element with done and tried

    BuildNextElement(global.infosdb.db().get('queue').value()).then(() => {
        parseQueue();
    }); // build the next element means add one to queue index
}

function parseQueue() {
    const queueData = global.queuedb.db().get('queue'); // get the db instance
    const index = global.infosdb.db().get('queue').value(); // get the queue index
    const episodeEl = queueData.value()[index]; // get the queue index

    if (queueData.value().length === 0) { // check if theres more episodes
        console.log('All Done'.green);
        global.NOMORE = true; // stop the parsing
        return; // exit this function with nothing
    }

    if (!episodeEl.done || !episodeEl) { // if the episode is done or does not exist
        // add the index to it cause its needed in some functions
        episodeEl.index = parseInt(index, 10);

        getMediaUrlFor({
            name: episodeEl.provider,
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
        getMediaUrlFor({
            name: data.name,
            prov: num,
            code
        }, details, true); // here where is the downloader being called
    }).catch(() => {
        MoveToNext(details, true); // details is the episode name and season and episode Number
    });
}

function getMediaUrlFor(data, details, overWrite) {
    const src = get(data.name);

    src.parseUrl(details, data.code).then(code => {
            if (!code) {
                console.log('Can\'t parse this url check again'.red);
                return Promise.reject({
                    next: true
                });
            }
            return src.decodeForProvider(code, data.prov).then(url => ({
                url,
                code
            }));
        }).then(({
            url,
            code
        }) => {
            const newDetails = details;
            if (url) console.log(`Url Found ${url}`.green);
            // add needed information to the details to determine the exact file in downloads data
            newDetails.providerCode = data.prov;
            newDetails.code = code;

            return downloader(url, newDetails, overWrite);
        })
        .then(() => {
            console.log('Next Element'.green);
            MoveToNext(details);
        })
        .catch(({
            next,
            code
        }) => {
            if (next === undefined) {
                TryNextProv(src, data, details, code);
            } else {
                console.log('Passing this episode'.red);
                MoveToNext(details, true); // move to the next one
            }
        });
}


function addtoQueue(details, ParticularEpisode, withoutSearch) {
    return search({
        index: 0,
        details,
        ParticularEpisode,
        withoutSearch
    }).then(({
        url,
        provider
    }) => {
        const newDetails = details;
        newDetails.providerUrl = url; // Add url to the details
        // this tels the provider to add the episodes to the queue
        return get(provider).addToQueueFromTo(newDetails);
    });
}

function clearQueue() {
    const data = global.queuedb.db().get('queue'); // retreive queue data
    data.remove(item => item.done).write(); // remove finished items

    if (data.value().length === 0) {
        // check if the data is empty if so reject the promise
        return Promise.reject('Data is empty please try again.');
    }

    //if all good the resolve the promise
    return Promise.resolve();
}

function search({
    index,
    details,
    ParticularEpisode,
    withoutSearch
}) {
    if (withoutSearch) return Promise.resolve(withoutSearch);

    // get the source from db using an index (NOTE: this has to change)
    const provName = global.infosdb.db().get(`sources[${index}]`).value().name;
    const prov = get(provName); // get the source require

    let itemIndex = index;

    if (!prov.cansearch()) return Promise.reject();

    return prov.search(details, ParticularEpisode).then(url => ({
        url,
        provider: provName
    })).catch(() => {
        // this means that we got into all sources but nothing returened
        if ((getSources().length - 1) === itemIndex) return Promise.reject('Nothing found');
        // if we still have sources the search into the next one
        return search({
            index: ++itemIndex,
            details,
            ParticularEpisode
        });
    });
}

function BuildNextElement(index = -1) { // the queue index default to -1
    const db = global.queuedb.db().get('queue');
    const data = db.value();
    // if the index is the last one do not repeat those who are already tried
    const results = db.filter(item =>
        !item.done && (parseInt(index, 10) !== (data.length - 1) ? true : !item.tried)
    );

    let itemIndex = index; // for the index and easy typing

    // this simply adds one to the index and converts it to a string
    itemIndex = (parseInt(itemIndex, 10) + 1).toString();

    // this returns to the first element in the queue
    if (parseInt(itemIndex, 10) > (data.length - 1) && results.length > 0) {
        global.infosdb.db().set('queue', '0').write();
    }

    global.infosdb.db().set('queue', itemIndex).write(); // update the queue index in infos db
    return Promise.resolve(); // resolve the promise
}

function start(index) {
    let itemIndex = index;

    // if the parsing is already started then do nothing
    if (!global.NOMORE) return Promise().resolve();

    global.NOMORE = false; // set the parsing as started (NOTE: this will change later)

    // remove finished episodes
    return clearQueue().then(() => {
        // if the we have an index set it to it or use -1
        itemIndex = itemIndex == null ? -1 : itemIndex;

        // build the next episode
        return BuildNextElement(itemIndex).then(() => {
            global.log('Parsing Started'.yellow); // log to the terminal that the parse is started
            parseQueue();
        });
    }).catch(err => {
        console.log(err.red); // log the error to the client

        global.NOMORE = true; // set the parsing to stopped (NOTE: this will change later)
        return err; // return the error
    });
}

function stop() {
    global.NOMORE = true; // should be changed to something more convinient
    global.log('Parsing Stopped'.yellow);
    if (global.Dl) global.Dl.pause(); // pause the download
}

function parseProviderFromUrl(url) {
    return global.infosdb.db().get('sources')
        .filter(source => url.indexOf(get(source.name).Url) > -1)
        .value()[0].name; // get the source by url
}

module.exports = {
    addtoQueue,
    start,
    stop,
    clearQueue,
    search,
    parseProviderFromUrl,
    BuildNextElement
};
