const watcher = require('chokidar');
const thumbs = require("./thumbs");
const utils = require("../utils/utils");
const path = require("path");
const _ = require('underscore');
const config = require("./config");
const fs = require("fs");

let tempraryFiles = [];

module.exports = () => {
    watcher.watch(config('SAVETOFOLDER'))
        .on("add", uri => {
            uri = path.basename(uri);

            if (!searchForPath(uri) && (searchWithinGlobal(uri) === false)) {
                addPath(uri, thumbs.thumbExists(uri));
            }
        })
        .on("change", uri => {
            const fullpath = uri;

            uri = path.basename(uri);
            const index = searchForPath(uri);

            if (index === false) return;

            if (fs.statSync(fullpath)["size"] < parseInt(config("FILE_TRESHOLD_SIZE"))) {
                clearTimeout(tempraryFiles[index].timeout);
                tempraryFiles.splice(index, 1);
                addPath(uri);
            }
        })
        .on("unlink", uri => {
            uri = path.basename(uri);

            const index = searchForPath(uri),
                globalIndex = searchWithinGlobal(uri);
            if (index !== false) {
                clearTimeout(tempraryFiles[index].timeout);
                tempraryFiles.splice(index, 1);
            }

            if (globalIndex !== false) global.Files.splice(globalIndex, 1);

            thumbs.deleteThumb(uri);

            utils.filesUpdated();

        })
}

function addPath(path, imediatly) {
    if (imediatly) {
        addtoGlobal(path, true);
        return;
    }

    tempraryFiles.push({
        path,
        timeout: setTimeout(() => {
            addtoGlobal(path);
        }, 5000)
    })
}

function addtoGlobal(path, imediatly) {
    global.Files.push(path);

    if (!imediatly) {
        utils.filesUpdated()
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
