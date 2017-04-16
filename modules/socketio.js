const socketIO = require('socket.io');

module.exports = (app) => {
  const io = socketIO(app);

  io.on('connection', (_socket) => {
    const socket = _socket;
    socket.$emit = (evt, data) => {
      socket.emit('all', {
        evt,
        data,
      });
    };

    socket.on('serverStat', () => {
      socket.$emit('serverStat', {
        running: global.RUNNING,
        queueIndex: global.infosdb.db()
          .get('queue')
          .value(), // get the queue index
        queueCount: global.queuedb.db()
          .get('queue')
          .value()
          .length,
      });
    });
  });

  return io;
};
