const utils = require('../utils/utils');
const extend = require('extend');
const _ = require('underscore');

module.exports = {
    name: undefined,
    providerCodes: [],
    canSearch: undefined,
    Url: undefined,
    addToQueueFromTo(details) { // replace with get {name, episode, season, from, to}
        return this.BuildUrls(details).then(urls => {
            const queue = global.queuedb.db().get('queue'); // get the queue array
            urls.forEach(item => { // go throw all the urls
                if (!queue.find(item).value()) {
                    // if the item exist don't add it to the queue if not simply add it
                    queue.push(item).write();
                }
            });
            console.log(`${urls.length} Episode(s) added to the queue`.yellow);
        });
    },
    BuildUrls(_details) {
        let details = _details; // set local details object
        const SourceName = this.name; // get the source name

        if (!details.season) return Promise.reject(); // if theres no season reject

        details.from = utils.fixInt(details.from);
        details.season = utils.fixInt(details.season);

        details = extend({
            keyword: null,
            season: 0,
            from: 0,
            to: 'f' // f for finish
        }, details);

        return utils.getHtml(details.providerUrl).then($ => {
            // get the list of all episodes in this season
            const Urls = this.BuildUrlsSource($, details);
            const interval = [];
            const from = details.from;

            let to = details.to;

            to = (to === 'f') ? utils.getLastEpisode(Urls) : parseInt(to, 10);

            _.each(Object.keys(Urls), _episode => {
                const episode = parseInt(_episode, 10);
                if (episode >= parseInt(from, 10) && episode <= to) {
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
            });

            if (!interval.length) {
                // if nothin found reject the promise
                return Promise.reject('Nothing Found');
            }

            return interval;
        });
    },
    canNextProvider(_prov) {
        let prov = _prov;

        ++prov; // add one to provider

        if (prov < this.providerCodes.length) {
            console.log('Trying Next provider'.red);
            return Promise.resolve(prov);
        }

        console.log('Passing this episode'.red);
        return Promise.reject();
    },
    parseUrl(details, code) {
        const SourceName = this.name;
        const {
            episode,
            season,
            url,
            name
        } = details;

        if (code) return Promise.resolve(code);

        console.log(`Parsing ${name} S${season}E${episode} From ${SourceName}`.green);
        return this.Parse(url).catch(() => ({
            next: true
        }));
    },
    compareTwoTitles(_keyword, _title, str, fn) {
        const results = [];

        let count = 0;
        let keyword = _keyword;
        let title = _title;

        keyword = keyword.toLowerCase().split(str);
        title = title.toLowerCase().split(str);

        for (const word of title) {
            for (const item of keyword) {
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
    cansearch() {
        return this.canSearch;
    },
};
