const Q = require("q")
const request = require("request")
const cheerio = require("cheerio")
const fs = require("fs");
const colors = require("colors");
const apicache = require("apicache");
const del = require("del");
const _ = require("underscore");

function getHtml(url, json, cookies) {
    var defer = Q.defer();
    url = encodeURI(url);
    request(url, (error, response, body) => {
        if (!error && response.statusCode == 200) {
            if (json) {
                defer.resolve(body);
            } else {
                const $ = cheerio.load(body);

                defer.resolve((!cookies) ? $ : { $: $, cookies: parseCookies(response) });
            }
        } else {
            console.log("Error occured when requesting this url".red);
            defer.reject(new Error(error))
        }
    });

    return defer.promise;
}

function filesUpdated() {
    apicache.clear();
}

function parseCookies(res) {
    let list = [],
        rc = res.headers['set-cookie'];

    rc && rc.forEach(cookie => {
        let parts = cookie.split(";")[0];
        list.push(parts);
    })

    return list;
}


function BuildNextEpisode(infos, cb) {
    if (infos.max !== infos.episode) {
        infos.episode = ('' + (parseInt(infos.episode) + 1));
        updateJSON(infos, () => {
            cb(infos);
        });
    } else {
        console.log("All Done".yellow);
    }
}

function WriteSerieData(path, object, done) {
    fs.writeFile(path, JSON.stringify(object, null, 3), function(err) {
        if (err) return console.log(err);
        done();
    })
}

function updateJSON(object, done) {
    fs.writeFile("./data/infos.json", JSON.stringify(object, null, 3), function(err) {
        if (err) return console.log(err);
        done()
    });
}

function ObjectSize(object) {
    let size = 0;
    for (key in object) {
        if (object.hasOwnProperty(key))
            ++size;
    }
    return size;
}

function deleteFile(uri) {
    if (fs.existsSync(uri)) {
        return del(uri, {force: true});
    }
}

function arrayDeffrence(array){
   var rest = Array.prototype.concat.apply(Array.prototype, Array.prototype.slice.call(arguments, 1));

   var containsEquals = function(obj, target) {
    if (obj == null) return false;
    return _.any(obj, function(value) {
      return _.isEqual(value, target);
    });
  };

  return _.filter(array, function(value){ return ! containsEquals(rest, value); });
};

module.exports = {
    getHtml,
    BuildNextEpisode,
    WriteSerieData,
    ObjectSize,
    deleteFile,
    filesUpdated,
    arrayDeffrence
}
