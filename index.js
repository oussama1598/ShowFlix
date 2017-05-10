const http = require('http');
const express = require('express');
const config = require('./modules/config');
const bodyParser = require('body-parser');
const DbHandler = require('./modules/db-handler');
const IP = require('ip');
const path = require('path');

// project modules
const routes = require('./routes');
const socketIO = require('./modules/socketio');
const logger = require('./modules/logger');
const thumbs = require('./modules/thumbs');
const torrentEngine = require('./modules/torrentEngine');
const parser = require('./modules/parser');
const mediasHandler = require('./modules/mediasHandler');
const tvShowTime = require('./lib/tvShowTime')
  .setParams(
    config('TV_SHOWS_TIME_API.FEED_FREQUENCY'),
    config('TV_SHOWS_TIME_API.ACCESS_TOKEN'),
    () => global.infosdb.get('tvshowtimefeed')
    .value());


// middlewares
const expressValidator = require('./middlewares/expressValidator');
const errorHandler = require('./middlewares/errorHandler');

// init express and assign it to http server
const app = express();
const server = http.createServer(app);

global.RUNNING = false; // this variable is telling weather the server is running or not

// using middelwares
app.use(express.static('app', {
  maxAge: 3600000,
}));
app.use(bodyParser.urlencoded({
  extended: false,
}));
app.use(bodyParser.json());
app.use(expressValidator());
// the main app routes
routes(app);
app.use((req, res) => {
  res.status(404)
    .sendFile(path.join(__dirname, './app/404.html'));
});
app.use(errorHandler());

// init dbs as global instances
global.infosdb = new DbHandler(config('INFOS_PATH'), {
  queue: '0',
  tvshowtimefeed: [],
});
global.queuedb = new DbHandler(config('QUEUEPATH'), {
  lastId: 0,
  queue: [],
});

global.downloadsdb = new DbHandler(config('DOWNLOADS_QUEUE_PATH'), {
  lastId: 0,
  downloads: [],
});

global.filesdb = new DbHandler(config('FILES_PATH'), {
  lastId: 0,
  files: [],
});
// creating new instance of socketio
global.io = socketIO(server);
// enable the logger
logger(global.io);
// initialize the thumbs delete or create them
mediasHandler()
  .then(() => {
    thumbs();
  });
// webtorrent engine
torrentEngine();

// watch tvshowtime feed
tvShowTime
  .watch()
  .on('found', (data) => {
    // add episode to the queue
    parser.addtoQueue(data.keyword, data.season, data.from)
      .then(() => {
        console.log(`new Episode found of ${data.keyword}`);
        // get last element's index
        const lastIndex = global.queuedb.get()
          .value()
          .length - 1;

        global.infosdb
          .update({
            name: data.keyword,
          }, {
            lastSeason: data.season,
            lastEpisode: data.number,
          }, 'tvshowtimefeed');
        if (config('START_SERVER_WHENE_FOUND')) parser.start(lastIndex - 1);
      })
      .catch(() => {});
  });

// attach function to the server error event to catch errors
server.on('error', err => global.log(`Can't start http server. ${err.toString()}`.red));
// start the server
server.listen(config('PORT'), () =>
  global.log(`Server is up and running access it at: http://${IP.address()}:${config('PORT')}`));

// TODO: add id for specific entries in the db for performance
