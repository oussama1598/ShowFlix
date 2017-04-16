const subsApi = require('../lib/subtitles');
const mediasHandler = require('../modules/mediasHandler');
const _ = require('underscore');
const stringSimilarity = require('string-similarity');
const request = require('request');
const unzip = require('unzip');
const path = require('path');
const fs = require('fs');
const config = require('../modules/config');
const utils = require('../utils/utils');

module.exports.getSubs = (req, res) => {
  const filename = req.query.filename || mediasHandler.getFileBy({
      infoHash: req.record.infoHash,
    })
    .value()
    .filename;

  subsApi.search(filename)
    .then((data) => {
      data.forEach((_item) => {
        const item = _item;
        item.match = (stringSimilarity.compareTwoStrings(filename, item.name) * 100)
          .toFixed(2);
      });

      res.send({
        status: true,
        filename,
        subs: _.chain(data)
          .filter(item => item.match > (req.query.filename ? 20 : 85))
          .sortBy('language')
          .value(),
      });
    })
    .catch((error) => {
      res.send({
        status: false,
        error: error.toString(),
      });
    });
};

module.exports.downloadSub = (req, res) => {
  req.checkBody('link', 'subscene link is required')
    .notEmpty();

  req.getValidationResult()
    .then((result) => {
      if (!result.isEmpty()) {
        return Promise.reject(result.array());
      }

      return subsApi.getDownloadUrl(req.body.link)
        .catch(err => Promise.reject(err.toString()));
    })
    .then((url) => {
      const fullpath = path.join(config('SAVETOFOLDER'), req.record.path);
      const zipPath = fullpath.replace(path.extname(fullpath), '.zip');
      const saveas = fullpath.replace(path.extname(fullpath), '.srt');
      let downloaded = false;

      return new Promise((resolve) => {
        const stream = request.get(url)
          .pipe(fs.createWriteStream(zipPath));
        stream.on('finish', () => {
          fs.createReadStream(zipPath)
            .pipe(unzip.Parse())
            .on('entry', (entry) => {
              if (path.extname(entry.path) === '.srt' && !downloaded) {
                entry.pipe(fs.createWriteStream(saveas));
                downloaded = true;
                resolve(zipPath);
              }
              entry.autodrain();
            });
        });
      });
    })
    .then((zipPath) => {
      utils.deleteFile(zipPath);
      mediasHandler.updateFile(req.record.infoHash, {
        srt: true,
      });
    })
    .then(() => {
      res.send({
        status: true,
      });
    })
    .catch((error) => {
      res.send({
        status: false,
        error: error.toString(),
      });
    });
};
