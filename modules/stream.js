const pump = require('pump');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const send = require('send');

module.exports = (uri, req, res) => {
    if (!req.query.ffmpeg) {
        return send(uri, req).pipe(res);
    }
    return transcode(uri, res, req.query.ffmpeg);
};

function transcode(uri, res, mode) {
    if (mode === 'flv') {
        res.type('video/x-flv');
        const command = ffmpeg(fs.createReadStream(uri))
            .format('flv')
            .outputOptions([
                //'-threads 2',
                '-deadline realtime',
                '-error-resilient 1'
            ]);
        pump(command, res);
    } else {
        res.type('video/webm');
        const command = ffmpeg(fs.createReadStream(uri))
            .videoCodec('libvpx').audioCodec('libvorbis').format('webm')
            .audioBitrate(128)
            .videoBitrate(1024)
            .outputOptions([
                //'-threads 2',
                '-deadline realtime',
                '-error-resilient 1'
            ]);
        pump(command, res);
    }
}
