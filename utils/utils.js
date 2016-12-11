const Q = require("q")
const request = require("request")
const cheerio = require("cheerio")
const fs = require("fs");
const colors = require("colors");

function getHtml(url, json) {
    var defer = Q.defer();
    request(url, (error, response, body) => {
        if (!error && response.statusCode == 200) {
            if (json) {
                defer.resolve(body);
            } else { defer.resolve(cheerio.load(body)); }
        } else {
            defer.reject(new Error(error))
        }
    });

    return defer.promise;
}

function BuildNextEpisode(infos, cb) {
    if (infos.max !== infos.episode) {
        let next = ('' + (parseInt(infos.episode) + 1));
        next = next.length === 1 ? '0' + next : next;

        infos.episode = next;
        updateJSON(infos, () => {
            cb(infos);
        });
    } else {
        console.log("All Done".yellow);
    }
}

function updateJSON(object, done) {
    fs.writeFile("./infos.json", JSON.stringify(object), function(err) {
        if (err) return console.log(err);
        done()
    });
}

module.exports = {
    getHtml,
    BuildNextEpisode
}
