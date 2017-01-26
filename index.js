const http = require("http");
const express = require("express");
const path = require("path");
const os = require("os")
const app = express();
const config = require("./modules/config");
const server = http.createServer(app);
const sources = require("./sources/sources");
const utils = require("./utils/utils");

global.fileDowns = [];
global.Files = [];
global.NOMORE = true; // for stop and resume downloading 

app.use(express.static("app", { maxAge: 3600000 }));

require("./modules/routes")(app);
global.io = require("./modules/socketio")(server);
require("./modules/logging")(global.io);

require("./modules/thumbs").init(() => {
    require("./modules/fileWatcher")();
});

require("./modules/tvShowTime").watch(data => {
    sources.addtoQueue(data).then(() => {
        let infos = utils.getInfosData(config('INFOS_PATH')),
            showsTo = infos['tvshowtimefeed'];

        showsTo[data.index]['lastSeason'] = data.season;
        showsTo[data.index]['lasEpisode'] = data.number;

        utils.UpdateInfosData(infos, config('INFOS_PATH'), () => {
            const imediateStart = config('START_SERVER_WHENE_FOUND');
            if (imediateStart && !global.NOMORE) {
                //sources.start();
            }
        });
    });
});

//overwrite console.log

/*sources.searchAndAddEpisode('mosalsl', {name: "The BlackListsdfsdfdsf", season: 2, episode: 3}).then(() => {
    console.log("all good")
}).catch(NoUrl => {
    console.log("something went wrong")
});*/

/*sources.searchAndAddSeason('cera', {name: "Breaking Bad", season: 4}).then(() => {
    console.log("Done")
}).catch(err => {
    console.log(err)
})*/

//sources.addOnetoQueue('mosalsl', {url, name, episode, season})
/*sources.addtoQueue({keyword: "Breaking Bad", season: 5, from: 1}).then(() => {
    console.log("done")
}); // or from = "start", to="finish" add Url to the object for future adding*/

require('dns').lookup(require('os').hostname(), function(err, add) {
    server.on("error", err => {
        console.log(`Can't start http server. ${err.toString()}`.red, true);
    });
    server.listen(config('PORT'), () => {
        console.log(`Server is up and running access it at: http://${add}:${config('PORT')}`, true)
    });
})

// TO ADD cinemalek
// TODO: check for last queue element error Unexpected end of JSON input
