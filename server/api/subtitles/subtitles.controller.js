import _ from 'underscore'
import stringSimilarity from 'string-similarity'
import request from 'request'
import unzip from 'unzip'
import path from 'path'
import fs from 'fs'
// import config from '../modules/config'
import { deleteFile, cache } from '../../services/utils'
// import filesHelper from '../helpers/filesHelper'
import { search, getDownloadUrl } from '../../lib/subtitlesApi'

export function getSubs (req, res, next) {
  if (cache().get(req.path)) return res.send(cache().get(req.path))

  req.checkQuery('filename', 'filename is required.').notEmpty()

  const filename = req.query.filename
  req.getValidationResult()
    .then(result => {
      if (!result.isEmpty()) {
        return res.send({
          status: false,
          errors: result.array()
        })
      }

      return search(filename)
    })
    .then(data => {
      data = data.map(item => Object.assign(item, {
        match: (stringSimilarity.compareTwoStrings(filename, item.name) *
          100).toFixed(2)
      }))
      // TODO try and parse episode details from the sub's filename
      // look for why caching doesnt work
      console.log('not cached')
      res.send(cache().set(req.path, {
        status: true,
        filename,
        result: data.length,
        subs: _.chain(data)
          .filter(item => item.match > (req.query.filename ? 20 : 85))
          .sortBy('language')
          .value()
      }))
    })
    .catch(err => next(err))
}

export function downloadSub (req, res, next) {
  req.checkBody('link', 'subscene link is required').notEmpty()

  req
    .getValidationResult()
    .then(result => {
      if (!result.isEmpty()) {
        return res.send({
          status: false,
          errors: result.array()
        })
      }

      return getDownloadUrl(req.body.link)
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
      // deleteFile(zipPath, true)
      // filesHelper.updateFile(req.record.infoHash, {
      //   srt: true
      // })
    })
    .then(() => {
      res.send({
        status: true
      })
    })
    .catch(err => next(err))
}
