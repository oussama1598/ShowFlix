const fs = require('fs');
const path = require('path');
const utils = require('../utils/utils');
const mediasHandler = require('../modules/mediasHandler');
const config = require('../modules/config');
const stream = require('../modules/stream');
const pump = require('pump');
const thumbs = require('../modules/thumbs');

module.exports.getFiles = (req, res) => {
  const cache = utils.cache.get('medias');
  if (cache) return res.send(cache);

  mediasHandler.getFiles()
    .then((Files) => {
      res.send(Files);
      utils.cache.set('medias', Files);
    });

  // TODO: add complex object check for future files update
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
  const thumbPath = path.join(thumbs.thumbsDir, `${req.record.filename}.png`);

  fs.exists(thumbPath, (exists) => {
    if (!exists) return res.sendStatus(404);

    res.type('.png');
    return pump(fs.createReadStream(thumbPath), res);
  });
};

module.exports.deleteFile = (req, res, next) => {
  utils.filesdbHelpers.removeFile(req.record.infoHash);
  utils.deleteMedia(req.record.path)
    .then(() => {
      res.send({
        status: true,
      });
    })
    .catch((error) => {
      if (error instanceof Error) return next(error);
      return res.send({
        status: false,
        error,
      });
    });
};
