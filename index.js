const sources = require("./sources/sources")
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
            sources("cera", infos, 0);
        });
        res.send("Went to " + infos.episode);
    }
})

sources.initialize("4helal").then(() => {
	sources.getMediaUrlFor("4helal", 0)
});

//sources.getMediaUrlFor("cera", 0);

//app.listen(8888);


//TODO:  source inhertins
//TODO:  season detecteion