const socketIO = require('socket.io')

module.exports = app => {
  const io = socketIO(app)

  io.on('connection', _socket => {
    const socket = _socket
    socket.$emit = (evt, data) => {
      socket.emit('all', {
        evt,
        data
      })
    }

    socket.on('serverStat', () => {
      socket.$emit('serverStat', {
        running: global.RUNNING,
        queueIndex: global.infosdb.get('queue').value(), // get the queue index
        queueCount: global.queuedb.get().value().length
      })
    })
  })

  return io
}
