const Q = require("q");
const colors = require('colors');
const filedownloader = require("filedownloader");
const config = require("./config");
const downloadsCtrl = require("../controllers/downloadsCtrl");
const filesize = require("filesize");


module.exports = (url, details, overWrite) => { // remove the index and overWrite
    return Q.Promise((resolve, reject) => {
        const filename = `${details.name} s${details.season}e${details.episode}.mp4`,
            code = details.code, // this is the episode code or url
            providerCode = details.providerCode, // the provider code ex: 0, 1, 2...
            // added additional data to the search obj an order to find the exact item
            searchObj = {
                filename,
                code,
                providerCode: details.providerCode
            };

        // check if the url is not null or undefined
        if (!url) {
            console.log("No stream found".red);
            // reject the promise with code => is the episode code
            return reject({
                code
            });
        }

        // this is used down in the code to determine if the file is already started to download or is it a new one
        const dataExists = downloadsCtrl.itemExists(searchObj);


        // search if there an entry to the exact same download if there is use it else create new one
        if (!dataExists) downloadsCtrl.addItem({
            code,
            providerCode,
            filename,
            serieName: details.name,
            episode: details.episode,
            season: details.season,
            progress: {},
            started: false,
            error: false,
            finished: false
        });

        // creating new filedownload instance and assigning it to the gloval.Dl
        global.Dl = new filedownloader({
            url: encodeURI(url),
            saveas: filename,
            saveto: config('SAVETOFOLDER'),
            resume: true,
            // this is telling the filedownload to delete the file if there no record of it and it does exist
            deleteIfExists: config('DELETEIFEXISTS') || !dataExists
        }).on("start", () => {
            downloadsCtrl.updateItem(searchObj, {
                started: true,
                error: false,
                finished: false
            });

            console.log(`Started ${filename}`.green)

        }).on("progress", (pr) => {
            process.stdout.clearLine(); // clear current text
            process.stdout.cursorTo(0);
            process.stdout.write(`${pr.progress}%`.blue + " Downloaded".green);
            if (pr.progress === 100) {
                console.log("", true);
            }

            downloadsCtrl.updateItem(searchObj, {
                progress: {
                    progress: pr.progress,
                    written: filesize(pr.dataWritten),
                    size: filesize(pr.filesize),
                    speed: pr.speed
                }
            })
        }).on("end", () => {
            resolve();
            console.log(`${details.name} s${details.season}e${details.episode} Finished`.green, true, true);

            downloadsCtrl.updateItem(searchObj, {
                finished: true
            });

        }).on("error", err => {
            console.log(err.red);

            downloadsCtrl.updateItem(searchObj, {
                error: true
            })
            // if any error emited reject with code to try the next provider or just pass the episode
            reject({
                code
            });
        })
    });
}
