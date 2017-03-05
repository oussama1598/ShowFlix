const path = require('path');
const fs = require('fs');
const os = require('os');
const ffmpeg = require('fluent-ffmpeg');
const utils = require('../utils/utils');
const config = require('./config');

const thumbsDir = global.thumbsDir = path.join(os.tmpdir(), 'Thumbs');

function init(cb) {
    if (!fs.existsSync(thumbsDir)) fs.mkdirSync(thumbsDir);

    fs.readdir(config('SAVETOFOLDER'), (err, files) => {
        files.forEach(file => {
            global.Files.push(file);

            if (!thumbExists(file)) generate(file);
        });

        checkThumbs(cb);
    });
}

function checkThumbs(cb) {
    fs.readdir(thumbsDir, (err, files) => {
        files.forEach(file => {
            if (!searchWithinGlobal(path.basename(file, '.png'))) {
                deleteThumb(file); // recheck this
            }
        });

        cb();
    });
}

function deleteThumb(uri) {
    const basename = path.basename(uri, path.extname(uri));
    const filename = `${basename}.png`;
    const thumbPath = path.join(global.thumbsDir, filename);

    utils.deleteFile(thumbPath);
}

function generate(_uri) {
    let uri = _uri;

    const basename = path.basename(uri, path.extname(uri));
    const filename = `${basename}.png`;
    const oldPath = path.join(thumbsDir, filename);

    uri = path.join(config('SAVETOFOLDER'), uri);

    if (!fs.existsSync(uri) || fs.existsSync(oldPath)) {
        return;
    }

    ffmpeg(uri)
        .screenshots({
            timestamps: ['1%'],
            filename,
            folder: thumbsDir,
            size: '400x225'
        }).on('error', () => {
            global.log('Error when generating thumbnail'.red);
        });
}

function thumbExists(uri) {
    const basename = path.basename(uri, path.extname(uri));
    const filename = `${basename}.png`;
    const thumbPath = path.join(thumbsDir, filename);

    return fs.existsSync(thumbPath);
}

function searchWithinGlobal(PATH) {
    const result = global.Files.filter(file => file.indexOf(PATH) > -1);
    return result[0] ? result[0] : false;
}


module.exports = {
    init,
    generate,
    thumbExists,
    deleteThumb
};
