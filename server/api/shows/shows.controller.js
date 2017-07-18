import { getShowData } from '../../lib/tvshowsData'
import { cache } from '../../utils/utils'
import tvShowsApi from '../../lib/tvShowsApi'

export function getAllShows (req, res) {
  res.send({
    status: true
  })
}

export function getShow (req, res, next) {
  const cached = cache().get(req.path)
  if (cached) return res.send(cache)

  getShowData(req.params.imdb).then(data => {
    cache().set(req.path, data)
    res.send(data)
  })
    .catch(err => next(err))
}

export function getTorrents (req, res, next) {
  req.checkParams('season', 'Must be an integer').isInt()
  req.checkParams('episode', 'Must be an integer').isInt()

  req.getValidationResult().then(result => {
    if (!result.isEmpty()) {
      return res.send({
        status: false,
        errors: result.array()
      })
    }

    return tvShowsApi(req.params.imdb, req.params.season, req.params.episode)
  })
    .then(data => {
      res.send(Object.assign({
        status: true
      }, data))
    })
    .catch(err => next(err))
}
