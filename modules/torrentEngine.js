const thumbs = require('./thumbs');
const WebTorrent = require('webtorrent');
const mediasHandler = require('./mediasHandler');
const path = require('path');

const init = () => {
    const webTorrent = global.webTorrent = new WebTorrent(); // new instance of web torrent

    webTorrent.on('torrent', torrent => {
        const dbRecord = global.downloadsdb
            .db()
            .get('downloads')
            .find({
                infoHash: torrent.infoHash
            });
        const {
            name,
            episode,
            season
        } = dbRecord.value();
        const episodeName = `${name} S${season}E${episode}`;
        const mainFile = torrent.files.reduce((a, b) => {
            const aLength = a.length;
            const bLength = b.length;
            return aLength > bLength ? a : b;
        });
        const filepath = mainFile.path;

        torrent.files.filter(file => file !== mainFile)
            .forEach(file => file.deselect());

        mainFile.select();
        console.log(`${episodeName} Started`.green);
        dbRecord.assign({
            started: true,
            error: false,
            finished: false
        }).write();

        mediasHandler.updateFile(torrent.infoHash, {
            filename: path.basename(filepath, path.extname(filepath)),
            path: filepath,
            done: false
        });

        torrent.on('download', () => {
            process.stdout.clearLine(); // clear current text
            process.stdout.cursorTo(0);
            process.stdout
                .write(`${(torrent.progress * 100).toFixed(2)}%`.blue + ' Downloaded'.green);
            if (torrent.progress === 100) {
                console.log('', true);
            }
            mediasHandler.checkforShow(
                torrent.infoHash,
                torrent.downloaded,
                filepath
            );

            dbRecord.assign({
                progress: {
                    progress: torrent.progress * 100,
                    written: torrent.downloaded,
                    size: mainFile.length,
                    speed: torrent.downloadSpeed,
                    timeRemaining: torrent.timeRemaining,
                    peers: torrent.numPeers
                }
            }).write();
        });

        torrent.on('done', () => {
            console.log(`${episodeName} Finished`.green, true, true);

            dbRecord.assign({
                finished: true
            }).write();

            thumbs.generate(filepath); // generate the thumb
        });

        torrent.on('error', err => {
            console.log(err.red);

            dbRecord.assign({
                error: true
            }).write();
        });
    });
};

const destroyClients = () => {
    global.webTorrent.torrents.forEach(torrent => {
        torrent.destroy();
    });
};

module.exports = {
    init,
    destroyClients
};
