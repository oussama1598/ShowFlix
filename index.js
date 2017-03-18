const http = require('http');
const express = require('express');
const config = require('./modules/config');
const sources = require('./sources/sources');
const bodyParser = require('body-parser');
const nodeCleanup = require('node-cleanup');
const dbHandler = require('./modules/db-handler');
const IP = require('ip');

// project modules
const routes = require('./modules/routes');
const socketIO = require('./modules/socketio');
const logger = require('./modules/logging');
const thumbs = require('./modules/thumbs');
const fileWatcher = require('./modules/fileWatcher');

// init express and assing it to http server
const app = express();
const server = http.createServer(app);

global.Files = []; // medias array to store the videos in it
global.NOMORE = true; // this variable is telling weather the server is running or not

// using middelwares
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(bodyParser.json());
app.use(express.static('app', {
    maxAge: 3600000
}));

// the main app routes
routes(app);
// creating new instance of socketio
global.io = socketIO(server);
// enable the logger
logger(global.io);
// initialize the thumbs delete or create them
thumbs.init().then(() => {
    // enable files Watcher
    fileWatcher();
});

// init dbs as global instances
global.infosdb = new dbHandler(config('INFOS_PATH'), {
    queue: '0',
    sources: [],
    tvshowtimefeed: []
});
global.queuedb = new dbHandler(config('QUEUEPATH'), {
    queue: []
});

// watch tvshowtime feed
require('./modules/tvShowTime').watch(data => {
    // add episode to the queue
    sources.addtoQueue(data, data.from).then(() => {
        // get last element's index
        const lastIndex = global.queuedb.db().get('queue').value().length - 1;
        global.log(`Found ${data.keyword} From tvShowTime`);
        global.infosdb.db().get('tvshowtimefeed').find({
                name: data.keyword
            })
            .assign({
                lastSeason: data.season,
                lastEpisode: data.number
            })
            .write();
        if (config('START_SERVER_WHENE_FOUND')) sources.start(lastIndex - 1);
    }).catch(() => {});
});

// attach function to the server error event to catch errors
server.on('error', err => console.log(`Can't start http server. ${err.toString()}`.red, true));
// start the server
server.listen(config('PORT'), () =>
    // _log is the interval console.log
    global.log(`Server is up and running access it at: http://${IP.address()}:${config('PORT')}`)
);
// kill curl in exit
nodeCleanup(() => {
    if (global.Dl) global.Dl.getCurl().kill();
});

// TODO: add providers automaticaly
