import torrentEngine from './torrentEngine'
import config from '../config/config'
import { createDownloadEntry } from '../utils/utils'
import databases from '../config/databases'
import { createFile, updateFile, removeFile } from '../helpers/filesHelper'

export default class Parser {
  constructor () {
    this.RUNNING = false
    this.queueIndex = 0

    torrentEngine
      .on('start', infoHash => {
        const data = databases.getDb('queue').find({ infoHash }).value()
        console.log(`Started ${data.title} S${data.season}E${data.episode}`.green)

        createFile(data)
      })
      .on('done', infoHash => {
        updateFile(infoHash, {
          done: true
        })
        console.log('Next in the Queue')

        if (!this.RUNNING) return
        setTimeout(() => this.MoveToNext(infoHash), 1000)
      })
      .on('error', infoHash => {
        removeFile(infoHash)
        console.log('Passing this episode')

        if (!this.RUNNING) return
        this.MoveToNext(infoHash, true)
      })
  }

  MoveToNext (infoHash, notDone) {
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

    this.BuildNextElement(this.queueIndex).then(() => {
      this.parseQueue()
    })
  }

  parseQueue () {
    const queueData = databases.getDb('queue').get().value()
    const episodeEl = queueData[this.queueIndex]

    if (queueData.length === 0 || !episodeEl) {
      console.log('All Done')
      this.RUNNING = !this.RUNNING
    }

    createDownloadEntry(episodeEl)
    torrentEngine.add(episodeEl.magnet, config['SAVETOFOLDER'])
  }

  clearQueue () {
    const data = databases.getDb('queue').get()
    data.remove(item => item.done).write()

    if (data.value().length === 0) {
      return Promise.reject(new Error('Data is empty please try again.'))
    }

    return Promise.resolve()
  }

  next (_index = -1) {
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

  start (index = 0) {
    if (this.RUNNING) return

    this.RUNNING = !this.RUNNING
    this.clearQueue()
      .then(() => this.next(index))
      .then(() => {
        global.log('Parsing Started')

        this.parseQueue()
      })
      .catch(err => {
        console.log(err.toString())

        this.RUNNING = !this.RUNNING
      })
  }

  stop () {
    if (!this.RUNNING) return

    this.RUNNING = !this.RUNNING
    // some kind of log here
    torrentEngine.kill()
  }
}
