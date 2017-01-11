const http = require("http");
const express = require("express");
const path = require("path");
const os = require("os")
const app = express();

const server = http.createServer(app);
const sources = require("./sources/sources");


global.fileDowns = [];
global.SAVETOFOLDER = path.join(__dirname, "../Tv Shows");
global.PORT = 8888;
global.Files = [];

global.NOMORE = false; // for stop and resume downloading 

app.use(express.static("app", { maxAge: 3600000 }));

require("./modules/routes")(app);
require("./modules/socketio")(server);
require("./modules/thumbs").init(() => {
    global.downloadsWatcher = require("./modules/fileWatcher")();
});

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
/*sources.addtoQueue('mosalsl', {name: "The BlackList", season: 4, from: 9}).then(() => {

});*/ // or from = "start", to="finish" add Url to the object for future adding*/

//sources.start()

require('dns').lookup(require('os').hostname(), function(err, add, fam) {
    server.listen(global.PORT, () => {
        console.log(`Server is up and running access it at: http://${add}:${global.PORT}`)
    });
})

// TODO: Add search for mosalsl
