const async = require('async');
const tvShowsData = require('../lib/tvshowsData');
const path = require('path');
const filesize = require('filesize');
const config = require('./config');
const utils = require('../utils/utils');
const thumbs = require('./thumbs');
const recursive = require('recursive-readdir');
const isVideo = require('is-video');
const fs = require('fs');

const getFileBy = obj => global.filesdb.db()
  .get('files')
  .find(obj);

const createFile = (name, season, episode, infoHash) => {
  const filesdb = global.filesdb.db()
    .get('files');

  if (!getFileBy({
      infoHash,
    })
    .value()) {
    filesdb.push({
        episode,
        name,
        season,
        infoHash,
        path: '',
        filename: '',
        srt: false,
        done: false,
        show: false,
      })
      .write();
  }
  utils.filesUpdated();
};

const updateFile = (infoHash, obj) => {
  getFileBy({
      infoHash,
    })
    .assign(obj)
    .write();
  utils.filesUpdated();
};

const removeFile = (infoHash) => {
  const record = getFileBy({
    infoHash,
  });

  thumbs.deleteThumb(record.value()
    .path);

  global.filesdb.db()
    .get('files')
    .remove({
      infoHash,
    })
    .write();
  utils.filesUpdated();
};

module.exports = () => new Promise((resolve) => {
  if (!fs.existsSync(config('SAVETOFOLDER'))) fs.mkdirSync(config('SAVETOFOLDER'));
  global.filesdb.db()
    .get('files')
    .value()
    .forEach((file) => {
      const fullpath = path.join(config('SAVETOFOLDER'), file.path);
      fs.exists(fullpath, (exists) => {
        if (!exists) removeFile(file.infoHash);
      });
    });
  recursive(config('SAVETOFOLDER'), (err, files) => {
    files.forEach((file) => {
      if (!isVideo(file)) return true;

      const record = getFileBy({
          filename: path.basename(file, path.extname(file)),
        })
        .value();
      const srtPath = file.replace(path.extname(file), '.srt');

      if (!record) return utils.deleteFile(path.dirname(file));

      return updateFile(record.infoHash, {
        srt: fs.existsSync(srtPath),
      });
    });

    resolve();
  });
});

module.exports.checkforShow = (infoHash, downloaded, uri) => {
  const TRESHOLD = config('FILE_TRESHOLD_SIZE');
  const record = getFileBy({
      infoHash,
    })
    .value();
  if ((downloaded >= TRESHOLD && !record.show)) {
    updateFile(infoHash, {
      show: true,
    });

    thumbs.generate(uri);
  }
};

module.exports.getMedias = () => new Promise((resolve) => {
  const episodes = new Map();
  const files = global.filesdb.db()
    .get('files')
    .value();

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


module.exports.createFile = createFile;
module.exports.updateFile = updateFile;
module.exports.removeFile = removeFile;
module.exports.getFileBy = getFileBy;
