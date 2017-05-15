const EventEmitter = require('events')
const utils = require('../utils/utils')

class Watcher extends EventEmitter {
  constructor (_delay, _data) {
    super()
    if (!new.target) return new Watcher()

    this.last = []
    this.data = _data

    setInterval(this.checkForDiffrence.bind(this), _delay)
  }

  checkForDiffrence () {
    const arr = this.data()
    const diffrence = utils.arrayDeffrence(arr, this.last)

    if (diffrence.length > 0) {
      this.last = arr.slice()
      this.emit('changed', arr)
    }
  }
}

module.exports = Watcher
