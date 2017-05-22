const fs = require('fs')
const path = require('path')
const utils = require('../utils/utils')
const config = require('../modules/config')
const stream = require('../modules/stream')
const pump = require('pump')
const thumbs = require('../modules/thumbs')
const filesHelper = require('../helpers/filesHelper')
const _ = require('underscore')

module.exports.getFiles = (req, res) =>
  res.send(
    _.chain(global.filesdb.get().value())
      .sortBy('season')
      .sortBy('episode')
      .sortBy('name')
      .value()
  )

module.exports.stream = (req, res) => {
  const uri = path.join(config('SAVETOFOLDER'), req.record.path)
  fs.stat(uri, err => {
    if (err) return res.sendStatus(404)

    return stream(uri, req, res)
  })
}

module.exports.thumb = (req, res) => {
  const thumbPath = thumbs.getThumbPath(false, req.record.infoHash)

  fs.stat(thumbPath, err => {
    if (err) return res.sendStatus(404)

    res.type('.jpg')
    return pump(fs.createReadStream(thumbPath), res)
  })
}

module.exports.deleteFile = (req, res, next) => {
  filesHelper.removeFile(req.record.infoHash)
  utils
    .deleteMedia(req.record.path)
    .then(() => {
      res.send({
        status: true
      })
    })
    .catch(error => {
      if (error instanceof Error) return next(error)
      return res.send({
        status: false,
        error
      })
    })
}
