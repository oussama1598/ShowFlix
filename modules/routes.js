const fs = require("fs");
const path = require("path");
const pump = require("pump");
const tvShowsData = require("./tvshowsData");
const stream = require("./stream");
const apicache = require("apicache");
const utils = require("../utils/utils");

module.exports = app => {

    app.get("/downloads", (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify(global.fileDowns, null, 3));
    })

    app.get("/medias", apicache.middleware("1 day"), (req, res) => {
        let episodes = {};

        global.Files.forEach(file => {
            const metadata = tvShowsData.parseFromFilename(file);

            if (!episodes[metadata.serieName]) episodes[metadata.serieName] = [];

            episodes[metadata.serieName].push({
                filename: path.basename(file),
                serieName: metadata.serieName,
                episode: parseInt(metadata.episode),
                season: parseInt(metadata.season),
                streamUrl: encodeURI(`/stream/${file}`),
                thumbUrl: encodeURI(`/thumb/${file}`)
            })
        });

        tvShowsData.getEpisodeDataByQuery(episodes)
            .then(Files => { res.send(Files) })
            .catch(Files => { res.send(Files) });
    })

    app.get("/stream/:filename", (req, res) => {
        const uri = path.join(global.SAVETOFOLDER, req.params.filename);

        if (!fs.existsSync(uri)) {
            return res.sendStatus(404);
        }

        stream(uri, req, res);
    })

    app.get("/thumb/:filename", (req, res) => {
        const filename = path.basename(req.params.filename, path.extname(req.params.filename)) + ".png",
            thumbPath = path.join(global.thumbsDir, filename);

        if (!fs.existsSync(thumbPath)) return;

        res.type(".png");
        pump(fs.createReadStream(thumbPath), res);
    })
    // TODO to be changed to app.delete();
    app.post("/stream/:filename/delete", (req, res) => {
        const uri = path.join(global.SAVETOFOLDER, req.params.filename);
        //utils.deleteFile(uri).then(() => {
            res.send({ status: true });
        //});
    })
}
