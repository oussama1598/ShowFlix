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

const getFileBy = obj => global.filesdb.db().get('files').find(obj);

const createFile = (name, season, episode, infoHash) => {
    const filesdb = global.filesdb.db().get('files');
    if (!getFileBy({
            infoHash
        }).value()) {
        filesdb.push({
            episode,
            name,
            season,
            infoHash,
            path: '',
            filename: '',
            done: false,
            show: false
        }).write();
    }
    utils.filesUpdated();
};

const updateFile = (infoHash, obj) => {
    getFileBy({
            infoHash
        })
        .assign(obj)
        .write();
    utils.filesUpdated();
};

const removeFile = infoHash => {
    const record = getFileBy({
        infoHash
    });

    thumbs.deleteThumb(record.value().path);

    global.filesdb.db().get('files').remove({
        infoHash
    }).write();
    utils.filesUpdated();
};

const checkforShow = (infoHash, downloaded, uri) => {
    const TRESHOLD = config('FILE_TRESHOLD_SIZE');
    const record = getFileBy({
        infoHash
    }).value();
    if ((downloaded >= TRESHOLD && !record.show)) {
        updateFile(infoHash, {
            show: true
        });

        thumbs.generate(uri);
    }
};

function init() {
    return new Promise(resolve => {
        global.filesdb.db().get('files').value()
            .forEach(file => {
                const fullpath = path.join(config('SAVETOFOLDER'), file.path);
                fs.exists(fullpath, exists => {
                    if (!exists) removeFile(file.infoHash);
                });
            });
        recursive(config('SAVETOFOLDER'), (err, files) => {
            files.forEach(file => {
                if (isVideo(file)) {
                    const record = getFileBy({
                        filename: path.basename(file, path.extname(file))
                    });
                    if (!record.value()) utils.deleteFile(path.dirname(file));
                }
            });
            resolve();
        });
    });
}

function getMedias() {
    return new Promise(resolve => {
        const episodes = {};
        async.forEach(global.filesdb.db().get('files').value(), (file, cb) => {
            if (!file.show) return cb();
            const filename = path.basename(file.path);
            const fullpath = path.join(config('SAVETOFOLDER'), file.path);
            const ffmpeg = path.extname(filename) !== '.mp4' ? '?ffmpeg=true' : '';

            if (!episodes[file.name]) episodes[file.name] = [];

            fs.stat(fullpath, (err, stats) => {
                if (err) return;

                episodes[file.name].push({
                    filename,
                    name: file.name,
                    episode: parseInt(file.episode, 10),
                    season: parseInt(file.season, 10),
                    streamUrl: encodeURI(`/files/${file.infoHash}${ffmpeg}`),
                    thumbUrl: encodeURI(`/files/${file.infoHash}/thumb`),
                    subs: encodeURI(`/files/${file.infoHash}/subs`),
                    fileDetails: {
                        fullpath,
                        size: filesize(stats.size)
                    }
                });
            });

            cb();
        }, () => {
            tvShowsData.getEpisodeDataByQuery(episodes)
                .then(Files => {
                    resolve(Files);
                })
                .catch(Files => {
                    resolve(Files);
                });
        });
    });
}

module.exports = {
    init,
    getMedias,
    createFile,
    updateFile,
    removeFile,
    checkforShow,
    getFileBy
};
