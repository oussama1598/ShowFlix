const utils = require("../utils/utils");
const providers = require("../providers/providers");
const sourceBase = require("./sourceBase");
const urlParser = require('url');
const extend = require("extend");
const Q = require("q");

const SEARCHURL = "http://www.4helal.tv/search.php?t=";

module.exports = extend(true, {
    name: "4helal",
    providerCodes: [{ code: 1, name: "openload" }],
    canSearch: true,
    Url: "4helal.tv",
    decodeForProvider: function(Ecode, prov) {
        const provDetails = this.providerCodes[prov],
            provider = providers.get(provDetails.name);

        return Q.Promise((resolve, reject) => {
            resolve(provider(Ecode));
        })
    },
    BuildUrlsSource: function($, infos) {
        let Urls = {};

        $(".episodes-table").eq(0).find("tbody tr").each(function(e) {
            const Enumber = $(this).find("td").eq(0).text(),
                url = $(this).find("td a").attr("href");

            Urls[Enumber] = url;
        });

        return Urls;

    },
    Parse: function(url) {
        return Q.Promise((resolve, reject) => {
            utils.getHtml(url).then($ => {
                const results = $(".download-section a");
                if (results.length == 0) return reject();

                results.each(function() {
                    const el = $(this);
                    if (el.attr("href").indexOf("openload.co") > -1) {
                        return resolve(el.attr("href").replace("f", "embed"));
                    }
                })
                return reject();
            })
        })
    },
    search: function(details, ParticularEpisode) {
        const _this = this;
        return Q.Promise((resolve, reject) => {
            const CX = "012052478206051585516:pikrjblfxt0",
                season = details.season,
                episode = ParticularEpisode || "1",
                matches = [`الموسم ${season}`, `الحلقة ${episode}`];

            let q = details.keyword.toLowerCase();
            let alreadyFound = false;

            utils.searchAPI(CX).build({ q: `${q} ${matches[0]} ${matches[1]}`, num: 10 }, (err, res) => {
                if (err) {
                    return reject("Something went wrong!");
                }

                for (item in res.items) {
                    const val = res.items[item],
                        title = val.title.toLowerCase().replace("مسلسل", "").trim(),
                        matcheResults = [title.indexOf(matches[0]), title.indexOf(matches[1])];

                    if (matcheResults[0] > -1 && matcheResults[1] > -1) {
                        const matchString = [
                            title.substr(matcheResults[0] + matches[0].length)[0] === " ",
                            title.substr(matcheResults[1] + matches[1].length)[0] === " "
                        ];

                        if (matchString[0] && matchString[1]) {
                            _this.compareTwoTitles(title, q, " ", result => {
                                if (result.count >= q.split(" ").length) {
                                    if (!alreadyFound) {
                                        alreadyFound = true;
                                        resolve(val.link);
                                    }
                                } else {
                                    reject("Can't find any url");
                                }
                            })
                        }
                    }
                }
                if (!alreadyFound) reject("Can't find any url");
            })
        })
    }
}, sourceBase);
