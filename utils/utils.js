const cheerio = require('cheerio')
const rimraf = require('rimraf')
const _ = require('underscore')
const NodeCache = require('node-cache')
const fetch = require('node-fetch')
const config = require('../modules/config')
const path = require('path')

const myCache = new NodeCache({
  stdTTL: 60 * 60 * 24,
  checkperiod: 120
})

const deleteFile = (_uri, file) =>
  new Promise(resolve => {
    const uri = !file ? `${_uri.substr(0, _uri.lastIndexOf('['))}*` : _uri
    rimraf(uri, () => resolve())
  })

const cache = {
  get: key => myCache.get(key),
  set: (key, data) => myCache.set(key, data),
  delete: key => myCache.del(key)
}

const fixInt = num => (isNaN(parseInt(num, 10)) ? null : parseInt(num, 10))
const filesUpdated = () => cache.delete('medias')
const deleteFromQueue = ({ episode, season, name }) =>
  Promise.resolve().then(() => {
    global.queuedb.remove({
      episode,
      season,
      name
    })
  })

const createDownloadEntry = (name, episodeData) => {
  const infoHash = episodeData.infoHash
  const db = global.downloadsdb
  const dbRecord = db
    .find({
      infoHash
    })
    .value()

  if (!dbRecord) {
    db.add({
      name: name,
      episode: episodeData.episode,
      season: episodeData.season,
      magnet: episodeData.magnet,
      file: episodeData.file,
      infoHash,
      progress: {},
      started: false,
      error: false,
      finished: false
    })
  }
}

const arrayDeffrence = (_arr, _target) => {
  const containsEquals = (obj, target) => {
    if (obj == null) return false
    return _.any(obj, value => _.isEqual(value, target))
  }

  return _.filter(_arr, value => !containsEquals(_target, value))
}

const pad = (num, size) => {
  let s = num.toString()
  while (s.length < size) {
    s = `0${s}`
  }
  return s
}

const generateFormData = obj => {
  let str = ''

  _.each(obj, (item, key) => {
    str += `${key}=${item}`
  })

  return str
}

const getHtml = (
  _url,
  json,
  method = 'GET',
  form = {},
  headers = {},
  timeout = 20000,
  onlyRes = false
) =>
  fetch(encodeURI(_url), {
    timeout,
    method,
    body: generateFormData(form),
    headers
  })
    .then(res => {
      if (res.status !== 200 && !onlyRes) {
        return Promise.reject(new Error(res.statusText))
      }

      if (onlyRes) return res
      if (json) return res.json()

      return cheerio.load(res.text())
    })
    .catch(err => {
      console.log(err.toString().red)
      return Promise.reject(err)
    })

const deleteMedia = file => {
  const saveTo = config('SAVETOFOLDER')
  const parentPath = path.dirname(file.replace(`${saveTo}/`, ''))
  const uri = parentPath === '.'
    ? `${path.join(saveTo, path.basename(file, path.extname(file)))}*`
    : path.join(saveTo, parentPath)

  return deleteFile(uri)
}

module.exports = {
  getHtml,
  deleteFile,
  filesUpdated,
  arrayDeffrence,
  cache,
  fixInt,
  pad,
  deleteFromQueue,
  createDownloadEntry,
  deleteMedia
}
