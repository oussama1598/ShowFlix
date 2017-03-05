const utils = require("../utils/utils");
const urlParser = require('url');
const colors = require('colors');
const extend = require("extend");

module.exports = {
    name: undefined,
    providerCodes: [],
    canSearch: undefined,
    Url: undefined,
    addToQueueFromTo: function(details) { // replace with get {name, episode, season, from, to}
        return this.BuildUrls(details).then(urls => {
            const queue = global.queuedb.db().get("queue"); // get the queue array
            urls.forEach(item => { // go throw all the urls
                if (!queue.find(item).value()) queue.push(item).write(); // if the item exist don't add it to the queue if not simply add it
            });
            console.log(`${urls.length} Episode(s) added to the queue`.yellow);
        })
    },
    BuildUrls: function(details) {
        if (!details.season) return Promise.reject();

        const _this = this,
            SourceName = _this.name;

        details.from = utils.fixInt(details.from);
        details.season = utils.fixInt(details.season);

        details = extend({
            keyword: null,
            season: 0,
            from: 0,
            to: "f" // f for finish
        }, details);

        return utils.getHtml(details.providerUrl).then($ => {
            const Urls = _this.BuildUrlsSource($, details); // get the list of all episodes in this season

            let interval = [],
                {
                    from,
                    to
                } = details;

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

            if (!interval.length) return Promise.reject("Nothing Found"); // if nothin found reject the promise

            return interval;
        })
    },
    canNextProvider: function(prov) {
        ++prov; // add one to provider

        if (prov < this.providerCodes.length) {
            console.log("Trying Next provider".red);
            return Promise.resolve(prov);
        } else {
            console.log("Passing this episode".red);
            return Promise.reject();
        }
    },
    parseUrl: function(details, code) {
        const SourceName = this.name,
            {
                episode,
                season,
                url,
                name
            } = details;

        if (code) return Promise.resolve(code);

        console.log(`Parsing ${name} S${season}E${episode} From ${SourceName}`.green)
        return this.Parse(url).catch(() => {
            return {
                next: true
            };
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

        fn({
            count,
            results
        });
    },
    cansearch: function() {
        return this.canSearch;
    }
}
