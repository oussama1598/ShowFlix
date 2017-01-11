const utils = require("../utils/utils");
const providers = require("../providers/providers");
const Q = require("q");
const urlParser = require('url');
const colors = require('colors');
const fs = require("fs");
const path = require("path");
const extend = require("extend");

module.exports = {
    name: undefined,
    providerCodes: [],
    canSearch: undefined,
    addToQueueFromTo: function(details, QUEUEPATH) { // replace with get {name, episode, season, from, to}
        const _this = this;
        return Q.Promise((resolve) => {
            const SourceName = _this.name;
            console.log(`Adding to the queue data from ${SourceName}`.yellow);

            _this.BuildUrls(details).then(urls => {
                utils.addToQueue(QUEUEPATH, urls, () => {
                    resolve();
                })
            })
        })
    },
    BuildUrls: function(details) {
        const _this = this,
            SourceName = _this.name;

        return Q.Promise((resolve, reject) => {
            console.log("Building Urls list".yellow);

            if (!details.season) {
                reject();
                return;
            }

            details = extend({
                name: null,
                season: 0,
                from: 0,
                to: "f" // f for finish
            }, details)

            utils.getHtml(details.providerUrl).then($ => {
                const Urls = _this.BuildUrlsSource($, details);
                let interval = [],
                    { from, to } = details;

                to = (details.to === "f") ? Object.keys(Urls)[utils.ObjectSize(Urls) - 1] : details.to;

                for (episode in Urls) {
                    episode = parseInt(episode);
                    if (Urls.hasOwnProperty(episode)) {
                        if (episode >= parseInt(from) && parseInt(episode) <= to) {
                            interval.push({
                                provider: SourceName,
                                url: Urls[episode],
                                name: details.name,
                                episode,
                                season: details.season,
                                done: false
                            });
                        }
                    }
                }

                console.log(`${interval.length} Episode(s) Found`.green);
                resolve(interval);
            })
        })
    },
    canNextProvider: function(prov) {
        return Q.Promise((resolve, reject) => {
            ++prov;
            if (prov < this.providerCodes.length) {
                console.log("Trying Next provider".red);
                resolve(prov);
            } else {
                console.log("Passing this episode".red);
                reject()
            }
        })
    },
    parseUrl: function(details, code) {
        const _this = this;

        return Q.Promise((resolve, reject) => {
            const SourceName = _this.name,
                { episode, season, url } = details;
            if (!code) {
                console.log(`Parsing Episode ${episode} Season ${season} From ${SourceName}`.green)

                _this.Parse(url).then(url => { resolve(url) }).catch(() => {
                    reject(true)
                });

            } else {
                resolve(code);
            }
        })
    },
    cansearch: function() {
        return Q.Promise((resolve, reject) => {
            if (this.canSearch) { resolve() } else { reject() }
        });
    }
}
