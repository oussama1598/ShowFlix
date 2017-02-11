const Q = require("q");
const colors = require('colors');
const filedownloader = require("filedownloader");
const config = require("./config");


function download(url, details, index, overWrite) {
    return Q.Promise((resolve, reject) => {
        let defer = Q.defer(),
            fileDowns = global.fileDowns,
            filename = `${details.name} s${details.season}e${details.episode}.mp4`;

        if (!url) {
            console.log("No stream found".red);
            return reject({ index: null });
        }

        if (index === null) {
            index = fileDowns.length;
            fileDowns.push({
                filename,
                serieName: details.name,
                episode: details.episode,
                season: details.season,
                started: false,
                progress: {},
                error: false,
                finished: false
            })
        }

        global.Dl = new filedownloader({
            url: encodeURI(url),
            saveas: filename,
            saveto: config('SAVETOFOLDER'),
            resume: true,
            deleteIfExists: config('DELETEIFEXISTS') || overWrite
        }).on("start", () => {
            fileDowns[index].started = true;
            fileDowns[index].error = false;
            fileDowns[index].finished = false;

            console.log(`Started ${filename}`.green)

        }).on("progress", (pr) => {
            process.stdout.clearLine(); // clear current text
            process.stdout.cursorTo(0);
            process.stdout.write(`${pr.progress}%`.blue + " Downloaded".green);
            if (pr.progress === 100) {
                console.log("", true);
            }

            fileDowns[index].progress = {
                progress: pr.progress,
                written: byteToMB(pr.dataWritten),
                size: byteToMB(pr.filesize),
                speed: pr.speed
            };
        }).on("end", () => {
            resolve();
            console.log(`${details.name} s${details.season}e${details.episode} Finished`.green, true, true);
            fileDowns[index].finished = true;

        }).on("error", err => {
            fileDowns[index].error = true;
            console.log(err.red);
            reject({ index });
        })
    });
}

function byteToMB(bytes) {
    return (bytes / 1024 / 1024).toFixed(2) + 'MB';
}

module.exports = { download };
