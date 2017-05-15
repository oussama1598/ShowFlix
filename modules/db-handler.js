const low = require('lowdb')
const _ = require('underscore')
const EventEmitter = require('events')

class DbHandler extends EventEmitter {
  constructor (_path, _defaults) {
    super()

    this.path = _path
    this.defaults = _defaults
  }

  init (db) {
    db.defaults(this.defaults).write()
  }

  db () {
    const db = low(this.path)
    if (!_.isEqual(Object.keys(db.value()), Object.keys(this.defaults))) {
      this.init(db)
    }
    return db
  }

  get (path) {
    if (path) {
      return this.db().get(path)
    }

    const keys = Object.keys(this.defaults)
    if (keys.indexOf('lastId') > -1) keys.splice(keys.indexOf('lastId'), 1)

    if (keys.length <= 1) {
      return this.db().get(keys[0])
    }
    throw new Error("Can't get anything")
  }

  add (obj = {}) {
    const id = parseInt(this.get('lastId').value(), 10) + 1
    this.db().set('lastId', id).write()

    this.get()
      .push(
        Object.assign(
          {
            id
          },
          obj
        )
      )
      .write()
    this.emitUpdate(
      null,
      'added',
      this.find({
        id
      }).value()
    )
  }

  find (obj = {}, path) {
    return this.get(path).find(obj)
  }

  remove (obj = {}, path) {
    const data = this.find(obj, path).value()

    this.get(path).remove(obj).write()

    this.emitUpdate(path, 'removed', data.id)
    return data
  }

  update (find = {}, replaceWith = {}, path) {
    this.find(find, path).assign(replaceWith).write()

    this.emitUpdate(path, 'updated', this.find(find, path).value()) // thir param is the new value
  }

  emitUpdate (path, event, message) {
    this.emit('update', {
      message,
      event
    })
  }
}

module.exports = DbHandler
