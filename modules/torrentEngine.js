const WebTorrent = require('webtorrent')
const path = require('path')
const debug = require('debug')('ShowFlix:TorrentEngine')
const filesHelper = require('../helpers/filesHelper')
const EventEmitter = require('events')

class TorrentEngine extends EventEmitter {
  constructor () {
    super()
    this.WebTorrent = new WebTorrent()

    this.WebTorrent.on('torrent', torrent => {
      this.emit('start', torrent.infoHash)

      const infoHash = torrent.infoHash
      const downloadsdb = global.downloadsdb

      const queueSelectedFile = downloadsdb
        .find({
          infoHash
        })
        .value().file

      const mainFile = torrent.files.filter(
        file => file.name === queueSelectedFile
      )[0]
      const filepath = mainFile.path

      torrent.files.forEach(file => file.deselect())
      mainFile.select()
      downloadsdb.update(
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
        dirname: path.dirname(filepath),
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

        downloadsdb.update(
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
        this.emit('done', infoHash)
        downloadsdb.update(
          {
            infoHash
          },
          {
            finished: true
          }
        )
      })

      torrent.on('error', err => {
        this.emit('error', infoHash)
        console.log(err.red)

        downloadsdb.update(
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

  add (magnet, path) {
    this.WebTorrent.add(magnet, {
      path
    })
  }

  destroy () {
    this.WebTorrent.torrents.forEach(torrent => {
      torrent.destroy()
    })
  }
}

module.exports = new TorrentEngine()
