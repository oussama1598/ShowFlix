const utils = require('../utils/utils')
const TVDB = require('node-tvdb')
const config = require('../modules/config')

const ENDPOINT = 'http://api.tvmaze.com/singlesearch/shows?q=%query%'
const tvdb = new TVDB(config('TVDB_API_KEY'))
const getId = (name, id = 'imdb') =>
  utils
    .getHtml(ENDPOINT.replace('%query%', name), true)
    .then(data => data.externals[id])

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
