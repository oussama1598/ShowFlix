const utils = require('../utils/utils');
const providers = require('../providers/providers');
const sourceBase = require('./sourceBase');
const extend = require('extend');

const SEARCHURL = 'http://www.4filmk.tv/?s=';

module.exports = extend(true, {
    name: '4filmk',
    providerCodes: [{
        name: 'estream'
    }],
    canSearch: true,
    Url: '4filmk.tv',
    decodeForProvider(Ecode, prov) {
        const provDetails = this.providerCodes[prov];
        const provider = providers.get(provDetails.name);

        return utils.getHtml(Ecode, false, 'POST', {
            viewMovie: true
        }, {
            'Content-Type': 'application/x-www-form-urlencoded'
        }).then($ => {
            let toReturn;
            $('iframe').each(function() {
                const url = $(this).attr('src');
                if (url.indexOf(provDetails.name) > -1) toReturn = url;
            });
            if (!toReturn) return Promise.reject();
            
            return provider(toReturn);
        }).catch(() => {
            Promise.reject({
                next: true
            });
        });
    },
    BuildUrlsSource($, infos) {
        const Urls = {};
        $('.blocksFilms').eq(0).find('.moviefilm').each(function() {
            const url = decodeURI($(this).find('a').eq(0).attr('href'));
            const season = url.match(/s(\d+)/);
            const episode = url.match(/e(\d+)/);

            if (
                season &&
                parseInt(season[1], 10) === infos.season &&
                episode
            ) Urls[parseInt(episode[1], 10)] = url;
        });

        const urlDetails = $('.movieTitle span').text().toLowerCase();
        const episodeMatch = urlDetails.match(/e(\d+)/);

        if (episodeMatch) {
            const urlEpisode = parseInt(episodeMatch[1], 10);
            if (!Urls[urlEpisode]) { // the given episode doesnt exist add it manualy
                Urls[urlEpisode] = decodeURI($('link[rel=\'canonical\']').attr('href'));
            }
        }

        return Urls;
    },
    Parse(SourceUrl) {
        return Promise.resolve(SourceUrl);
    },
    search(details, ParticularEpisode) {
        const $this = this;
        return new Promise((resolve, reject) => {
            const season = utils.pad(details.season, 2);
            const matches = [`s${season}`];

            let q = details.keyword.toLowerCase();
            let alreadyFound = false;
            let query = `${q} s${season}`;

            if (ParticularEpisode) {
                matches.push(`e${utils.pad(ParticularEpisode, 2)}`);
                query += `${matches[1]}`;
            }

            utils.getHtml(`${SEARCHURL}${query}`).then($ => {
                q = q.replace(/\s+/g, '-');

                $('.moviefilm').each(function() {
                    const url = decodeURI($(this).find('a').eq(0).attr('href'));

                    const matcheResults = [
                        url.indexOf(matches[0]),
                        ParticularEpisode ? url.indexOf(matches[1]) : 1
                    ];

                    if (matcheResults[0] > -1 && matcheResults[1] > -1) {
                        const matchString = [
                            url.substr(matcheResults[0] + matches[0].length)[0] === 'e',
                            ParticularEpisode ?
                            url.substr(matcheResults[1] + matches[1].length)[0] === '-' :
                            true
                        ];

                        if (matchString[0] && matchString[1]) {
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

                return reject('Can\'t find any url');
            });
        });
    }
}, sourceBase);
