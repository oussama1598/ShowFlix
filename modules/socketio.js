const socketIO = require('socket.io');
const utils = require("../utils/utils");
const config = require("./config");
const _ = require("underscore");


module.exports = app => {
	const io = socketIO(app);
	
	io.on("connection", socket => {
		socket._emit = (evt, data) => {
			socket.emit("all", {evt, data})
		}
		socket.on("watchDownloads", start => {
			if(start) socket._emit("downloadsChanged", global.fileDowns);
			socket.download = start;
		})		

		socket.on("watchQueue", start => {
			if(start) socket._emit("queueChanged", utils.getQueueSync(config("QUEUEPATH")));
			socket.queue = start;
		})

		socket.on("serverStat", () => {
			socket._emit("serverStat", { running: !NOMORE });
		})
	})

	return io;
}