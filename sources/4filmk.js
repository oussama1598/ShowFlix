const utils = require("../utils/utils");
const providers = require("../providers/providers");
const sourceBase = require("./sourceBase");
const urlParser = require('url');
const extend = require("extend");
const Q = require("q");

module.exports = extend(true, {
    name: "4filmk",
    providerCodes: [{
        name: "openload"
    }],
    canSearch: true,
    Url: "4filmk.tv",
    decodeForProvider: function(Ecode, prov) {
        const provDetails = this.providerCodes[prov],
            provider = providers.get(provDetails.name);

        return utils.getHtml(Ecode, false, "POST", {
            viewMovie: true
        }, {
            'Content-Type': 'application/x-www-form-urlencoded'
        }).then($ => {
            let toReturn;
            $("iframe").each(function() {
                const url = $(this).attr("src");
                if (url.indexOf(provDetails.name) > -1) toReturn = url;
            });
            return provider(toReturn);
        }).catch(err => {
            return Promise.reject({
                next: true
            });
        });
    },
    BuildUrlsSource: function($, infos) {
        let Urls = {};
        $(".blocksFilms").eq(0).find(".moviefilm").each(function() {
            const url = decodeURI($(this).find("a").eq(0).attr("href")),
                season = url.match(/s(\d+)/),
                episode = url.match(/e(\d+)/);

            if (season && season[1] == infos.season && episode) Urls[episode[1]] = url;
        })
        return Urls;
    },
    Parse: function(SourceUrl) {
        return Promise.resolve(SourceUrl);
    },
    search: function(details, ParticularEpisode) {
        const _this = this;
        return Q.Promise((resolve, reject) => {
            const CX = "012052478206051585516:giwv58bp5ze",
                season = utils.pad(details.season, 2);

            let matches = [`s${season}`],
                q = details.keyword.toLowerCase(),
                alreadyFound = false,
                query = `${q} S${season}`;

            if (ParticularEpisode) {
                matches.push(`s${utils.pad(ParticularEpisode, 2)}`);
                query += `e{matches[1]}`;
            }

            utils.searchAPI(CX).build({
                q: query,
                num: 10
            }, (err, res) => {
                if (err) {
                    reject("Something went wrong!");
                    return;
                }

                q = q.replace(/\s+/g, '-');

                for (item in res.items) {
                    const url = res.items[item].link.toLowerCase(),
                        matcheResults = [url.indexOf(matches[0]), ParticularEpisode ? url.indexOf(matches[1]) : 1];

                    if (matcheResults[0] > -1 && matcheResults[1] > -1) {
                        const matchString = [
                            url.substr(matcheResults[0] + matches[0].length)[0] === "e",
                            ParticularEpisode ? url.substr(matcheResults[1] + matches[1].length)[0] === "-" : true
                        ];

                        if (matchString[0] && matchString[1]) {
                            _this.compareTwoTitles(url, q, "-", result => {
                                if (result.count >= q.split("-").length) {
                                    if (!alreadyFound) {
                                        alreadyFound = true;
                                        resolve(decodeURI(url));
                                    }
                                } else {
                                    reject("Can't find any url");
                                }
                            })
                        }
                    }
                }

                return reject("Can't find any url");
            })
        })
    }
}, sourceBase);
