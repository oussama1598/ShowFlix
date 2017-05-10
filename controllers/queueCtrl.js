const utils = require('../utils/utils');
const parser = require('../modules/parser');

module.exports.getRecords = (req, res) => {
  if (!utils.cache.get('queue')) {
    const data = global.queuedb
      .get()
      .value();

    utils.cache.set('queue', data);
    return res.send(data);
  }

  return res.send(utils.cache.get('queue'));
};

module.exports.deleteRecord = (req, res, next) => {
  req.checkBody('name', 'The name is required.')
    .notEmpty();
  req.checkBody('season', 'Season number is required.')
    .notEmpty()
    .isInt()
    .withMessage('Season must be a valid number');
  req.checkBody('episode', 'Episode number is required.')
    .notEmpty()
    .isInt()
    .withMessage('episode must be a valid number');

  req.getValidationResult()
    .then((result) => {
      if (!result.isEmpty()) return Promise.reject(result.array());

      return utils.deleteFromQueue(req.body);
    })
    .then(() => {
      res.send({
        status: true,
      });
    })
    .catch((error) => {
      if (error instanceof Error) return next(error);
      return res.send({
        status: false,
        error,
      });
    });
};

module.exports.addRecord = (req, res, next) => {
  req.checkBody('keyword', 'Keyword is required')
    .notEmpty();
  req.checkBody('season', 'Season is required')
    .notEmpty()
    .isInt()
    .withMessage('Season must be a valid number');
  req.checkBody('to', 'To is required')
    .notEmpty()
    .isIntOrF()
    .withMessage('To is not a valid entry');
  req.checkBody('from', 'From is required')
    .notEmpty()
    .isInt()
    .withMessage('From must be a valid number')
    .FromAndTo(req.body.to)
    .withMessage('from can\'t be less that to');

  req.getValidationResult()
    .then((result) => {
      if (!result.isEmpty()) {
        return Promise.reject(result.array());
      }

      return parser.addtoQueue(
          req.body.keyword,
          req.body.season,
          req.body.from,
          req.body.to)
        .catch(err => Promise.reject(err.message));
    })
    .then(() => {
      res.send({
        status: true,
      });
    })
    .catch((error) => {
      if (error instanceof Error) return next(error);
      return res.send({
        status: false,
        error,
      });
    });
};

module.exports.getFilesFromMagnet = (req, res, next) => {
  req.checkQuery('magnet', 'Magnet uri is required').notEmpty();

  req.getValidationResult()
    .then((result) => {
      if (!result.isEmpty()) return Promise.reject(result.array());

      return parser.getFilesFromMagnet(req.query.magnet);
    })
    .then((files) => {
      res.json({
        status: true,
        files,
      });
    })
    .catch((error) => {
      if (error instanceof Error) return next(error);

      return res.json({
        status: false,
        error,
      });
    });
};

module.exports.addMagnet = (req, res, next) => {
  req.checkBody('magnet', 'Magnet uri is required').notEmpty();
  req.checkBody('filename', 'filename is required').notEmpty();

  req.getValidationResult()
    .then((result) => {
      if (!result.isEmpty()) return Promise.reject(result.array());

      return parser.addMagnetUri(
        req.body.magnet,
        req.body.filename);
    })
    .then(() => {
      res.json({
        status: true,
      });
    })
    .catch((error) => {
      if (error instanceof Error) return next(error);

      return res.json({
        status: false,
        error,
      });
    });
};
