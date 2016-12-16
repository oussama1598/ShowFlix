const utils = require("../utils/utils");
const providers = require("../providers/providers");
const Q = require("q");
const urlParser = require('url');
const colors = require('colors');
const fs = require("fs");
const path = require("path");


module.exports = {
    providerCodes: [{ code: 1, name: "top4top" }, { code: 1, name: "top4top" }],
    init: function(infos, dataPath) {
        const defer = Q.defer();

        console.log("Initializing 4helal data".yellow);

        dataPath = path.join(dataPath, "4helal.json");

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
        const defer = Q.defer();
        let Urls = {};

        console.log("Building Urls list".yellow);

        utils.getHtml(infos.providers["4helal"]).then($ => {
            const els = $(".episodes-table tbody tr");

            Urls["name"] = infos.name;

            els.each(function(e) {
                const Enumber = $(this).find("td").eq(0).text(),
                    url = $(this).find("td a").attr("href");

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
            serverUrl = `http://www.4helal.tv/ajax.php?id=${Ecode}&ajax=true&server=${code}`;

        return utils.getHtml(serverUrl, true).then(response => {
            return provider(urlParser.parse(response, true).query.url);
        })
    },
    parseUrl: function(infos, code, dataPath) {
        return Q.Promise((resolve, reject) => {
            let url, SerieUrls;

            dataPath = path.join(dataPath, "4helal.json");

            if (!fs.existsSync(dataPath)) {
                console.log("Unable to find Serie data".red);
                reject();
                return;
            } else {
                SerieUrls = require(dataPath);

                if (utils.ObjectSize(SerieUrls) < 2) {
                    console.log("Data is empty please try again. Note: The Data file will be deleted".red);
                    fs.unlink(dataPath);
                    reject();
                    return;
                }

                url = SerieUrls[infos.episode];
            }
            if (!code) {
                console.log(`Parsing Episode ${infos.episode} Season ${infos.season} From 4helal`.green)

                utils.getHtml(url).then($ => {
                    resolve(urlParser.parse($("meta[itemprop='embedURL']").attr("content"), true).query.f);
                })
            } else {
                resolve(code);
            }

        });
    }
}
