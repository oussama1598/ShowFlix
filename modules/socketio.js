const socketIO = require('socket.io');
const utils = require("../utils/utils");
const config = require("./config");
const _ = require("underscore");


module.exports = app => {
    const io = socketIO(app);

    io.on("connection", socket => {
        socket._emit = (evt, data) => {
            socket.emit("all", { evt, data })
        }
        
        socket.on("serverStat", () => {
            socket._emit("serverStat", {
                running: !NOMORE,
                queueIndex: utils.getInfosData(config("INFOS_PATH")).queue,
                queueCount: utils.getQueueSync(config("QUEUEPATH")).length
            });
        })
    })

    return io;
}
