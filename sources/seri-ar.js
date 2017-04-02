const utils = require('../utils/utils');
const providers = require('../providers/providers');
const sourceBase = require('./sourceBase');
const extend = require('extend');

const SEARCHURL = 'http://www.seri-ar.com/search?q=';

module.exports = extend(true, {
    name: 'seri-ar',
    providerCodes: [{ code: 1, name: 'googleDrive' }],
    canSearch: true,
    Url: 'seri-ar.com',
    decodeForProvider(Ecode, prov) {
        const provDetails = this.providerCodes[prov];
        const provider = providers.get(provDetails.name);

        return provider(Ecode);
    },
    BuildUrlsSource($) {
        const Urls = {};
        const as = $('.post a');
        const spans = $('.post span');
        const urls = [];

        as.each(function () {
            const url = $(this).attr('href');
            if (url && url.indexOf('adf.ly') > -1) {
                urls.push(url);
            }
        });

        spans.each(function () {
            const Enumber = parseInt($(this).text().trim(), 10);
            if (!isNaN(Enumber)) {
                if (!Urls[Enumber]) {
                    Urls[Enumber] = {};
                    Urls[Enumber] = urls[utils.ObjectSize(Urls) - 1];
                }
            }
        });

        return Urls;
    },
    Parse(url) {
        return utils.Bypass(url);
    },
    search(details) {
        const $this = this;
        return new Promise((resolve, reject) => {
            const season = details.season;
            const matches = [`season-${season}`, `s${season}`];

            let q = details.keyword.toLowerCase();
            let alreadyFound = false;

            utils.getHtml(SEARCHURL + q).then($ => {
                q = q.replace(/\s+/g, '-');

                $('.post-body').each(function () {
                    let url = $(this).find('script').text();
                    url = url.match(/y="(.*?)",/)[1];

                    const matcheResults = [url.indexOf(matches[0]), url.indexOf(matches[1])];

                    if (matcheResults[0] > -1 || matcheResults[1] > -1) {
                        const matchString = [
                            url.substr(matcheResults[0] + matches[0].length)[0] === '.',
                            url.substr(matcheResults[1] + matches[1].length)[0] === '.'
                        ];

                        if (matchString[0] || matchString[1]) {
                            $this.compareTwoTitles(url, q, '-', result => {
                                if (result.count >= q.split('-').length) {
                                    if (!alreadyFound) {
                                        alreadyFound = true;
                                        resolve(url);
                                    }
                                } else {
                                    reject('Can\'t find any url');
                                }
                            });
                        }
                    }
                });
                if (!alreadyFound) reject('Can\'t find any url');
            });
        });
    }
}, sourceBase);
