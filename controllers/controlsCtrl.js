const parser = require('../modules/parser')

module.exports.state = (req, res) =>
  res.send({
    running: global.RUNNING,
    queueIndex: global.infosdb.db().get('queue').value(), // get the queue index
    queueCount: global.queuedb.db().get('queue').value().length // get queue count
  })

module.exports.stop = (req, res) => {
  parser.stop()
  res.send({
    running: global.RUNNING
  })
}

module.exports.start = (req, res, next) => {
  req.checkQuery('index', 'Index must be a number').isIntAccNull()

  req
    .getValidationResult()
    .then(result => {
      if (!result.isEmpty()) return Promise.reject(result.array())
      if (global.RUNNING) {
        return Promise.reject('The parsing is already started ')
      }

      const index = req.query.index
        ? parseInt(req.query.index, 10) - 1
        : undefined
      return parser.start(index)
    })
    .then(() => {
      res.send({
        status: true
      })
    })
    .catch(error => {
      if (error instanceof Error) return next(error)
      return res.send({
        status: false,
        error
      })
    })
}
