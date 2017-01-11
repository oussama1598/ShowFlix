const utils = require("../utils/utils");
const providers = require("../providers/providers");
const sourceBase = require("./sourceBase");
const urlParser = require('url');
const extend = require("extend");
const Q = require("q");

const SEARCHURL = "http://mosalsl.com/index.php/search/?query=";

module.exports = extend(true, {
    name: "mosalsl",
    providerCodes: [{ code: 3, name: "googleDrive" }],
    canSearch: true,
    decodeForProvider: function(Ecode, prov) {
        const provDetails = this.providerCodes[prov],
            provider = providers.get(provDetails.name);

        return Q.promise(resolve => {
            resolve(provider(Ecode));
        })
    },
    BuildUrlsSource: function($, infos) {
        let Urls = {};

        $(".ccm-remo-expand").each(function(e) {
            const Season = $(this).find(".ccm-remo-expand-title .ccm-icon").text();
            if (Season.indexOf(`Season ${infos.season}`) > -1) {
                $(this).find(".ccm-remo-expand-content a").each(function(e) {
                    const url = $(this).attr("href");

                    if (url.indexOf("drive.google.com") > -1) {

                        let Enumber = $(this).attr("title");

                        if (Enumber) {
                            Enumber = Enumber.substr(Enumber.indexOf("Episode ") + "Episode ".length, Enumber.length);

                            Urls[Enumber] = url;
                        }
                    }

                })
            }
        });

        return Urls;

    },
    Parse: function(SourceUrl) {
        return Q.Promise(resolve => { resolve(SourceUrl) });
    },
    search: function(details) {
        return Q.Promise((resolve, reject) => {
            utils.getHtml(SEARCHURL + details.name).then($ => {
                const results = $("#searchResults .searchResult");
                
                if (!results.length > 0) {
                    reject("Can't find any url");
                    return;
                }

                results.each(function() {
                    const el = $(this).find("h3 a"),
                        title = el.text().toLowerCase(),
                        url = el.attr("href");

                    if (title.indexOf(details.name.toLowerCase()) > -1) {
                        resolve(url);
                    }
                })
            })
        })
    }
}, sourceBase);
