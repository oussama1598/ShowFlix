const utils = require("../utils/utils");
const providers = require("../providers/providers");
const sourceBase = require("./sourceBase");
const urlParser = require('url');
const extend = require("extend");
const Q = require("q");

module.exports = extend(true, {
    name: "cera",
    providerCodes: [{
        code: 3,
        name: "openload"
    }, {
        code: 4,
        name: "UptoBox"
    }, {
        code: 2,
        name: "keeload"
    }, {
        code: 1,
        name: "googleDrive"
    }],
    canSearch: true,
    Url: "cera.online",
    decodeForProvider: function(Ecode, prov) {
        const provDetails = this.providerCodes[prov],
            provider = providers.get(provDetails.name),
            code = provDetails.code,
            serverUrl = `http://cera.online/wp-content/themes/Theme/servers/server.php?q=${Ecode}&i=${code}`;

        return utils.getHtml(serverUrl).then($ => {
            return provider($("iframe").attr("src"));
        })
    },
    BuildUrlsSource: function($) {
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
    search: function(details, ParticularEpisode) {
        const _this = this;
        return Q.Promise((resolve, reject) => {
            const CX = "018010331078829701272:y0xgo6cnjbw",
                season = utils.pad(details.season, 2),
                episode = ParticularEpisode ? utils.pad(ParticularEpisode, 2) : utils.pad(1, 2);

            let q = details.keyword.toLowerCase(),
                alreadyFound = false;

            utils.searchAPI(CX).build({
                q: `${q} S${season}E${episode}`,
                num: 10
            }, (err, res) => {
                if (err) {
                    reject("Something went wrong!");
                    return;
                }

                q = q.replace(/\s+/g, '-');

                for (item in res.items) {
                    const val = res.items[item];
                    const tryAgainst = ParticularEpisode ? `s${season}e${episode}` : `s${season}`;
                    if (val.link.indexOf(tryAgainst) > -1) {
                        return _this.compareTwoTitles(val.link, q, "-", result => {
                            if (result.count >= q.split("-").length) {
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
