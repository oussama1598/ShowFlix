const utils = require('../utils/utils');
const tvShowsData = require('./tvshowsData');
const config = require('../modules/config');
const _ = require('underscore');

const parseSeason = data => _.chain(data)
  .map((_episode) => {
    const episode = _episode;
    delete episode.torrents['0'];
    return {
      episode: episode.episode,
      season: episode.season,
      torrents: episode.torrents,
    };
  })
  .filter(item => Object.keys(item.torrents)
    .length > 0)
  .sortBy(item => item.episode)
  .value();

module.exports.search = (name, _season, _episode) => {
  const season = parseInt(_season, 10);
  const episode = parseInt(_episode, 10);
  if (!season) return Promise.reject(new Error('Season is required'));

  return tvShowsData.getIMDBByName(name)
    .then(imdb => utils.getHtml(`${config('TV_SHOW_API.ENDPOINT')}${imdb}`, true))
    .then((data) => {
      if (episode) {
        const episodeRecord = _.filter(data.episodes, ep =>
          ep.season === season && ep.episode === episode)[0];

        if (!episodeRecord) {
          return Promise.reject(
            new Error('This episode doesnt exist'));
        }

        if (Object.keys(episodeRecord.torrents)
          .length <= 0) {
          return Promise.reject(
            new Error('This episode doesnt have any stream urls'));
        }

        delete episodeRecord.torrents['0'];
        return episodeRecord.torrents;
      }

      const seasonRecord = _.filter(data.episodes, ep =>
        ep.season === season);

      if (seasonRecord.length <= 0) {
        return Promise.reject(
          new Error('Season cannot be found'));
      }

      return parseSeason(seasonRecord);
    });
};
