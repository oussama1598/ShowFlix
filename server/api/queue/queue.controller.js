import { cache } from '../../services/utils'
import databases from '../../services/databases'
import parseTorrent from 'parse-torrent'
// import parser from '../modules/parser'

export function getAll (req, res) {
  if (!cache().get('queue')) {
    const data = databases.getDb('queue').get().value()

    cache().set('queue', data)
    return res.send(data)
  }

  return res.send(cache().get('queue'))
}

export function deleteRecord (req, res, next) {
  req.checkBody('infoHash', 'infoHash is required.').notEmpty()

  req
    .getValidationResult()
    .then(result => {
      if (!result.isEmpty()) {
        res.send({
          status: false,
          errors: result.array()
        })
      }

      databases.getDb('queue').remove({
        infoHash: req.body.infoHash
      })
    })
    .then(() => {
      res.send({
        status: true
      })
    })
    .catch(err => next(err))
}

export function addRecord (req, res, next) {
  req.checkBody('title', 'title is required').notEmpty()
  req
    .checkBody('season', 'season is required')
    .notEmpty()
    .isInt()
    .withMessage('season must be a valid number')
  req
    .checkBody('episode', 'episode is required')
    .notEmpty()
    .isInt()
    .withMessage('episode must be a valid number')
  req
    .checkBody('thumb', 'thumb is required')
    .notEmpty()
  req
    .checkBody('magnet', 'magnet is required')
    .notEmpty()
  req
    .checkBody('quality', 'quality is required')
    .notEmpty()
  req
    .checkBody('file', 'file is required')
    .notEmpty()

  req
    .getValidationResult()
    .then(result => {
      if (!result.isEmpty()) {
        return res.send({
          status: false,
          errors: result.array()
        })
      }

      const infoHash = parseTorrent(req.body.magnet).infoHash
      databases.getDb('queue').add({
        infoHash,
        title: req.body.title,
        season: req.body.season,
        episode: req.body.episode,
        thumb: req.body.thumb,
        magnet: req.body.magnet,
        quality: req.body.quality,
        file: req.body.file,
        tried: false,
        done: false
      }, {
        infoHash
      })
    })
    .then(() => {
      res.send({
        status: true
      })
    })
    .catch(err => next(err))
}
