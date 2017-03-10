const filedownloader = require('filedownloader');
const config = require('./config');
const downloadsCtrl = require('../controllers/downloadsCtrl');
const filesize = require('filesize');
const thumbs = require('./thumbs');
const utils = require('../utils/utils');

module.exports = (url, details) => new Promise((resolve, reject) => {
    const {
        code, // this is the episode code or url
        providerCode, // the provider code ex: 0, 1, 2...
        name, // the tvshow name
        episode,
        season
    } = details;
    const filename = `${name} s${season}e${episode}.mp4`;
    const searchObj = {
        filename,
        code,
        providerCode
    };
    // this is used down in the code to determine if
    // the file is already started to download or is it a new one
    const dataExists = downloadsCtrl.itemExists(searchObj);

    // check if the url is not null or undefined
    if (!url) {
        console.log('No stream found'.red);
        // reject the promise with code (is the episode code)
        return reject({
            code
        });
    }
    // search if there an entry to the exact
    // same download if there is use it else create new one
    if (!dataExists) {
        downloadsCtrl.addItem({
            code,
            providerCode,
            filename,
            serieName: name,
            episode,
            season,
            progress: {},
            started: false,
            error: false,
            finished: false
        });
    }

    // creating new filedownload instance and assigning it to the gloval.Dl
    global.Dl = new filedownloader({
            url: encodeURI(url),
            saveas: filename,
            saveto: config('SAVETOFOLDER'),
            resume: true,
            deleteIfExists: config('DELETEIFEXISTS') || !dataExists
            // this is telling the filedownload to delete
            // the file if there no record of it and it does exist
        })
        .on('start', () => {
            downloadsCtrl.updateItem(searchObj, {
                started: true,
                error: false,
                finished: false
            });

            console.log(`Started ${filename}`.green);
        })
        .on('progress', (pr) => {
            process.stdout.clearLine(); // clear current text
            process.stdout.cursorTo(0);
            process.stdout.write(`${pr.progress}%`.blue + ' Downloaded'.green);
            if (pr.progress === 100) {
                console.log('', true);
            }

            downloadsCtrl.updateItem(searchObj, {
                progress: {
                    progress: pr.progress,
                    written: filesize(pr.dataWritten),
                    size: filesize(pr.filesize ? pr.filesize : 0),
                    speed: pr.speed
                }
            });
        })
        .on('end', () => {
            console.log(`${filename} Finished`.green, true, true);
            downloadsCtrl.updateItem(searchObj, {
                finished: true
            });

            thumbs.generate(); // generate the thumb
            utils.filesUpdated(); // clear the cache

            resolve();
        })
        .on('error', err => {
            console.log(err.red);
            downloadsCtrl.updateItem(searchObj, {
                error: true
            });
            // if any error emited reject with code to try
            // the next provider or just pass the episode
            reject({
                code
            });
        });
});
