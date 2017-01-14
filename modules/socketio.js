const socketIO = require('socket.io');
const utils = require("../utils/utils");


module.exports = app => {
	const io = socketIO(app);

	global.downloadsWatcher.on("downloadsChanged", downloads => {
		_.each(io.sockets.clients(), sk => {
			if(sk.downloads){
				sk.emit("downloadsChanged", global.fileDowns);
			}
		})
	})

	io.on("connection", socket => {
		socket.on("watchDownloads", start => {
			if(start) socket.emit("downloadsChanged", global.fileDowns);
			
			socket.download = start;
		})
	})
}