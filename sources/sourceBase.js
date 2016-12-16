const utils = require("../utils/utils");
const providers = require("../providers/providers");
const Q = require("q");
const urlParser = require('url');
const colors = require('colors');
const fs = require("fs");
const path = require("path");

module.exports = {
    name: null,
    init: function(infos, dataPath) {
        const defer = Q.defer(), SourceName = this.name;

        console.log(`Initializing ${SourceName}'s data`.yellow);

        dataPath = path.join(dataPath, `${SourceName}.json`);

        if (fs.existsSync(dataPath)) {
            const SerieData = require(dataPath);

            if (SerieData.name === infos.name) {
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
        const defer = Q.defer(), SourceName = this.name;
        let Urls = {};

        console.log("Building Urls list".yellow);

        utils.getHtml(infos.providers[SourceName]).then($ => {
            const els = $(".episodesList a");

            Urls["name"] = infos.name;

            els.each(function(e) {
                const Enumber = $(this).attr("class").replace("serie", ""),
                    url = $(this).attr("href");

                Urls[Enumber] = url;
            });

            console.log(`${els.length} Episode(s) Found`.green);

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
    decodeForProvider: function(Ecode, prov) {
        const provDetails = this.providerCodes[prov],
            provider = providers.get(provDetails.name),
            code = provDetails.code,
            serverUrl = `http://cera.online/wp-content/themes/Theme/servers/server.php?q=${Ecode}&i=${code}`;

        return utils.getHtml(serverUrl).then($ => {
            return provider($("iframe").attr("src"));
        })
    },
    parseUrl: function(infos, code, dataPath, parsing) {
        return Q.Promise((resolve, reject) => {
            const defer = Q.defer(), SourceName = this.name;
            let url, SerieUrls;

            dataPath = path.join(dataPath, `${SourceName}.json`);

            if (!fs.existsSync(dataPath)) {
                console.log("Unable to find Serie data".red);
                reject();
                return;
            } else {
                SerieUrls = require(dataPath);

                if(utils.ObjectSize(SerieUrls) < 2){
                    console.log("Data is empty please try again. Note: The Data file will be deleted".red);
                    fs.unlink(dataPath);
                    reject();
                    return;
                }

                url = SerieUrls[infos.episode];
            }

            console.log(url)

            if (!code) {
                console.log(`Parsing Episode ${infos.episode} Season ${infos.season} From ${SourceName}`.green)

                utils.getHtml(url).then($ => {
                    parsing($).then(result => {
                        resolve(result);
                    })
                })

            } else {
                resolve(code);
            }
        })
    }
}
