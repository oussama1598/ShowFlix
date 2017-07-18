// import thumbs from '../modules/thumbs'
// const mediasHandler = require('../modules/mediasHandler')
import databases from '../config/databases'

export function getFileBy (obj) {
  return databases.getDb('files').find(obj)
}
export function getFiles () {
  return databases.getDb('files').get().value()
}
export function updateFile (infoHash, obj) {
  databases.getDb('files').update(
    {
      infoHash
    },
    obj
  )
}

export function createFile (episodeData) {
  const infoHash = episodeData.infoHash
  databases.getDb('files').add({
    title: episodeData.title,
    season: episodeData.season,
    episode: episodeData.episode,
    infoHash,
    path: '',
    filename: '',
    streamUrl: encodeURI(`/files/${infoHash}`),
    thumbUrl: encodeURI(`/files/${infoHash}/thumb`),
    onlineThumb: episodeData.thumb,
    episodeId: null,
    theTvDBId: null,
    poster: '',
    srt: false,
    done: false,
    show: false
  }, { infoHash })

  // mediasHandler.addDetails(name, season, episode, infoHash)
}
export function removeFile (infoHash) {
  const data = global.filesdb.remove({
    infoHash
  })
  // thumbs.deleteThumb(`${data.name}_S${data.season}_E${data.episode}.jpg`)
}
