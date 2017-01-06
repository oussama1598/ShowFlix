const pump = require("pump");
const rangeParser = require("range-parser");
const fs = require("fs");
const ffmpeg = require("fluent-ffmpeg");

module.exports = (uri, req, res) => {
    if (!req.query.ffmpeg) {
        return normal(uri, req, res);
    } else {
        return transcode(uri, res);
    }

}

function transcode(uri, res) {
    res.type('video/webm');
    const command = ffmpeg(fs.createReadStream(uri))
        .videoCodec('libvpx').audioCodec('libvorbis').format('webm')
        .audioBitrate(128)
        .videoBitrate(1024)
        .outputOptions([
            //'-threads 2',
            '-deadline realtime',
            '-error-resilient 1'
        ])
    pump(command, res);
}

function normal(uri, req, res) {
    const stats = fs.statSync(uri)
    let range = req.headers.range;
    range = range && rangeParser(stats.size, range)[0];
    res.setHeader('Accept-Ranges', 'bytes');
    res.type(req.params.filename);
    req.connection.setTimeout(3600000);

    if (!range) {
        res.setHeader('Content-Length', stats.size);
        return pump(fs.createReadStream(uri), res);
    }

    res.statusCode = 206;
    res.setHeader('Content-Length', range.end - range.start + 1);
    res.setHeader('Content-Range', 'bytes ' + range.start + '-' + range.end + '/' + stats.size);

    pump(fs.createReadStream(uri, range), res);
}
