const async = require("async");
const tvShowsData = require("./tvshowsData");
const Q = require("q");
const path = require("path");

function getMedias() {
    return Q.Promise(resolve => {
        let episodes = {};
        async.forEach(global.Files, (file, cb) => {
            const metadata = tvShowsData.parseFromFilename(file);
            if (!episodes[metadata.serieName]) episodes[metadata.serieName] = [];

            episodes[metadata.serieName].push({
                filename: path.basename(file),
                serieName: metadata.serieName,
                episode: parseInt(metadata.episode),
                season: parseInt(metadata.season),
                streamUrl: encodeURI(`/stream/${file}`),
                thumbUrl: encodeURI(`/thumb/${file}`)
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
