const sources = require("./sources/sources")
const infos = require("./infos.json");
const express = require("express");
const app = express();

global.fileDowns = [];

app.get("/", (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(global.fileDowns, null, 3));
})

app.get("/goTo", (req, res) => {
    if (req.query.to) {
        infos.episode = req.query.to;
        updateJSON(infos, () => {
            sources("4helal", infos, 0);
        });
        res.send("Went to " + infos.episode);
    }
})

sources("4helal", infos, 0);

app.listen(8888);
