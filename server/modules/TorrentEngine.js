import WebTorrent from 'webtorrent'
import path from 'path'
import { updateFile } from '../helpers/filesHelper'
import EventEmitter from 'events'
import databases from '../services/databases'

export default class TorrentEngine extends EventEmitter {
  constructor (showsPath) {
    super()
    this.WebTorrent = new WebTorrent()
    this.path = showsPath

    this.WebTorrent.on('torrent', torrent => {
      this.emit('start', torrent.infoHash)

      const infoHash = torrent.infoHash
      const downloadsdb = databases.getDb('downloads')

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

      updateFile(torrent.infoHash, {
        filename: path.basename(filepath, path.extname(filepath)),
        dirname: path.dirname(filepath),
        path: filepath,
        done: false
      })

      torrent.on('download', () => {
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
        this.emit('error', ({ infoHash, err }))

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

  add (magnet) {
    this.WebTorrent.add(magnet, {
      path: this.path
    })
  }

  kill () {
    this.WebTorrent.torrents.forEach(torrent => {
      torrent.destroy()
    })
  }
}
