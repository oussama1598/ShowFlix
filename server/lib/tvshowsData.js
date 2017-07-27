import { _request } from '../services/utils'
import TVDB from 'node-tvdb'
import config from '../config/config'
import { URL } from 'url'

const ENDPOINT = 'http://api.tvmaze.com/singlesearch/shows?q=%query%'
const MY_API_ENDPOINT = 'https://showsdb-api.herokuapp.com/api/show'
const SHOWS_END_POINT = 'https://api.apidomain.info/shows'

const tvdb = new TVDB(config['tvdb_api_key'])
export function getId (name, id = 'imdb') {
  return _request(ENDPOINT.replace('%query%', name), true)
    .then(data => data.externals[id])
}

export function getShowData (imdb) {
  return _request(
    `${MY_API_ENDPOINT}/${imdb}`,
    true,
    'GET',
    {},
    {},
    10000
  )
}

export function getDataForEpisode ({ name, season, episode }) {
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

export function getShows (options = {}) {
  const uri = new URL(SHOWS_END_POINT)
  options = Object.assign({
    page: 1,
    sort: 'popularity',
    cb: 1
  }, options)

  Object.keys(options).forEach(key => {
    uri.searchParams.append(key, options[key])
  })

  return _request(uri, true, 'GET', {}, {}, 10000, false)
    .then(data => data.MovieList)
}
