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

global.fileDowns = [];
global.Files = [];
global.NOMORE = true;
 
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static("app", { maxAge: 3600000 }));

require("./modules/routes")(app);
global.io = require("./modules/socketio")(server);
require("./modules/logging")(global.io);

require("./modules/thumbs").init(() => {
    require("./modules/fileWatcher")();
});

require("./modules/tvShowTime").watch((data, next) => {
    sources.addtoQueue(data, data.from).then(() => {
        _log(`Found ${data.keyword} From tvShowTime`);
        let infos = utils.getInfosData(config('INFOS_PATH')),
            showsTo = infos['tvshowtimefeed'];

        showsTo[data.index]['lastSeason'] = data.season;
        showsTo[data.index]['lasEpisode'] = data.number;

        utils.UpdateInfosData(infos, config('INFOS_PATH'), () => {
            next();
            const imediateStart = config('START_SERVER_WHENE_FOUND');
            if (imediateStart) {
                sources.start();
            }
        });
    });
});

//sources.addOnetoQueue('mosalsl', {url, name, episode, season});

require('dns').lookup(require('os').hostname(), function(err, add) {
    server.on("error", err => {
        console.log(`Can't start http server. ${err.toString()}`.red, true);
    });
    server.listen(config('PORT'), () => {
        console.log(`Server is up and running access it at: http://${add}:${config('PORT')}`, true)
    });
})

// TO ADD cinemalek
// TO ADD notification 'https://api.simplepush.io/send/8BQi8a/Wow/So easy'
// TODO: check for last queue element error Unexpected end of JSON input