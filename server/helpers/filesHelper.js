// import thumbs from '../modules/thumbs'
// const mediasHandler = require('../modules/mediasHandler')
import databases from '../services/databases'

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
  databases.getDb('files')
    .add(episodeData, {
      infoHash: episodeData.infoHash
    })

  // mediasHandler.addDetails(name, season, episode, infoHash)
}
export function removeFile (infoHash) {
  const data = global.filesdb.remove({
    infoHash
  })
  // thumbs.deleteThumb(`${data.name}_S${data.season}_E${data.episode}.jpg`)
}
