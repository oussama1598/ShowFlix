import debug from 'debug'
import TorrentEngine from './TorrentEngine'
import config from '../config/config'
import { createDownloadEntry } from '../services/utils'
import databases from '../services/databases'
import { createFile, updateFile, removeFile } from '../helpers/filesHelper'

export default class Parser {
  constructor () {
    this.RUNNING = false
    this.queueIndex = 0
    this.debug = debug('TorrentEngine')
  }

  init () {
    this._runTorrentEngine()
    this.start()
  }

  start (index = 0) {
    if (this.RUNNING) return

    this.RUNNING = true
    this._clearQueue()
      .then(() => this._next(index))
      .then(() => {
        this.debug('Parsing Started')

        this._parseQueue()
      })
      .catch(err => {
        this.debug(err)

        this.RUNNING = false
      })
  }

  stop () {
    if (!this.RUNNING) return

    this.RUNNING = false
    this.torrentEngine.kill()

    this.debug('Parsing stopped')
  }

  _MoveToNext (infoHash, notDone) {
    if (!this.RUNNING) return

    databases.getDb('queue').update(
      {
        infoHash
      },
      {
        done: !notDone,
        tried: true
      }
    )

    this._BuildNextElement(this.queueIndex).then(() => {
      this._parseQueue()
    })
  }

  _parseQueue () {
    const queueData = databases.getDb('queue').get().value()
    const episodeEl = queueData[this.queueIndex]

    if (queueData.length === 0 || !episodeEl) {
      this.debug('All Done')
      this.RUNNING = !this.RUNNING
    }

    createDownloadEntry(episodeEl)
    this.torrentEngine.add(episodeEl.magnet)
  }

  _clearQueue () {
    const data = databases.getDb('queue').get()
    data.remove(item => item.done).write()

    if (data.value().length === 0) {
      return Promise.reject(new Error('Data is empty please try again.'))
    }

    return Promise.resolve()
  }

  _next (_index = -1) {
    const db = databases.getDb('queue').get()
    const data = db.value()
    // if the index is the last one do not repeat those who are already tried
    const results = db
      .filter(
        item =>
          !item.done &&
          (parseInt(_index, 10) !== (data.length - 1) ? true : !item.tried)
      )
      .value()
    const index = (parseInt(_index, 10) + 1).toString()

    // this returns to the first element in the queue
    if (parseInt(index, 10) > data.length - 1 && results.length > 0) {
      this.queueIndex = 0
      return Promise.resolve()
    }

    this.queueIndex = index
    return Promise.resolve() // resolve the promise
  }

  _runTorrentEngine () {
    this.torrentEngine = new TorrentEngine(config['SAVETOFOLDER'])

    this.torrentEngine
      .on('start', this._torrentEngineStartEvent.bind(this))
      .on('done', this._torrentEngineDoneEvent.bind(this))
      .on('error', this._torrentEngineErrorEvent.bind(this))
  }

  _torrentEngineStartEvent (infoHash) {
    const data = databases
      .getDb('queue')
      .find({ infoHash })
      .value()
    this.debug(`Started ${data.title} S${data.season}E${data.episode}`)

    createFile(data)
  }

  _torrentEngineDoneEvent (infoHash) {
    updateFile(infoHash, {
      done: true
    })
    this.debug('Next in the Queue')

    if (!this.RUNNING) return
    setTimeout(() => this.MoveToNext(infoHash), 1000)
  }

  _torrentEngineErrorEvent ({infoHash, err}) {
    removeFile(infoHash)
    this.debug(err)
    this.debug('Passing this episode')

    if (!this.RUNNING) return
    this.MoveToNext(infoHash, true)
  }
}
