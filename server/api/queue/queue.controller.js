import databases from '../../services/databases'
import parseTorrent from 'parse-torrent'
// import parser from '../modules/parser'

export const getAll = (req, res) =>
  res.send(
    databases
      .getDb('queue')
      .get()
      .value()
  )

export const deleteRecord = (req, res, next) => {
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

export const addRecord = (req, res, next) => {
  req.checkBody('magnet', 'magnet is required').notEmpty()
  req.checkBody('imdb', 'imdb is required').notEmpty()
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
    .checkBody('file', 'file is required')
    .notEmpty()
  req
    .checkBody('size', 'size is required')
    .notEmpty()
    .isInt()
    .withMessage('size must be a valid number')

  req
    .getValidationResult()
    .then(result => {
      if (!result.isEmpty()) {
        return res.status(400).send({
          status: false,
          errors: result.array()
        })
      }

      const infoHash = parseTorrent(req.body.magnet).infoHash
      databases.getDb('queue').add({
        infoHash,
        imdb: req.body.imdb,
        season: req.body.season,
        episode: req.body.episode,
        magnet: req.body.magnet,
        file: req.body.file,
        tried: false,
        done: false
      }, {
        infoHash
      })

      return res.sendStatus(200)
    })
    .catch(err => next(err))
}
