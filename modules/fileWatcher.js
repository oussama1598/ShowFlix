const watcher = require('chokidar');
const thumbs = require("./thumbs");
const utils = require("../utils/utils");
const path = require("path");
const Ev = require("events");
const util = require('util');
const _ = require('underscore');

let tempraryFiles = [];

module.exports = () => {
    watcher.watch(global.SAVETOFOLDER)
        .on("add", uri => {
            uri = path.basename(uri);

            if (!searchForPath(uri) && !searchWithinGlobal(uri)) {
                addPath(uri, thumbs.thumbExists(uri));
            }
        })
        .on("change", uri => {
            uri = path.basename(uri);

            const index = searchForPath(uri);

            if (index) {
                clearTimeout(tempraryFiles[index].timeout);

                tempraryFiles.splice(index, 1);
                addPath(uri);
            }
        })
        .on("unlink", uri => {
            uri = path.basename(uri);

            const index = searchForPath(uri),
                globalIndex = searchWithinGlobal(uri);
            if (index) {
                clearTimeout(tempraryFiles[index].timeout);
                tempraryFiles.splice(index, 1);
            }

            if (globalIndex) global.Files.splice(globalIndex, 1);

            thumbs.deleteThumb(uri);

            utils.filesUpdated();

        })

    return new downloadsWatcher();
}

function downloadsWatcher() {
    let lastDowns = [];
    setInterval(() => {
        const deff = utils.arrayDeffrence(global.fileDowns, lastDowns);
        
        if (deff.length > 0) {
            lastDowns = _.map(global.fileDowns, _.clone);
            this.emit("downloadsChanged", deff);
        }
    }, 1000);
}

function addPath(path, imediatly) {
    if (imediatly) {
        addtoGlobal(path, true);
        return;
    }

    tempraryFiles.push({
        path,
        timeout: setTimeout(() => { addtoGlobal(path) }, 10000)
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

function searchForPath(path) {
    for (file in tempraryFiles) {
        if (tempraryFiles[file].path === path) {
            return file;
        }
    }
    return false;
}

function searchWithinGlobal(path) {
    for (file in global.Files) {
        if (global.Files[file] === path) {
            return file;
        }
    }
    return false;
}

util.inherits(downloadsWatcher, Ev);
