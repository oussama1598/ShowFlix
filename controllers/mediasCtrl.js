const fs = require('fs');
const path = require('path');
const utils = require('../utils/utils');
const mediasHandler = require('../modules/mediasHandler');
const config = require('../modules/config');
const stream = require('../modules/stream');
const pump = require('pump');

module.exports.getFiles = (req, res) => {
  const cache = utils.cache()
    .get('medias');

  if (cache) return res.send(cache);
  mediasHandler.getMedias()
    .then((Files) => {
      res.send(Files);
      utils.cache()
        .set('medias', Files);
    });
  return null;
};

module.exports.stream = (req, res) => {
  const uri = path.join(config('SAVETOFOLDER'), req.record.path);
  fs.exists(uri, (exists) => {
    if (!exists) return res.sendStatus(404);

    return stream(uri, req, res);
  });
};

module.exports.thumb = (req, res) => {
  const thumbPath = path.join(global.thumbsDir, `${req.record.filename}.png`);

  fs.exists(thumbPath, (exists) => {
    if (!exists) return res.sendStatus(404);

    res.type('.png');
    return pump(fs.createReadStream(thumbPath), res);
  });
};

module.exports.deleteFile = (req, res) => {
  const uri = path.join(config('SAVETOFOLDER'), path.dirname(req.record.path));

  mediasHandler.removeFile(req.record.infoHash);
  utils.deleteFile(uri)
    .then(() => {
      res.send({
        status: true,
      });
    })
    .catch((error) => {
      res.send({
        status: false,
        error,
      });
    });
};
