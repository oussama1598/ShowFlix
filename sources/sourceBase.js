const utils = require("../utils/utils");
const providers = require("../providers/providers");
const Q = require("q");
const urlParser = require('url');
const colors = require('colors');
const fs = require("fs");
const path = require("path");

module.exports = {
    name: undefined,
    providerCodes: [],
    init: function(infos, dataPath) {
        const defer = Q.defer(),
            SourceName = this.name;

        console.log(`Initializing ${SourceName}'s data`.yellow);

        dataPath = path.join(dataPath, `${SourceName}.json`);

        if (fs.existsSync(dataPath)) {
            const SerieData = require(dataPath);

            if (SerieData.name === infos.name && SerieData.season === infos.season) {
                defer.resolve();

            } else {
                console.log("Serie has been changed rebuilding Urls".yellow);
                return this.BuildUrls(infos, dataPath);
            }
        } else {
            return this.BuildUrls(infos, dataPath);
        }
        return defer.promise;
    },
    BuildUrls: function(infos, dataPath) {
        const defer = Q.defer(),
            _this = this,
            SourceName = _this.name;

        console.log("Building Urls list".yellow);

        utils.getHtml(infos.providers[SourceName]).then($ => {
            const Urls = _this.BuildUrlsSource($, infos),
                episodes = utils.ObjectSize(Urls) - 2;

            console.log(`${episodes} Episode(s) Found`.green);

            utils.WriteSerieData(dataPath, Urls, () => {
                defer.resolve();
            })

        })
        return defer.promise;
    },
    canNextProvider: function(prov) {
        const defer = Q.defer();
        ++prov;
        if (prov < this.providerCodes.length) {
            console.log("Trying Next provider".red);
            defer.resolve(prov);
        } else {
            console.log("Passing this episode".red);
            defer.reject()
        }

        return defer.promise;
    },
    parseUrl: function(infos, code, dataPath) {
        const _this = this;
        return Q.Promise((resolve, reject) => {
            const defer = Q.defer(),
                SourceName = _this.name;
            let url, SerieUrls;

            dataPath = path.join(dataPath, `${SourceName}.json`);

            if (!fs.existsSync(dataPath)) {
                console.log("Unable to find Serie data".red);
                reject();
                return;
            } else {
                SerieUrls = require(dataPath);

                if (utils.ObjectSize(SerieUrls) < 3) {
                    console.log("Data is empty please try again. Note: The Data file will be deleted".red);
                    fs.unlink(dataPath);
                    reject();
                    return;
                }

                url = SerieUrls[infos.episode];
            }

            if (!code) {
                console.log(`Parsing Episode ${infos.episode} Season ${infos.season} From ${SourceName}`.green)

                return _this.Parse(url).then(url => { resolve(url) }).catch(() => {
                    reject(true)
                });

            } else {
                resolve(code);
            }
        })
    }
}
