const fs = require('fs');
const path = require('path');
const pump = require('pump');
const stream = require('./stream');
const utils = require('../utils/utils');
const sources = require('../sources/sources');
const downloadsCtrl = require('../controllers/downloadsCtrl');
const tvshowTime = require('./tvShowTime');
const mediasHandler = require('./mediasHandler');
const config = require('./config');
const apiRoutes = require('express').Router();

module.exports = app => {
    apiRoutes.get('/downloads', (req, res) => {
        res.send(downloadsCtrl.getAll());
    });

    app.get('/queue', (req, res) => {
        res.send(global.queuedb.db().get('queue').value());
    });


    app.get('/medias', (req, res) => {
        if (utils.cache().get('medias')) return res.send(utils.cache().get('medias'));

        mediasHandler.getMedias().then(Files => {
            res.json(Files);
            utils.cache().set('medias', Files);
        });
    });

    app.get('/stream/:filename', (req, res) => {
        const uri = path.join(config('SAVETOFOLDER'), req.params.filename);

        fs.exists(uri, exists => {
            if (exists) {
                stream(uri, req, res);
            } else {
                res.sendStatus(404);
            }
        });
    });

    app.get('/thumb/:filename', (req, res) => {
        const basename = path.basename(req.params.filename, path.extname(req.params.filename));
        const filename = `${basename}.png`;
        const thumbPath = path.join(global.thumbsDir, filename);

        fs.exists(thumbPath, exists => {
            if (exists) {
                res.type('.png');
                pump(fs.createReadStream(thumbPath), res);
            } else {
                res.sendStatus(404);
            }
        });
    });

    app.delete('/stream/:filename', (req, res) => {
        const uri = path.join(config('SAVETOFOLDER'), req.params.filename);

        utils.deleteFile(uri).then(() => {
            res.send({
                status: true
            });
        }).catch(error => {
            res.send({
                status: false,
                error
            });
        });
    });

    app.get('/tvshowfeed', (req, res) => {
        if (!req.query.code) {
            return res.send({
                status: 'error',
                error: 'code is required'
            });
        }

        tvshowTime.getAuth(req.query.code).then(() => { //accessToken => {
            // let conf = config('ACCESS_TOKEN');
            // conf['ACCESS_TOKEN'] = accessToken;
            // utils.updateConfig(conf, () => {
            //     res.redirect('/')
            // }); // to be updated
        }).catch(error => {
            res.send({
                status: 'error',
                error
            });
        });
    });

    app.get('/start', (req, res) => {
        if (!global.NOMORE) {
            return res.send({
                running: global.NOMORE,
                error: 'Can\'t you should stop the parsing first'
            });
        }

        if (
            req.query.index &&
            isNaN(parseInt(req.query.index, 10))
        ) {
            return res.send({
                running: !global.NOMORE,
                error: 'The index must be a number'
            });
        }

        const index = req.query.index ? parseInt(req.query.index, 10) - 1 : null;
        sources.start(index).then(() => {
            res.send({
                running: !global.NOMORE
            });
        }).catch(error => {
            res.send({
                running: !global.NOMORE,
                error
            });
        });
    });

    app.get('/stop', (req, res) => {
        sources.stop();
        res.send({
            running: !global.NOMORE
        });
    });

    app.get('/state', (req, res) => {
        res.send({
            running: !global.NOMORE,
            queueIndex: global.infosdb.db().get('queue').value(), // get the queue index
            queueCount: global.queuedb.db().get('queue').value().length // get queue count
        });
    });

    app.get('/search', (req, res) => {
        if (!req.query.keyword || isNaN(req.query.season)) {
            return res.send({
                status: false,
                error: 'Can\'t find any url'
            });
        }

        sources.search({
            index: 0,
            details: {
                keyword: req.query.keyword,
                season: parseInt(req.query.season, 10)
            },
            ParticularEpisode: req.query.episode
        }).then(data => {
            res.send({
                status: true,
                url: data.url
            });
        }).catch(error => {
            res.send({
                status: false,
                error
            });
        });
    });

    app.post('/queue', (req, res) => {
        const {
            name
        } = req.body;

        let {
            season,
            episode
        } = req.body;

        season = utils.fixInt(season);
        episode = utils.fixInt(episode);

        if (name === null || season === null || episode === null) {
            return res.send({
                status: false,
                error: 'data not completed'
            });
        }

        utils.deleteFromQueue({
            name,
            episode,
            season
        }, config('QUEUEPATH')).then(() => {
            res.send({
                status: true
            });
        }).catch(error => {
            res.send({
                status: false,
                error
            });
        });
    });

    app.post('/addToqueue', (req, res) => {
        if (!req.body) {
            return res.send({
                status: false,
                error: 'data not completed'
            });
        }
        const {
            keyword,
            to
        } = req.body;

        let {
            season,
            from
        } = req.body;
        let provName;

        season = utils.fixInt(season);
        from = utils.fixInt(from);

        if (!keyword || !season || !from || !to) {
            return res.send({
                status: false,
                error: 'data not completed'
            });
        }

        if (to !== 'f' && to < from) {
            return res.send({
                status: false,
                error: 'from can\'t be less that to'
            });
        }

        if (req.body.url) {
            provName = sources.parseProviderFromUrl(req.body.url);
            if (!provName) {
                return res.send({
                    status: false,
                    error: 'Url provider not found'
                });
            }
        }

        const Url = provName ? {
            url: decodeURI(req.body.url),
            provider: provName
        } : null;

        sources.addtoQueue({
            keyword,
            season,
            from,
            to
        }, null, Url).then(() => {
            res.send({
                status: true
            });
        }).catch(error => {
            global.log(error);
            res.send({
                status: false,
                error
            });
        });
    });

    // use apiRoutes in the /api route
    app.use('/api', apiRoutes);
};
