const http = require("http");
const express = require("express");
const path = require("path");
const os = require("os")
const app = express();
const config = require("./modules/config");
const server = http.createServer(app);
const sources = require("./sources/sources");
const utils = require("./utils/utils");
const bodyParser = require('body-parser');
const nodeCleanup = require('node-cleanup');
const dbHandler = require("./modules/db-handler");


global.Files = []; // medias array to store the videos in it
global.NOMORE = true; // this variable is telling weather the server is running or not

// using middelwares
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(bodyParser.json());
app.use(express.static("app", {
    maxAge: 3600000
}));

// the main app routes
require("./modules/routes")(app);

// creating new instance of socketio
global.io = require("./modules/socketio")(server);
// enable the logger
require("./modules/logging")(global.io);

// initialize the thumbs delete or create them
require("./modules/thumbs").init(() => {
    // enable files Watcher
    require("./modules/fileWatcher")();
});

// watch tvshowtime feed
require("./modules/tvShowTime").watch((data, next) => {
    // add episode to the queue
    sources.addtoQueue(data, data.from).then(() => {
        _log(`Found ${data.keyword} From tvShowTime`);
        let infos = utils.getInfosData(config('INFOS_PATH')),
            showsTo = infos['tvshowtimefeed'];

        // update the infos with the new details
        showsTo[data.index]['lastSeason'] = data.season;
        showsTo[data.index]['lasEpisode'] = data.number;

        utils.UpdateInfosData({
            tvshowtimefeed: showsTo
        }, config('INFOS_PATH'), () => {
            next();
            const imediateStart = config('START_SERVER_WHENE_FOUND');
            if (imediateStart) {
                sources.start();
            }
        });
    });
});

// attach function to the server error event to catch errors
server.on("error", err => console.log(`Can't start http server. ${err.toString()}`.red, true));

// start the server
// server.listen(config('PORT'), () => {
//     // get the local ip address
//     const ip = require("ip").address();
//
//     // _log is the interval console.log
//     _log(`Server is up and running access it at: http://${ip}:${config('PORT')}`);
// });

// kill curl in exit
nodeCleanup(() => {
    if (global.Dl) global.Dl.getCurl().kill();
})

// TODO: add providers automaticaly
