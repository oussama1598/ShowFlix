const fs = require("fs");
const path = require("path");
const pump = require("pump");
const tvShowsData = require("./tvshowsData");
const stream = require("./stream");
const utils = require("../utils/utils");
const sources = require("../sources/sources");
const downloadsCtrl = require("../controllers/downloadsCtrl");
const tvshowTime = require("./tvShowTime");
const mediasHandler = require("./mediasHandler");
const async = require("async");
const config = require("./config");
const apiRoutes = require("express").Router();

module.exports = app => {

    apiRoutes.get("/downloads", (req, res) => {
        res.send(downloadsCtrl.getAll());
    })

    app.get("/queue", (req, res) => {
        res.send(utils.getQueueSync(config("QUEUEPATH")));
    })


    app.get("/medias", (req, res) => {
        if (utils.cache().get("medias")) return res.send(utils.cache().get("medias"));

        mediasHandler.getMedias().then(Files => {
            res.json(Files);
            utils.cache().set("medias", Files);
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
        }).catch(error => {
            res.send({ status: false, error });
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
        if (!global.NOMORE) return res.send({ running: NOMORE, error: "Can't you should stop the parsing first" });
        if (req.query.index && isNaN(parseInt(req.query.index))) return res.send({ running: !NOMORE, error: "The index must be a number" });


        const index = req.query.index ? parseInt(req.query.index) - 1 : null;
        sources.start(index).then(() => {
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
        res.send({
            running: !NOMORE,
            queueIndex: utils.getInfosData(config("INFOS_PATH")).queue,
            queueCount: utils.getQueueSync(config("QUEUEPATH")).length
        });
    })

    app.get("/search", (req, res) => {
        if (!req.query.keyword || isNaN(req.query.season)) return res.send({ status: false, error: "Can't find any url" });
        sources.search({
            index: 0,
            details: {
                keyword: req.query.keyword,
                season: parseInt(req.query.season)
            },
            ParticularEpisode: req.query.episode
        }, data => {
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


        utils.deleteFromQueue({ name, episode, season }, config("QUEUEPATH")).then(() => {
            res.send({ status: true });
        }).catch(error => {
            res.send({ status: false, error })
        });
    })

    app.post("/addToqueue", (req, res) => {
        if (!req.body) return res.send({ status: false, error: "data not completed" });

        let { keyword, season, to, from } = req.body, provName;
        season = utils.fixInt(season);
        from = utils.fixInt(from);

        if (!keyword || !season || !from || !to) return res.send({ status: false, error: "data not completed" });
        if (to !== "f" && to < from) return res.send({ status: false, error: "from can't be less that to" });

        if (req.body.url) {
            provName = sources.parseProviderFromUrl(req.body.url);
            if (!provName) return res.send({ status: false, error: "Url provider not found" });
        }

        const Url = provName ? {
            url: decodeURI(req.body.url),
            provider: provName
        } : null;

        sources.addtoQueue({ keyword, season, from, to }, null, Url).then(() => {
            res.send({ status: true })
        }).catch(error => {
            _log(error);
            res.send({ status: false, error })
        });
    })

    // use apiRoutes in the /api route
    app.use("/api", apiRoutes);
}
