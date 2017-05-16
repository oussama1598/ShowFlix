const subsApi = require('../lib/subtitles')
const _ = require('underscore')
const stringSimilarity = require('string-similarity')
const request = require('request')
const unzip = require('unzip')
const path = require('path')
const fs = require('fs')
const config = require('../modules/config')
const utils = require('../utils/utils')
const filesHelper = require('../helpers/filesHelper')

module.exports.getSubs = (req, res) => {
  const filename =
    req.query.filename ||
    filesHelper
      .getFileBy({
        infoHash: req.record.infoHash
      })
      .value().filename

  subsApi
    .search(filename)
    .then(data => {
      data.forEach(_item => {
        const item = _item
        item.match = (stringSimilarity.compareTwoStrings(filename, item.name) *
          100).toFixed(2)
        // TODO try and parse episode details from the sub's filename
      })

      res.send({
        status: true,
        filename,
        subs: _.chain(data)
          .filter(item => item.match > (req.query.filename ? 20 : 85))
          .sortBy('language')
          .value()
      })
    })
    .catch(error => {
      res.send({
        status: false,
        error: error.toString()
      })
    })
}

module.exports.downloadSub = (req, res, next) => {
  req.checkBody('link', 'subscene link is required').notEmpty()

  req
    .getValidationResult()
    .then(result => {
      if (!result.isEmpty()) {
        return Promise.reject(result.array())
      }

      return subsApi
        .getDownloadUrl(req.body.link)
        .catch(err => Promise.reject(err.message))
    })
    .then(url => {
      const fullpath = path.join(config('SAVETOFOLDER'), req.record.path)
      const zipPath = fullpath.replace(path.extname(fullpath), '.zip')
      const saveas = fullpath.replace(path.extname(fullpath), '.srt')
      let downloaded = false

      return new Promise(resolve => {
        const stream = request.get(url).pipe(fs.createWriteStream(zipPath))
        stream.on('finish', () => {
          fs
            .createReadStream(zipPath)
            .pipe(unzip.Parse())
            .on('entry', entry => {
              if (path.extname(entry.path) === '.srt' && !downloaded) {
                entry.pipe(fs.createWriteStream(saveas))
                downloaded = true
                resolve(zipPath)
              }
              entry.autodrain()
            })
        })
      })
    })
    .then(zipPath => {
      utils.deleteFile(zipPath, true)
      filesHelper.updateFile(req.record.infoHash, {
        srt: true
      })
    })
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
