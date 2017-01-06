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


//sources.start("cera");

require('dns').lookup(require('os').hostname(), function(err, add, fam) {
    server.listen(global.PORT, () => {
        console.log(`Server is up and running access it at: http://${add}:${global.PORT}`)
    });
})

// TODO: Add search for mosalsl
