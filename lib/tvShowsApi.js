const utils = require('../utils/utils')
const tvShowsData = require('./tvshowsData')
const config = require('../modules/config')
const _ = require('underscore')
const URL = require('url').URL

const parseEpisode = episode => ({
  title: episode.title,
  season: episode.season,
  episode: episode.episode,
  torrents: episode.items.map(torrent => ({
    hash: torrent.id,
    magnet: torrent.torrent_magnet,
    seeds: torrent.torrent_seeds,
    quality: torrent.quality,
    file: torrent.file
  }))
})

const parseSeason = data =>
  _.chain(data)
    .map(_episode => parseEpisode(episode))
    .filter(item => Object.keys(item.torrents).length > 0)
    .sortBy(item => item.episode)
    .value()

module.exports.search = (name, _season, _episode) => {
  const season = parseInt(_season, 10)
  const episode = parseInt(_episode, 10)
  if (!season) return Promise.reject(new Error('Season is required'))

  return tvShowsData
    .getIMDBByName(name)
    .then(imdb => {
      const url = new URL(config('TV_SHOW_API.ENDPOINT'))
      url.searchParams.append('imdb', imdb)

      return utils.getHtml(url.href, true)
    })
    .then(data => {
      if (!data) return Promise.reject(new Error('Nothing found :('))
      if (!data[season]) {
        return Promise.reject(new Error('Season cannot be found'))
      }

      if (episode) {
        const episodeRecord = _.filter(
          data[season],
          ep => ep.episode === episode
        )[0]

        if (!episodeRecord) {
          return Promise.reject(new Error('This episode doesnt exist'))
        }

        if (Object.keys(episodeRecord.torrents).length <= 0) {
          return Promise.reject(
            new Error('This episode doesnt have any stream urls')
          )
        }

        return parseEpisode(episodeRecord)
      }

      return parseSeason(data[season])
    })
}
