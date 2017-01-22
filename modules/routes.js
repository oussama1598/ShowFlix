const fs = require("fs");
const path = require("path");
const pump = require("pump");
const tvShowsData = require("./tvshowsData");
const stream = require("./stream");
const apicache = require("apicache");
const utils = require("../utils/utils");
const sources = require("../sources/sources");
const tvshowTime = require("../modules/tvShowTime");
const async = require("async");
const config = require("./config");

module.exports = app => {

    app.get("/downloads", (req, res) => {
        res.send(global.fileDowns);
    })

    app.get("/queue", (req, res) => {
        res.send(utils.getQueueSync(config("QUEUEPATH")));
    })

    app.get("/medias", apicache.middleware("1 day"), (req, res) => {
        let episodes = {};

        async.forEach(global.Files, (file, cb) => {
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

            cb();
        }, (err) => {
            tvShowsData.getEpisodeDataByQuery(episodes)
                .then(Files => { res.send(Files) })
                .catch(Files => { res.send(Files) });
        })
    })

    app.get("/stream/:filename", (req, res) => {
        const uri = path.join(config('SAVETOFOLDER'), req.params.filename);

        fs.exists(uri, exists => {
            if (exists) { stream(uri, req, res); } else { res.sendStatus(404) }
        })
    })

    app.get("/thumb/:filename", (req, res) => {
        const filename = path.basename(req.params.filename, path.extname(req.params.filename)) + ".png",
            thumbPath = path.join(global.thumbsDir, filename);

        fs.exists(thumbPath, exists => {
            if (exists) {
                res.type(".png");
                pump(fs.createReadStream(thumbPath), res);
            } else {
                res.sendStatus(404)
            }
        })
    })

    app.delete("/stream/:filename", (req, res) => {
        const uri = path.join(config('SAVETOFOLDER'), req.params.filename);

        utils.deleteFile(uri).then(() => {
            res.send({ status: true });
        });
    })

    app.get("/tvshowfeed", (req, res) => {
        if (!req.query.code) return res.send({ status: "error", error: "code is required" });

        tvshowTime.getAuth(req.query.code).then(access_token => {
            let conf = config();
            conf['ACCESS_TOKEN'] = access_token;
            utils.updateConfig(conf, () => {
                res.redirect("/")
            });
        }).catch(error => {
            res.send({ status: "error", error })
        })

    })

    app.get("/start", (req, res) => {
        sources.start().then(() => {
            res.send({ running: !NOMORE });
        }).catch(error => {
            res.send({ running: !NOMORE, error });
        })
    });

    app.get("/stop", (req, res) => {
        sources.stop();
        res.send({ running: !NOMORE });
    });

    app.get("/state", (req, res) => {
        res.send({ running: !NOMORE });
    })

    app.get("/search", (req, res) => {
        if (!req.query.keyword) return res.send({ status: false, url: "" });
        sources.search(0, { keyword: req.query.keyword, season: req.query.season }, data => {
            res.send({ status: true, url: data.url });
        }, error => {
            res.send({ status: false, error })
        })
    })
}
