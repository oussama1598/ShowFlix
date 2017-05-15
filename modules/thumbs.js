const bluebird = require('bluebird')
const path = require('path')
const os = require('os')
const rimraf = require('rimraf')
const fs = bluebird.promisifyAll(require('fs'))
const filesHelper = require('../helpers/filesHelper')
const request = require('request')

const thumbsDir = path.join(os.tmpdir(), 'Thumbs')
// returns the full path of a thumb from a file name
const getThumbPath = (_uri, infoHash) => {
  const findBy = infoHash
    ? { infoHash }
    : { filename: path.basename(_uri, path.extname(_uri)) }
  const thumb = filesHelper.getFileBy(findBy).value()
  return path.join(
    thumbsDir,
    `${thumb.name}_S${thumb.season}_E${thumb.episode}.jpg`
  )
}

const deleteThumb = uri =>
  new Promise(resolve => {
    rimraf(path.join(thumbsDir, uri), () => resolve())
  })
const thumbExists = (uri, infoHash) =>
  fs.existsSync(getThumbPath(uri, infoHash))

const download = (_uri, _url, infoHash) =>
  new Promise(resolve => {
    const uri = getThumbPath(_uri, infoHash)
    if (fs.existsSync(uri) || !_url) return resolve()
    request
      .get(_url)
      .pipe(fs.createWriteStream(uri))
      .on('finish', () => resolve())
  })

module.exports = () => {
  if (!fs.existsSync(thumbsDir)) fs.mkdirSync(thumbsDir)

  filesHelper.getFiles().forEach(file => {
    if (!thumbExists(false, file.infoHash)) {
      download(file.path, file.onlineThumb)
    }
  })
  fs.readdirAsync(thumbsDir).then(files => {
    files.forEach(file => {
      const thumbpath = path.basename(file, '.jpg').split('_')
      const record = filesHelper.getFileBy({
        name: thumbpath[0],
        season: parseInt(thumbpath[1].replace('S', ''), 10),
        episode: parseInt(thumbpath[2].replace('E', ''), 10)
      })

      if (!record.value()) {
        deleteThumb(file)
      }
    })
  })
}

module.exports.download = download
module.exports.thumbExists = thumbExists
module.exports.deleteThumb = deleteThumb
module.exports.thumbsDir = thumbsDir
module.exports.getThumbPath = getThumbPath
