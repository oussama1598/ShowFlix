const path = require("path");
const fs = require("fs");
const os = require("os");
const ffmpeg = require('fluent-ffmpeg');
const utils = require("../utils/utils");


function init(cb) {
    const thumbsDir = global.thumbsDir = path.join(os.tmpdir(), "Thumbs");

    if (!fs.existsSync(thumbsDir)) fs.mkdirSync(thumbsDir);

    fs.readdir(global.SAVETOFOLDER, (err, files) => {
        files.forEach(file => {
            global.Files.push(file);
            if(!thumbExists(file)) generate(path.join(global.SAVETOFOLDER, file));
        });

        checkThumbs(cb);
    })
}

function checkThumbs(cb){
    fs.readdir(global.thumbsDir, (err, files) => {
        files.forEach(file => {
            if(!searchWithinGlobal(path.basename(file, ".png"))){
                deleteThumb(file);
            }
        })

        cb();
    })
}

function deleteThumb(uri){
    const filename = path.basename(uri, path.extname(uri)) + ".png",
        thumbPath = path.join(global.thumbsDir, filename);
        
    utils.deleteFile(thumbPath);
}

function generate(uri) {
    const filename = path.basename(uri, path.extname(uri)) + ".png",
        oldPath = path.join(global.thumbsDir, filename);

    uri = path.join(global.SAVETOFOLDER, uri);

    if (!fs.existsSync(uri) || fs.existsSync(oldPath)) {
        return;
    }

    ffmpeg(uri)
        .screenshots({
            timestamps: ["10%"],
            filename: filename,
            folder: global.thumbsDir,
            size: '400x225'
        })
}

function thumbExists(uri) {
    const filename = path.basename(uri, path.extname(uri)) + ".png",
        thumbPath = path.join(global.thumbsDir, filename);

    return fs.existsSync(thumbPath);
}

function searchWithinGlobal(path){
    for (file in global.Files) {
        if (global.Files[file].indexOf(path) > -1) {
            return file;
        }
    }
    return false;
}


module.exports = {
    init,
    generate,
    thumbExists,
    deleteThumb
}
