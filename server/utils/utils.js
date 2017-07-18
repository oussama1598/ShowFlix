import rimraf from 'rimraf'
import _ from 'underscore'
import NodeCache from 'node-cache'
import fetch from 'node-fetch'
// import config from '../modules/config'
import path from 'path'
import databases from '../config/databases'

const myCache = new NodeCache({
  stdTTL: 60 * 60 * 24,
  checkperiod: 120
})

export function deleteFile (_uri, file) {
  return new Promise(resolve => {
    const uri = !file ? `${_uri.substr(0, _uri.lastIndexOf('['))}*` : _uri
    rimraf(uri, () => resolve())
  })
}

export function cache () {
  return {
    get (key) { myCache.get(key) },
    set (key, data) {
      myCache.set(key, data)
      return data
    },
    delete (key) { myCache.del(key) }
  }
}

export function fixInt (num) {
  return (isNaN(parseInt(num, 10)) ? null : parseInt(num, 10))
}
export function filesUpdated () {
  return cache.delete('medias')
}
export function deleteFromQueue ({ episode, season, name }) {
  return Promise.resolve().then(() => {
    global.queuedb.remove({
      episode,
      season,
      name
    })
  })
}

export function createDownloadEntry (episodeData) {
  databases.getDb('downloads').add({
    title: episodeData.title,
    episode: episodeData.episode,
    season: episodeData.season,
    magnet: episodeData.magnet,
    file: episodeData.file,
    infoHash: episodeData.infoHash,
    progress: {},
    started: false,
    error: false,
    finished: false
  }, {
    infoHash: episodeData.infoHash
  })
}

export function arrayDeffrence (_arr, _target) {
  const containsEquals = (obj, target) => {
    if (obj == null) return false
    return _.any(obj, value => _.isEqual(value, target))
  }

  return _.filter(_arr, value => !containsEquals(_target, value))
}

export function pad (num, size) {
  let s = num.toString()
  while (s.length < size) {
    s = `0${s}`
  }
  return s
}

export function generateFormData (obj) {
  let str = ''

  _.each(obj, (item, key) => {
    str += `${key}=${item}`
  })

  return str
}

export function _request (
  _url,
  json,
  method = 'GET',
  form = {},
  headers = {},
  timeout = 20000,
  onlyRes = false
) {
  return fetch(encodeURI(_url), {
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
    })
    .catch(err => {
      console.log(err.toString().red)
      return Promise.reject(err)
    })
}

export function deleteMedia (file) {
  const saveTo = ''// config('SAVETOFOLDER')
  const parentPath = path.dirname(file.replace(`${saveTo}/`, ''))
  const uri = parentPath === '.'
    ? `${path.join(saveTo, path.basename(file, path.extname(file)))}*`
    : path.join(saveTo, parentPath)

  return deleteFile(uri)
}
