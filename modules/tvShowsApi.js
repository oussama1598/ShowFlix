const utils = require('../utils/utils');
const tvShowsData = require('./tvshowsData');
const config = require('./config');

const parseEpisodeMagnets = data => data.map(torrent => ({
    magnet: torrent.torrent_magnet,
    quality: torrent.quality,
    seeds: torrent.torrent_seeds
}));

const parseSeasonMagnets = data => data.map(episode =>
        parseEpisodeMagnets(episode.items))
    .filter(item => item.length > 0);

const search = (name, season, episode) => {
    if (!season) return Promise.reject(new Error('Season is required'));

    return tvShowsData.getIMDBByName(name)
        .then(imdb => utils.getHtml(`${config('TV_SHOW_API.ENDPOINT')}show?imdb=${imdb}`, true))
        .then(data => {
            if (!data[season]) return Promise.reject(new Error('Season cannot be found'));
            if (!episode) return parseSeasonMagnets(data[season]);

            const episodeDetails = data[season]
                .filter(item => item.episode === episode.toString())[0];

            if (!episodeDetails) {
                return Promise.reject(
                    new Error('This episode doesnt exist')
                );
            }

            if (episodeDetails.items.length <= 0) {
                return Promise.reject(
                    new Error('This episode doesnt have any stream urls')
                );
            }

            return parseEpisodeMagnets(episodeDetails.items);
        });
};

module.exports = {
    search
};
