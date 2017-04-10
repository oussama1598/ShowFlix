const utils = require('../utils/utils');
const providers = require('../providers/providers');
const sourceBase = require('./sourceBase');
const extend = require('extend');
const _ = require('underscore');

module.exports = extend(true, {
    name: 'cera',
    providerCodes: [{
        name: 'keeload',
        url: 'keeload'
    }, {
        name: 'estream',
        url: 'estream'
    }, {
        name: 'UptoBox'
    }, {
        name: 'openload'
    }, {
        name: 'googleDrive'
    }],
    canSearch: true,
    Url: 'cera.online',
    kawatchParser(URL, prov) {
        return utils.getHtml(URL, false, 'GET', {
            Referer: URL
        }).then($ => {
            const url = $('iframe').attr('src');
            if (url.indexOf(prov.url) > -1) return url;

            return null;
        }).catch(() => {

        });
    },
    checkUrls(urls, prov) {
        return new Promise(resolve => {
            urls.forEach(url => {
                if (url.indexOf(prov.url) > -1) {
                    resolve(url);
                    return false;
                }

                if (url.indexOf('kawatch') > -1) {
                    this.kawatchParser(url, prov)
                        .then(streamUrl => {
                            if (streamUrl) resolve(streamUrl);
                        });
                }
            });

            resolve(null);
        });
    },
    decodeForProvider(URL, prov) {
        const provDetails = this.providerCodes[prov];
        const provider = providers.get(provDetails.name);

        return utils.getHtml(URL).then($ => {
            const urls = [];
            $('script').each(function() {
                const content = $(this).html().toLowerCase();
                const match = content.match(/src=".*?"/);

                if (match) urls.push(utils.replaceAll(match[0], ['"', 'src='], ''));
            });

            return this.checkUrls(urls, provDetails).then(url => provider(url));
        });
    },
    BuildUrlsSource($) {
        const Urls = {};

        $('.serverDownload a').each(function() {
            const Enumber = $(this).attr('class').replace('serie', '');
            const url = $(this).attr('href');

            Urls[Enumber] = url;
        });
        return Urls;
    },
    Parse(SourceUrl) {
        return Promise.resolve(SourceUrl);
    },
    search(details, ParticularEpisode) {
        const $this = this;
        return new Promise((resolve, reject) => {
            const CX = '018010331078829701272:y0xgo6cnjbw';
            const season = utils.pad(details.season, 2);
            const episode = ParticularEpisode ? utils.pad(ParticularEpisode, 2) : utils.pad(1, 2);

            let q = details.keyword.toLowerCase();
            let alreadyFound = false;

            utils.searchAPI(CX).build({
                q: `${q} S${season}E${episode}`,
                num: 10
            }, (err, res) => {
                if (err) {
                    reject('Something went wrong!');
                    return;
                }

                q = q.replace(/\s+/g, '-');

                _.each(res.items, val => {
                    const tryAgainst = ParticularEpisode ? `s${season}e${episode}` : `s${season}`;

                    if (val.link.indexOf(tryAgainst) > -1) {
                        return $this.compareTwoTitles(val.link, q, '-', result => {
                            if (result.count >= q.split('-').length) {
                                if (!alreadyFound) {
                                    alreadyFound = true;
                                    return resolve(val.link);
                                }
                            } else {
                                return reject('Can\'t find any url');
                            }
                        });
                    }
                });

                return reject('Can\'t find any url');
            });
        });
    }
}, sourceBase);
