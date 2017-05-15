const thumbs = require('../modules/thumbs')
const mediasHandler = require('../modules/mediasHandler')

const getFileBy = obj => global.filesdb.find(obj)
const getFiles = () => global.filesdb.get().value()
const updateFile = (infoHash, obj) => {
  global.filesdb.update(
    {
      infoHash
    },
    obj
  )
}

module.exports.createFile = (name, season, episode, infoHash) => {
  const filesdb = global.filesdb
  const record = filesdb
    .find({
      infoHash
    })
    .value()

  if (!record) {
    filesdb.add({
      title: '',
      name,
      season,
      episode,
      infoHash,
      path: '',
      filename: '',
      streamUrl: encodeURI(`/files/${infoHash}`),
      thumbUrl: encodeURI(`/files/${infoHash}/thumb`),
      subs: encodeURI(`/files/${infoHash}/subs`),
      onlineThumb: '',
      episodeId: null,
      theTvDBId: null,
      poster: '',
      srt: false,
      done: false,
      show: false
    })

    mediasHandler.addDetails(name, season, episode, infoHash)
  }
}
module.exports.removeFile = infoHash => {
  const data = global.filesdb.remove({
    infoHash
  })
  thumbs.deleteThumb(`${data.name}_S${data.season}_E${data.episode}.jpg`)
}

module.exports.updateFile = updateFile
module.exports.getFileBy = getFileBy
module.exports.getFiles = getFiles
