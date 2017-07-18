import DbHandler from '../modules/dbHandler'
import EventEmitter from 'events'
import path from 'path'
import config from './config'

class LocalDbs extends EventEmitter {
  databases = new Map()

  constructor () {
    super()

    this.newDb(path.join(config.root, '/server/data/', 'queue.json'), 'queue', {
      lastId: 0,
      queue: []
    })

    this.newDb(path.join(config.root, '/server/data/', 'downloads.json'), 'downloads', {
      lastId: 0,
      downloads: []
    })

    this.newDb(path.join(config.root, '/server/data/', 'files.json'), 'files', {
      lastId: 0,
      files: []
    })
  }

  newDb (path, key, defaults) {
    this.databases.set(key, new DbHandler(path, defaults))
  }

  getDb (key) {
    return this.databases.get(key)
  }
}

export default new LocalDbs()
