const utils = require('../utils/utils');
const _ = require('underscore');
const striptags = require('striptags');

const ENDPOINT = 'http://api.tvmaze.com/singlesearch/shows?q=%query%';

const sortItems = data => _.chain(data)
  .sortBy('season')
  .sortBy('episode')
  .sortBy('name')
  .value();

const addDataToEpisodes = (episodes, data) => {
  episodes.forEach((_episode) => {
    if (!data) return;

    const episode = _episode;
    const result = data._embedded.episodes.filter(item =>
      item.season === episode.season && item.number === episode.episode);

    episode.poster = data.image.medium;
    episode.title = result[0].name;
    episode.summary = striptags(result[0].summary);
  });
  return episodes;
};

module.exports.getIMDBByName = name => utils.getHtml(ENDPOINT.replace('%query%', name), true)
  .then(data => data.externals.imdb);

module.exports.getEpisodeDataByQuery = (data) => {
  const promises = [];

  data.forEach((episodes, key) => {
    const url = ENDPOINT.replace('%query%', key);
    promises.push(utils.getHtml(`${url}&embed=episodes`, true)
      .then(json => addDataToEpisodes(episodes, json))
      .catch(() => addDataToEpisodes(episodes)));
  });

  return Promise.all(promises)
    .then(result => sortItems(
      result.reduce((a, b) => a.concat(b))))
    .catch(result => sortItems(
      result.reduce((a, b) => a.concat(b))));
};

module.exports.getDataForEpisode = ({
  name,
  season,
  episode,
}) => {

};
