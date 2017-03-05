const utils = require('../utils/utils');
const _ = require('underscore');
const path = require('path');
const Q = require('q');
const striptags = require('striptags');

const ENDPOINT = 'http://api.tvmaze.com/singlesearch/shows?q=%query%&embed=episodes';
const SHOWSENDPOINT = 'http://tvdb-images.herokuapp.com/shows/';

function getShows(page) {
    return utils.getHtml(`${SHOWSENDPOINT}${page}`, true);
}

function parseFromFilename(filename) {
    let season = filename.match(/s\d+/gi)[0].toLowerCase();
    let episode = filename.match(/e\d+/gi)[0].toLowerCase();
    let serieName = path.basename(filename, path.extname(filename)).toLowerCase();

    const toReplace = [season, episode];

    _.each(toReplace, val => {
        serieName = serieName.replace(val, '').trim();
    });

    season = season.replace('s', '');
    episode = episode.replace('e', '');

    return {
        season,
        episode,
        serieName
    };
}

function getEpisodeDataByQuery(episodes) {
    const toReturn = [];
    const promise = [];

    _.each(episodes, (val, key) => {
        const url = ENDPOINT.replace('%query%', key);

        promise.push(utils.getHtml(url, true).then(json => {
            addEpisodes(val, json);
        }).catch(() => {
            addEpisodes(val);
        }));
    });

    function addEpisodes(val, json) {
        _.each(val, _episode => {
            const episode = _episode;
            const result = (json) ?
                json._embedded.episodes.filter(item =>
                    item.season === episode.season && item.number === episode.episode) :
                null;

            episode.poster = (json) ? json.image.medium : null;
            episode.title = (json) ? result[0].name : null;
            episode.summary = (json) ? striptags(result[0].summary) : null;

            toReturn.push(episode);
        });
    }

    function Sort() {
        return _(toReturn)
            .chain()
            .sortBy('seaon')
            .sortBy('episode')
            .sortBy('serieName');
    }

    return Q.all(promise).then(() => Sort()).catch(() => Sort());
}

module.exports = {
    getEpisodeDataByQuery,
    parseFromFilename,
    getShows
};
