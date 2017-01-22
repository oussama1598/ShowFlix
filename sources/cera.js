const utils = require("../utils/utils");
const providers = require("../providers/providers");
const sourceBase = require("./sourceBase");
const urlParser = require('url');
const extend = require("extend");
const Q = require("q");

module.exports = extend(true, {
    name: "cera",
    providerCodes: [{ code: 3, name: "openload" }, { code: 2, name: "keeload" }, { code: 4, name: "Uptobox" }, { code: 1, name: "googleDrive" }],
    canSearch: true,
    decodeForProvider: function(Ecode, prov) {
        const provDetails = this.providerCodes[prov],
            provider = providers.get(provDetails.name),
            code = provDetails.code,
            serverUrl = `http://cera.online/wp-content/themes/Theme/servers/server.php?q=${Ecode}&i=${code}`;

        return utils.getHtml(serverUrl).then($ => {
            return provider($("iframe").attr("src"));
        })
    },
    BuildUrlsSource: function($, infos) {
        let Urls = {};

        $(".episodesList a").each(function(e) {
            const Enumber = $(this).attr("class").replace("serie", ""),
                url = $(this).attr("href");

            Urls[Enumber] = url;
        });
        return Urls;

    },
    Parse: function(SourceUrl) {

        return utils.getHtml(SourceUrl).then($ => {
            let url = $("link[rel='shortlink']").attr("href");
            if (url)
                url = url ? urlParser.parse(url, true).query.p : false;
            else
                url = $("div[id^='post-ratings-']").attr("id").replace("post-ratings-", "");

            return url;
        });
    },
    search: function(details) {
        const _this = this;
        return Q.Promise((resolve, reject) => {
            const CX = "018010331078829701272:y0xgo6cnjbw";
            const season = ('' + details.season).length > 1 ? details.season : `0${details.season}`

            let q = details.keyword.toLowerCase();
            let alreadyFound = false;

            utils.searchAPI(CX).build({ q: `${q} S${season}`, num: 10 }, (err, res) => {
                if (err) {
                    reject("Something went wrong!");
                    return;
                }

                q = q.replace(/\s+/g, '-');

                for (item in res.items) {
                    const val = res.items[item];
                    if (val.link.indexOf(`s${season}`) > -1) {
                        return _this.compareTwoTitles(val.link, q, "-").then(result => {
                            if (result.count > 0) {
                                if (!alreadyFound) {
                                    alreadyFound = true;
                                    return resolve(val.link);
                                }
                            } else {
                                return reject("Can't find any url");
                            }
                        })
                    }
                }

                return reject("Can't find any url");
            })
        })
    }
}, sourceBase);
