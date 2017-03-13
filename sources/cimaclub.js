const utils = require('../utils/utils');
const providers = require('../providers/providers');
const sourceBase = require('./sourceBase');
const urlParser = require('url');
const extend = require('extend');

const SEARCHURL = 'http://cimaclub.com/?s=';

module.exports = extend(true, {
    name: 'cimaclub',
    providerCodes: [{
        code: 4, // should change
        name: 'estream'
    }],
    canSearch: true,
    Url: 'cimaclub.com',
    decodeForProvider(Ecode, prov) {
        const provDetails = this.providerCodes[prov];
        const provider = providers.get(provDetails.name);
        const code = provDetails.code;
        const serverUrl = `http://cimaclub.com/wp-content/themes/Cimaclub/servers/server.php?q=${Ecode}&i=${code}`;

        return utils.byPassCloudflare(serverUrl).then($ => provider($('iframe').attr('src')));
    },
    BuildUrlsSource($) {
        const Urls = {};

        $('.episodes .episode a').each(function () {
            $(this).find('span').remove();

            const url = `${decodeURI($(this).attr('href'))}?view=1`;
            const Enumber = $(this).text().trim().replace('\n', '');

            Urls[Enumber] = url;
        });

        return Urls;
    },
    Parse(SourceUrl) {
        return utils.byPassCloudflare(SourceUrl).then($ => {
            const url = $('link[rel=\'shortlink\']').attr('href');
            return url ? urlParser.parse(url, true).query.p : false;
        });
    },
    search(details, ParticularEpisode) {
        const $this = this;
        return new Promise((resolve, reject) => {
            const season = utils.pad(details.season, 2);
            const episode = ParticularEpisode ? utils.pad(ParticularEpisode, 2) : utils.pad(1, 2);
            const matches = [`s${season}`, `e${episode}`];
            const q = details.keyword.toLowerCase();

            let alreadyFound = false;

            utils.getHtml(`${SEARCHURL}${q} ${matches[0]} ${matches[1]}`).then($ => {
                $('.moviesBlocks .movie a').each(function () {
                    const url = decodeURI($(this).attr('href'));
                    const title = $(this).find('h2').text().toLowerCase();

                    $this.compareTwoTitles(title, q, ' ', result => {
                        if (result.count >= q.split(' ').length) {
                            if (!alreadyFound) {
                                alreadyFound = true;
                                resolve(`${url}?view=1`);
                            }
                        } else {
                            reject('Can\'t find any url');
                        }
                    });
                });
                if (!alreadyFound) reject('Can\'t find any url');
            });
        });
    }
}, sourceBase);
