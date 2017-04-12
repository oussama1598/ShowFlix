const bluebird = require('bluebird');
const path = require('path');
const os = require('os');
const ffmpeg = require('fluent-ffmpeg');
const utils = require('../utils/utils');
const config = require('./config');
const fs = bluebird.promisifyAll(require('fs'));

const thumbsDir = global.thumbsDir = path.join(os.tmpdir(), 'Thumbs');

// returns the full path of a thumb from a file name
const getThumbPath = uri => path.join(thumbsDir, `${path.basename(uri, path.extname(uri))}.png`);
const deleteThumb = uri => utils.deleteFile(getThumbPath(uri)); // delete thumb
const thumbExists = uri => fs.existsSync(getThumbPath(uri)); // returns if thumb exists

function init() {
    global.filesdb.db().get('files').value().forEach(file => {
        if (!thumbExists(file.path)) generate(file.path);
    });
    fs.readdirAsync(thumbsDir).then(files => {
        files.forEach(file => {
            const thumbpath = path.basename(file, '.png');
            const record = global.filesdb.db().get('files')
                .find({
                    filename: thumbpath
                });
            if (!record.value()) deleteThumb(file);
        });
    });
}

function generate(_uri) {
    const uri = path.join(config('SAVETOFOLDER'), _uri);
    const basename = path.basename(uri, path.extname(uri));
    const filename = `${basename}.png`;
    const oldPath = path.join(thumbsDir, `${basename}.png`);

    if (!fs.existsSync(uri) || fs.existsSync(oldPath)) return;

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

module.exports = {
    init,
    generate,
    thumbExists,
    deleteThumb
};
