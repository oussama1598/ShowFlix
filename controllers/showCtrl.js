const tvShowsData = require('../lib/tvshowsData')
const utils = require('../utils/utils')

module.exports.getShow = (req, res) => {
  const cache = utils.cache.get(req.path)
  if (cache) return res.send(cache)

  tvShowsData.getShowData(req.params.imdb).then(data => {
    utils.cache.set(req.path, data)
    res.send(data)
  })
}
