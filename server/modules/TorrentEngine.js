import WebTorrent from 'webtorrent'
import path from 'path'
import EventEmitter from 'events'
import databases from '../services/databases'

export default class TorrentEngine extends EventEmitter {
  constructor (showsPath) {
    super()

    this.path = showsPath
    this.WebTorrent = new WebTorrent()
      .on('torrent', torrent => {
        const infoHash = torrent.infoHash
        const queueSelectedFile = databases
          .getDb('queue')
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

        this.emit('start', {
          infoHash,
          fileData: {
            progress: {},
            filename: path.basename(filepath, path.extname(filepath)),
            dirname: path.dirname(filepath),
            path: filepath,
            started: true,
            error: false,
            done: false
          }
        })

        torrent.on('download', () => this.emit('progress', {infoHash, torrent, mainFile}))
        torrent.on('done', () => this.emit('done', infoHash))
        torrent.on('error', err => this.emit('error', ({ infoHash, err })))
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
