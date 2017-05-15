const pump = require('pump')
const fs = require('fs')
const ffmpeg = require('fluent-ffmpeg')
const send = require('send')

const transcode = (uri, res) => {
  res.type('video/webm')
  const command = ffmpeg(fs.createReadStream(uri))
    .videoCodec('libvpx')
    .audioCodec('libvorbis')
    .format('webm')
    .audioBitrate(128)
    .videoBitrate(1024)
    .outputOptions(['-deadline realtime', '-error-resilient 1'])
  pump(command, res)
}

module.exports = (uri, req, res) => {
  if (!req.query.ffmpeg) {
    return send(req, uri).pipe(res)
  }
  return transcode(uri, res)
}
