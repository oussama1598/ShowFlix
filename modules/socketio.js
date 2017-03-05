const socketIO = require('socket.io');

module.exports = app => {
    const io = socketIO(app);

    io.on('connection', socket => {
        socket._emit = (evt, data) => {
            socket.emit('all', {
                evt,
                data
            });
        };

        socket.on('serverStat', () => {
            socket._emit('serverStat', {
                running: !global.NOMORE,
                queueIndex: global.infosdb.db().get('queue').value(), // get the queue index
                queueCount: global.queuedb.db().get('queue').value().length // get queue count
            });
        });
    });

    return io;
};
