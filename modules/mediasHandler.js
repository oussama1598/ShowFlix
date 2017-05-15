const path = require('path')
const config = require('./config')
const utils = require('../utils/utils')
const recursive = require('recursive-readdir')
const isVideo = require('is-video')
const fs = require('fs')
const filesHelper = require('../helpers/filesHelper')
const thumbs = require('../modules/thumbs')
const tvShowData = require('../lib/tvshowsData')

const addDetails = (name, season, episode, infoHash) => {
  tvShowData.getDataForEpisode({ name, episode, season }).then(data => {
    thumbs.download(false, data.thumb, infoHash).then(() => {
      filesHelper.updateFile(infoHash, {
        title: data.title,
        onlineThumb: data.thumb,
        episodeId: data.id,
        theTvDBId: data.showId,
        poster: data.poster,
        originalPoster: data.fullPoster,
        show: true
      })
    })
  })
}

module.exports = () =>
  new Promise(resolve => {
    if (!fs.existsSync(config('SAVETOFOLDER'))) {
      fs.mkdirSync(config('SAVETOFOLDER'))
    }

    filesHelper.getFiles().forEach(file => {
      const fullpath = path.join(config('SAVETOFOLDER'), file.path)
      fs.exists(fullpath, exists => {
        if (!exists) filesHelper.removeFile(file.infoHash)
      })

      if (!file.show) {
        addDetails(file.name, file.season, file.episode, file.infoHash)
      }
    })

    recursive(config('SAVETOFOLDER'), (err, files) => {
      if (err) return false

      files.forEach(file => {
        if (!isVideo(file)) return true

        const record = filesHelper
          .getFileBy({
            filename: path.basename(file, path.extname(file))
          })
          .value()
        const srtPath = file.replace(path.extname(file), '.srt')

        if (!record) return utils.deleteMedia(file)
        return filesHelper.updateFile(record.infoHash, {
          srt: fs.existsSync(srtPath)
        })
      })
      resolve()
    })
  })

module.exports.addDetails = addDetails
