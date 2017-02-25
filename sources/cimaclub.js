const utils = require("../utils/utils");
const providers = require("../providers/providers");
const sourceBase = require("./sourceBase");
const urlParser = require('url');
const extend = require("extend");
const Q = require("q");

const SEARCHURL = "http://cimaclub.com/?s=";

module.exports = extend(true, {
    name: "cimaclub",
    providerCodes: [{
        code: 1,
        name: "openload"
    }, {
        code: 4,
        name: "estream"
    }],
    canSearch: true,
    Url: "cimaclub.com",
    decodeForProvider: function(Ecode, prov) {
        const provDetails = this.providerCodes[prov],
            provider = providers.get(provDetails.name),
            code = provDetails.code,
            serverUrl = `http://cimaclub.com/wp-content/themes/Cimaclub/servers/server.php?q=${Ecode}&i=${code}`;

        return utils.getHtml(serverUrl).then($ => {
            return provider($("iframe").attr("src"));
        });
    },
    BuildUrlsSource: function($) {
        let Urls = {};

        $(".episodes .episode a").each(function() {
            $(this).find("span").remove();

            const url = decodeURI($(this).attr("href")),
                Enumber = $(this).text().trim().replace("\n", "");

            Urls[Enumber] = url;
        });

        return Urls;

    },
    Parse: function(SourceUrl) {
        return utils.getHtml(SourceUrl).then($ => {
            const url = $("link[rel='shortlink']").attr("href");

            return url ? urlParser.parse(url, true).query.p : false;
        });
    },
    search: function(details, ParticularEpisode) {
        const _this = this;
        return Q.Promise((resolve, reject) => {
            const season = utils.pad(details.season, 2),
                episode = ParticularEpisode ? utils.pad(ParticularEpisode, 2) : utils.pad(1, 2),
                matches = [`s${season}`, `e${episode}`];

            let q = details.keyword.toLowerCase(),
                alreadyFound = false;

            utils.getHtml(`${SEARCHURL}${q} ${matches[0]} ${matches[1]}`).then($ => {

                $(".moviesBlocks .movie a").each(function() {
                    let url = decodeURI($(this).attr("href")),
                        title = $(this).find("h2").text().toLowerCase();

                    _this.compareTwoTitles(title, q, " ", result => {
                        if (result.count >= q.split(" ").length) {
                            if (!alreadyFound) {
                                alreadyFound = true;
                                resolve(`${url}?view=1`);
                            }
                        } else {
                            reject("Can't find any url");
                        }
                    })

                })
                if (!alreadyFound) reject("Can't find any url");
            })
        })
    }
}, sourceBase);
