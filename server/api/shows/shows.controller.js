import { getShowData, getShows } from '../../lib/tvshowsData'
import tvShowsApi from '../../lib/tvShowsApi'

export function getShowsByPage (req, res, next) {
  req.checkParams('page', 'Must be an integer').isInt()

  req.getValidationResult().then(result => {
    if (!result.isEmpty()) {
      return res.status(400).send({
        status: false,
        errors: result.array()
      })
    }

    return getShows(Object.assign({page: req.params.page}, req.query))
  })
    .then(data => {
      res.jsonify({
        status: true,
        shows: data
      })
    })
    .catch(err => next(err))
}

export function getShow (req, res, next) {
  getShowData(req.params.imdb).then(data => res.jsonify(data))
    .catch(err => next(err))
}

export function getTorrents (req, res, next) {
  req.checkParams('season', 'Must be an integer').isInt()
  req.checkParams('episode', 'Must be an integer').isInt()

  req.getValidationResult().then(result => {
    if (!result.isEmpty()) {
      return res.status(400).send({
        status: false,
        errors: result.array()
      })
    }

    return tvShowsApi(req.params.imdb, req.params.season, req.params.episode)
  })
    .then(data => {
      res.jsonify(Object.assign({
        status: !(!(data))
      }, data))
    })
    .catch(err => next(err))
}
