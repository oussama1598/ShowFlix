const socketIO = require('socket.io');
const utils = require("../utils/utils");


module.exports = app => {
	const io = socketIO(app);

	io.on("connection", socket => {
		socket.emit("serverDetails", {ongoing: !global.NOMORE})
		socket.on("watchDownloads", () => {

			socket.emit("downloadsChanged", global.fileDowns)
			
			global.downloadsWatcher.on("downloadsChanged", downloads => {
				socket.emit("downloadsChanged", downloads);
			})
		})
	})
}