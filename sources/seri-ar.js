const utils = require("../utils/utils");
const providers = require("../providers/providers");
const sourceBase = require("./sourceBase");
const urlParser = require('url');
const extend = require("extend");
const Q = require("q");

const SEARCHURL = "http://www.seri-ar.com/search?q=";

module.exports = extend(true, {
    name: "seri-ar",
    providerCodes: [{ code: 1, name: "googleDrive" }],
    canSearch: true,
    Url: "seri-ar.com",
    decodeForProvider: function(Ecode, prov) {
        const provDetails = this.providerCodes[prov],
            provider = providers.get(provDetails.name);

        return Q.Promise((resolve, reject) => {
            resolve(provider(Ecode));
        })
    },
    BuildUrlsSource: function($, infos) {
        let Urls = {},
            as = $(".post a"),
            spans = $(".post span"),
            urls = [];

        as.each(function(i) {
            const url = $(this).attr("href");
            if (url && url.indexOf("adf.ly") > -1) {
                urls.push(url);
            }
        });

        spans.each(function() {
            const Enumber = parseInt($(this).text().trim());
            if (!isNaN(Enumber)) {
                if (!Urls[Enumber]) {
                    Urls[Enumber] = {};
                    Urls[Enumber] = urls[utils.ObjectSize(Urls) - 1];
                }
            }
        })

        return Urls;
    },
    Parse: function(url) {
        return utils.Bypass(url);
    },
    search: function(details, ParticularEpisode) {
        const _this = this;
        return Q.Promise((resolve, reject) => {
            const season = details.season,
                matches = [`season-${season}`, `s${season}`];

            let q = details.keyword.toLowerCase(),
                alreadyFound = false;

            utils.getHtml(SEARCHURL + q).then($ => {
                q = q.replace(/\s+/g, '-');

                $(".post-body").each(function() {
                    let url = $(this).find("script").text();
                    url = url.match(/y="(.*?)",/)[1];

                    const matcheResults = [url.indexOf(matches[0]), url.indexOf(matches[1])];

                    if (matcheResults[0] > -1 || matcheResults[1] > -1) {
                        const matchString = [
                            url.substr(matcheResults[0] + matches[0].length)[0] === ".",
                            url.substr(matcheResults[1] + matches[1].length)[0] === "."
                        ];

                        if (matchString[0] || matchString[1]) {
                            _this.compareTwoTitles(url, q, "-", result => {
                                if (result.count >= q.split("-").length) {
                                    if (!alreadyFound) {
                                        alreadyFound = true;
                                        resolve(url);
                                    }
                                } else {
                                    reject("Can't find any url");
                                }
                            })
                        }
                    }
                })
                if (!alreadyFound) reject("Can't find any url");
            })
        })
    }
}, sourceBase);
