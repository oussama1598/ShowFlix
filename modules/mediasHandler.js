const async = require("async");
const tvShowsData = require("./tvshowsData");
const Q = require("q");
const path = require("path");
const fs = require("fs");
const config = require("./config");
const filesize = require("filesize");

function getMedias() {
    return Q.Promise(resolve => {
        let episodes = {};
        async.forEach(global.Files, (file, cb) => {
            const metadata = tvShowsData.parseFromFilename(file),
                fullPath = path.join(config("SAVETOFOLDER"), file);

            if (!episodes[metadata.serieName]) episodes[metadata.serieName] = [];

            fs.stat(fullPath, (err, stats) => {
                if (err) return;

                episodes[metadata.serieName].push({
                    filename: path.basename(file),
                    serieName: metadata.serieName,
                    episode: parseInt(metadata.episode),
                    season: parseInt(metadata.season),
                    streamUrl: encodeURI(`/stream/${file}`),
                    thumbUrl: encodeURI(`/thumb/${file}`),
                    fileDetails: {
                        fullPath,
                        size: filesize(stats["size"])
                    }
                })

            })
            cb();
        }, err => {
            tvShowsData.getEpisodeDataByQuery(episodes)
                .then(Files => {
                    resolve(Files);
                })
                .catch(Files => {
                    resolve(Files);
                });
        });
    });
}

module.exports = {
    getMedias
}
