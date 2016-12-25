const sources = require("./sources/sources")
const express = require("express");
const fs = require("fs");
const app = express();

global.fileDowns = [];
global.SAVETOFOLDER = "../Tv Shows";

app.get("/", (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(global.fileDowns, null, 3));
})

app.get("/goTo", (req, res) => {
    if (req.query.to) {
        infos.episode = req.query.to;
        updateJSON(infos, () => {
            sources("cera", infos, 0);
        });
        res.send("Went to " + infos.episode);
    }
})

app.get("/medias", (req, res) => {
    fs.readdir(global.SAVETOFOLDER, (err, files) => {
        res.send(files);
    })
})

/*sources.initialize("mosalsl").then(() => {
    sources.getMediaUrlFor("mosalsl", 0)
});*/

app.listen(8885);


// TODO: Add search for mosalsl
