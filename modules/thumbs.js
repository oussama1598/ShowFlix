const bluebird = require('bluebird');
const path = require('path');
const fs = bluebird.promisifyAll(require('fs'));
const os = require('os');
const ffmpeg = require('fluent-ffmpeg');
const utils = require('../utils/utils');
const config = require('./config');

const thumbsDir = global.thumbsDir = path.join(os.tmpdir(), 'Thumbs');

// search with the global Files array for a match of the path
const searchWithinGlobal = PATH => global.Files.filter(file => file.indexOf(PATH) > -1)[0];
// returns the full path of a thumb from a file name
const getThumbPath = (uri) => path.join(thumbsDir, `${path.basename(uri, path.extname(uri))}.png`);
const deleteThumb = (uri) => utils.deleteFile(getThumbPath(uri)); // delete thumb
const thumbExists = (uri) => fs.existsSync(getThumbPath(uri)); // returns if thumb exists

function init() {
    if (!fs.existsSync(thumbsDir)) fs.mkdirSync(thumbsDir); // if dir doesnt exist create it

    return fs.readdirAsync(config('SAVETOFOLDER')).then(files => {
        global.Files = files.slice(); // assing a copy of the files array to
        // global Files array for future use

        files.forEach(file => {
            if (!thumbExists(file)) generate(file); // if thumb doesnt exist generate it
        });

        return checkThumbs(); // check if the thumb exists but the file doesnt
    });
}

function checkThumbs() {
    return fs.readdirAsync(thumbsDir).then(files => {
        files.forEach(file => {
            if (!searchWithinGlobal(path.basename(file, '.png'))) deleteThumb(file);
            // if the file doesnt exist but the thumb does if so delete it
        });
    });
}

function generate(_uri) {
    let uri = _uri;

    const basename = path.basename(uri, path.extname(uri));
    const filename = `${basename}.png`;
    const oldPath = path.join(thumbsDir, `${basename}.png`);

    uri = path.join(config('SAVETOFOLDER'), uri);

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
