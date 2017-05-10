const async = require('async');
const tvShowsData = require('../lib/tvshowsData');
const path = require('path');
const filesize = require('filesize');
const config = require('./config');
const utils = require('../utils/utils');
const recursive = require('recursive-readdir');
const isVideo = require('is-video');
const fs = require('fs');


module.exports = () => new Promise((resolve) => {
  if (!fs.existsSync(config('SAVETOFOLDER'))) fs.mkdirSync(config('SAVETOFOLDER'));

  utils.filesdbHelpers.getFiles()
    .forEach((file) => {
      const fullpath = path.join(config('SAVETOFOLDER'), file.path);
      fs.exists(fullpath, (exists) => {
        if (!exists) utils.filesdbHelpers.removeFile(file.infoHash);
      });
    });

  recursive(config('SAVETOFOLDER'), (err, files) => {
    files.forEach((file) => {
      if (!isVideo(file)) return true;

      const record = utils.filesdbHelpers.getFileBy({
          filename: path.basename(file, path.extname(file)),
        })
        .value();
      const srtPath = file.replace(path.extname(file), '.srt');

      if (!record) return utils.deleteMedia(file);
      // utils.cache.set('medias', )
      // TODO: build files since startup and build data withouth requesting again and again
      return utils.filesdbHelpers.updateFile(record.infoHash, {
        srt: fs.existsSync(srtPath),
      });
    });

    resolve();
  });
});

module.exports.getFile = file => new Promise((resolve, reject) => {
  if (!file) return reject();

  // const filename = path.basename(file.path);
  // const fullpath = path.join(config('SAVETOFOLDER'), file.path);
  // const ffmpeg = path.extname(filename) !== '.mp4' ? '?ffmpeg=true' : '';

  // fs.stat(fullpath, (err, stats) => {
  //       if (err) return cb();
  // });
});

module.exports.getFiles = () =>
  new Promise((resolve) => {
    const episodes = new Map();
    const files = utils.filesdbHelpers.getFiles();

    async.forEach(files, (file, cb) => {
      if (!file.show) return cb();
      const filename = path.basename(file.path);
      const fullpath = path.join(config('SAVETOFOLDER'), file.path);
      const ffmpeg = path.extname(filename) !== '.mp4' ? '?ffmpeg=true' : '';

      if (!episodes.has(file.name)) episodes.set(file.name, []);

      fs.stat(fullpath, (err, stats) => {
        if (err) return cb();

        episodes.get(file.name)
          .push({
            filename,
            name: file.name,
            episode: parseInt(file.episode, 10),
            season: parseInt(file.season, 10),
            streamUrl: encodeURI(`/files/${file.infoHash}${ffmpeg}`),
            thumbUrl: encodeURI(`/files/${file.infoHash}/thumb`),
            subs: encodeURI(`/files/${file.infoHash}/subs`),
            srt: file.srt ? encodeURI(`/files/${file.infoHash}/srt`) : false,
            fileDetails: {
              fullpath,
              size: filesize(stats.size),
            },
          });

        return cb();
      });

      return true;
    }, () => {
      tvShowsData.getEpisodeDataByQuery(episodes)
        .then((Files) => {
          resolve(Files);
        })
        .catch((Files) => {
          resolve(Files);
        });
    });
  });
