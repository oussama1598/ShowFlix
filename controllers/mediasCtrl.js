const fs = require('fs');
const path = require('path');
const utils = require('../utils/utils');
const mediasHandler = require('../modules/mediasHandler');
const config = require('../modules/config');
const stream = require('../modules/stream');
const pump = require('pump');

module.exports.getFiles = (req, res) => {
    if (utils.cache().get('medias')) {
        return res.send(
            utils.cache()
            .get('medias')
        );
    }
    mediasHandler.getMedias().then(Files => {
        res.send(Files);
        utils.cache().set('medias', Files);
    });
};

module.exports.stream = (req, res) => {
    const uri = path.join(config('SAVETOFOLDER'), req.params.filename);

    fs.exists(uri, exists => {
        if (!exists) return res.sendStatus(404);

        stream(uri, req, res);
    });
};

module.exports.thumb = (req, res) => {
    const basename = path.basename(req.params.filename, path.extname(req.params.filename));
    const thumbPath = path.join(global.thumbsDir, `${basename}.png`);

    fs.exists(thumbPath, exists => {
        if (!exists) return res.sendStatus(404);

        res.type('.png');
        pump(fs.createReadStream(thumbPath), res);
    });
};

module.exports.deleteFile = (req, res) => {
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
};
