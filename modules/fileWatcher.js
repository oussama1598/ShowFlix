const watcher = require('chokidar');
const thumbs = require('./thumbs');
const utils = require('../utils/utils');
const path = require('path');
const config = require('./config');
const fs = require('fs');

const tempraryFiles = [];

module.exports = () => {
    watcher.watch(config('SAVETOFOLDER'))
        .on('add', _uri => {
            const uri = path.basename(_uri);

            if (!searchForPath(uri) && (searchWithinGlobal(uri) === false)) {
                addPath(uri, thumbs.thumbExists(uri));
            }
        })
        .on('change', _uri => {
            const fullpath = _uri;
            const uri = path.basename(_uri);
            const index = searchForPath(uri);

            if (index === false) return;

            if (fs.statSync(fullpath).size < parseInt(config('FILE_TRESHOLD_SIZE'), 10)) {
                clearTimeout(tempraryFiles[index].timeout);
                tempraryFiles.splice(index, 1);
                addPath(uri);
            }
        })
        .on('unlink', _uri => {
            const uri = path.basename(_uri);
            const index = searchForPath(uri);
            const globalIndex = searchWithinGlobal(uri);

            if (index !== false) {
                clearTimeout(tempraryFiles[index].timeout);
                tempraryFiles.splice(index, 1);
            }

            if (globalIndex !== false) global.Files.splice(globalIndex, 1);

            thumbs.deleteThumb(uri);
            utils.filesUpdated();
        });
};

function addPath(uri, imediatly) {
    if (imediatly) {
        addtoGlobal(uri, true);
        return;
    }

    tempraryFiles.push({
        path: uri,
        timeout: setTimeout(() => {
            const index = searchForPath(uri);
            const fullpath = path.join(config('SAVETOFOLDER'), uri);

            if (fs.statSync(fullpath).size < parseInt(config('FILE_TRESHOLD_SIZE'), 10)) {
                if (index !== false) tempraryFiles.splice(index, 1);
                return addPath(uri);
            }

            addtoGlobal(uri);
        }, 5000)
    });
}

function addtoGlobal(Path, imediatly) {
    global.Files.push(Path);

    if (!imediatly) {
        utils.filesUpdated();
        tempraryFiles.splice(searchForPath(path), 1);
        thumbs.generate(path);
    }
}

function searchForPath(uri) {
    const result = tempraryFiles.filter(item => item.path === uri);
    return result[0] ? tempraryFiles.indexOf(result[0]) : false;
}

function searchWithinGlobal(uri) {
    const result = global.Files.filter(item => item === uri);
    return result[0] ? global.Files.indexOf(result[0]) : false;
}
