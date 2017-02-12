const utils = require("../utils/utils");
const providers = require("../providers/providers");
const Q = require("q");
const urlParser = require('url');
const colors = require('colors');
const fs = require("fs");
const path = require("path");
const extend = require("extend");
const async = require("async");

module.exports = {
    name: undefined,
    providerCodes: [],
    canSearch: undefined,
    Url: undefined,
    addToQueueFromTo: function(details, QUEUEPATH) { // replace with get {name, episode, season, from, to}
        const _this = this;
        const SourceName = _this.name;
        return _this.BuildUrls(details).then(urls => {
            utils.addToQueue(QUEUEPATH, urls.slice(0), () => {
                console.log(`${urls.length} Episode(s) added to the queue`.yellow);
            })
        })
    },
    BuildUrls: function(details) {
        const _this = this,
            SourceName = _this.name;

        return Q.Promise((resolve, reject) => {
            if (!details.season) {
                reject();
                return;
            }

            details.from = utils.fixInt(details.from);
            details.season = utils.fixInt(details.season);

            details = extend({
                keyword: null,
                season: 0,
                from: 0,
                to: "f" // f for finish
            }, details)

            utils.getHtml(details.providerUrl).then($ => {
                const Urls = _this.BuildUrlsSource($, details);

                let interval = [],
                    { from, to } = details;

                to = (details.to === "f") ? utils.getLastEpisode(Urls) : (isNaN(details.to) ? details.to : parseInt(details.to));

                for (episode in Urls) {
                    episode = parseInt(episode);
                    if (Urls.hasOwnProperty(episode)) {
                        if (episode >= parseInt(from) && parseInt(episode) <= to) {
                            interval.push({
                                provider: SourceName,
                                url: Urls[episode],
                                name: details.keyword,
                                episode,
                                season: details.season,
                                done: false,
                                tried: false
                            });
                        }
                    }
                }

                if (interval.length <= 0) return reject("Nothing Found");
                resolve(interval);
            }).catch(err => {
                reject(err);
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
        const _this = this,
            SourceName = _this.name,
            { episode, season, url, name } = details;

        if (code) return Promise.resolve(code);

        console.log(`Parsing ${name} S${season}E${episode} From ${SourceName}`.green)
        return _this.Parse(url).catch(() => {
            return { next: true };
        });
    },
    compareTwoTitles: function(keyword, title, str, fn) {
        let results = [],
            count = 0;

        keyword = keyword.toLowerCase().split(str);
        title = title.toLowerCase().split(str);

        for (word of title) {
            for (item of keyword) {
                if (word.indexOf(item) > -1 || item.indexOf(word) > -1) {
                    results.push(word);
                    ++count;
                }
            }
        }

        fn({ count, results });
    },
    cansearch: function() {
        return this.canSearch;
    }
}
