const _ = require('underscore')
const striptags = require('striptags')
const utils = require('../utils/utils')
const TVDB = require('node-tvdb')
const config = require('../modules/config')

const ENDPOINT = 'http://api.tvmaze.com/singlesearch/shows?q=%query%'
const tvdb = new TVDB(config('TVDB_API_KEY'))

const sortItems = data =>
  _.chain(data).sortBy('season').sortBy('episode').sortBy('name').value()

const addDataToEpisodes = (episodes, data) => {
  episodes.forEach(_episode => {
    if (!data) return

    const episode = _episode
    const result = data._embedded.episodes.filter(
      item => item.season === episode.season && item.number === episode.episode
    )

    episode.poster = data.image.medium
    episode.title = result[0].name
    episode.summary = striptags(result[0].summary)
  })
  return episodes
}

const getId = (name, id = 'imdb') =>
  utils
    .getHtml(ENDPOINT.replace('%query%', name), true)
    .then(data => data.externals[id])

module.exports.getEpisodeDataByQuery = data => {
  const promises = []

  data.forEach((episodes, key) => {
    const url = ENDPOINT.replace('%query%', key)
    promises.push(
      utils
        .getHtml(`${url}&embed=episodes`, true)
        .then(json => addDataToEpisodes(episodes, json))
        .catch(() => addDataToEpisodes(episodes))
    )
  })

  return Promise.all(promises)
    .then(result => sortItems(result.reduce((a, b) => a.concat(b))))
    .catch(result => sortItems(result.reduce((a, b) => a.concat(b))))
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
