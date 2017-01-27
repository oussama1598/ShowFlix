const fs = require("fs");
const path = require("path");
const pump = require("pump");
const tvShowsData = require("./tvshowsData");
const stream = require("./stream");
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


    app.get("/medias", (req, res) => {
        if (utils.cache().get("medias")) return res.send(utils.cache().get("medias"));

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
                .then(Files => { res.json(Files);
                    utils.cache().set("medias", Files); })
                .catch(Files => { res.json(Files);
                    utils.cache().set("medias", Files); });
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
        if (!req.query.keyword || isNaN(req.query.season)) return res.send({ status: false, error: "Can't find any url" });
        sources.search(0, { keyword: req.query.keyword, season: parseInt(req.query.season) }, data => {
            res.send({ status: true, url: data.url });
        }, error => {
            res.send({ status: false, error })
        })
    })

    app.get("/shows/:page", (req, res) => {
        if (isNaN(req.params.page)) return res.send({});
        if (utils.cache().get(`shows/${req.params.page}`)) return res.send(utils.cache().get(`shows/${req.params.page}`));

        tvShowsData.getShows(parseInt(req.params.page)).then(data => {

            utils.cache().set(`shows/${req.params.page}`, JSON.parse(data));
            res.send(JSON.parse(data));
        }).catch(err => {
            res.send({});
        })
    })

    app.post("/queue", (req, res) => {
        let { name, season, episode } = req.body;

        season = utils.fixInt(season);
        episode = utils.fixInt(episode);

        if (name === null || season === null || episode === null) return res.send({ status: false, error: "data not completed" });


        utils.deleteFromQueue({name, episode, season}, config("QUEUEPATH")).then(() => {
             res.send({status: true});
         }).catch(error => {
            res.send({status: false, error})
         });
    })

    app.post("/addToqueue", (req, res) => {
        let { keyword, season, to, from } = req.body;

        season = utils.fixInt(season);
        to = utils.fixInt(to);
        from = utils.fixInt(from);

        if (keyword === null || season === null || from === null || to === null) return res.send({ status: false, error: "data not completed" });
        if(to < from) return res.send({status: false, error: "from can't be less that to"});

        sources.addtoQueue({ keyword, season, from, to }).then(() => {
            res.send({status: true})
        }).catch(error => {
            res.send({status: false, error})
        });
    })
}
