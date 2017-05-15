const WebTorrent = require('webtorrent')
const path = require('path')
const utils = require('../utils/utils')
const debug = require('debug')('ShowFlix:TorrentEngine')
const filesHelper = require('../helpers/filesHelper')

module.exports = () => {
  global.webTorrent = new WebTorrent() // new instance of web torrent
  debug('Torrent Engine initialized')

  global.webTorrent.on('torrent', torrent => {
    debug('new torrent added')

    const infoHash = torrent.infoHash
    const queueSelectedFile = global.queuedb
      .find({
        infoHash
      })
      .value().file
    const mainFile = queueSelectedFile
      ? torrent.files.filter(file => file.name === queueSelectedFile)[0]
      : torrent.files.reduce((a, b) => {
        const aLength = a.length
        const bLength = b.length
        return aLength > bLength ? a : b
      })
    const filepath = mainFile.path

    torrent.files.forEach(file => file.deselect())
    utils.createDownloadEntry(infoHash)
    mainFile.select()
    global.downloadsdb.update(
      {
        infoHash
      },
      {
        started: true,
        error: false,
        finished: false
      }
    )

    filesHelper.updateFile(torrent.infoHash, {
      filename: path.basename(filepath, path.extname(filepath)),
      path: filepath,
      done: false
    })

    torrent.on('download', () => {
      process.stdout.clearLine() // clear current text
      process.stdout.cursorTo(0)
      process.stdout.write(
        `${(torrent.progress * 100).toFixed(2)}%`.blue + ' Downloaded'.green
      )
      if (torrent.progress === 100) {
        console.log('', true)
      }

      global.downloadsdb.update(
        {
          infoHash
        },
        {
          progress: {
            progress: torrent.progress * 100,
            written: torrent.downloaded,
            size: mainFile.length,
            speed: torrent.downloadSpeed,
            timeRemaining: torrent.timeRemaining,
            peers: torrent.numPeers
          }
        }
      )
    })

    torrent.on('done', () => {
      global.downloadsdb.update(
        {
          infoHash
        },
        {
          finished: true
        }
      )
    })

    torrent.on('error', err => {
      console.log(err.red)

      global.downloadsdb.update(
        {
          infoHash
        },
        {
          error: true
        }
      )
    })
  })
}

module.exports.destroyClients = () => {
  global.webTorrent.torrents.forEach(torrent => {
    torrent.destroy()
  })
}
