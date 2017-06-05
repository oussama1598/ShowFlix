const utils = require('../utils/utils')
const TVDB = require('node-tvdb')
const config = require('../modules/config')
const striptags = require('striptags')

const ENDPOINT = 'http://api.tvmaze.com/singlesearch/shows?q=%query%'
const SHOWENDPOINT = 'http://api.tvmaze.com/lookup/shows?imdb=%imdb%'

const tvdb = new TVDB(config('TVDB_API_KEY'))
const getId = (name, id = 'imdb') =>
  utils
    .getHtml(ENDPOINT.replace('%query%', name), true)
    .then(data => data.externals[id])

module.exports.getShowData = imdb => {
  const url = SHOWENDPOINT.replace('%imdb%', imdb)
  return utils
    .getHtml(url, true, 'GET', {}, {}, 10000, true)
    .then(res => utils.getHtml(`${res.url}?embed=episodes`, true))
    .then(data => ({
      imdb,
      thetvdb: data.externals.thetvdb,
      title: data.name,
      poster: data.image.medium,
      summary: striptags(data.summary),
      episodes: data._embedded.episodes.map(episode => ({
        title: episode.name,
        season: episode.season,
        episode: episode.number,
        summary: striptags(episode.summary),
        thumb: episode.image.medium
      }))
    }))
}

module.exports.getDataForEpisode = ({ name, season, episode }) => {
  let tvShowId = null
  return getId(name, 'thetvdb')
    .then(tvdbID => {
      tvShowId = tvdbID
      return tvdb.sendRequest(`series/${tvdbID}/episodes/query`, {
        query: {
          airedSeason: season,
          airedEpisode: episode
        }
      })
    })
    .then(res => res[0])
    .then(res => ({
      title: res.episodeName,
      id: res.id,
      showId: tvShowId,
      thumb: `http://thetvdb.com/banners/episodes/${tvShowId}/${res.id}.jpg`,
      poster: `http://thetvdb.com/banners/_cache/posters/${tvShowId}-1.jpg`,
      fullPoster: `http://thetvdb.com/banners/posters/${tvShowId}-1.jpg`
    }))
    .catch(err => console.log(err))
}

module.exports.getIMDBByName = getId
