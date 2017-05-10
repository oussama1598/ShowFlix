const tvShowsApi = require('../lib/tvShowsApi');

module.exports.search = (req, res, next) => {
  req.checkQuery('keyword', 'Keyword is required')
    .notEmpty();
  req.checkQuery('season', 'Season is required')
    .notEmpty()
    .isInt()
    .withMessage('season must be a valid number');

  req.getValidationResult()
    .then((result) => {
      if (!result.isEmpty()) return Promise.reject(result.array());

      return tvShowsApi.search(req.query.keyword, req.query.season, req.query.episode)
        .catch(err => Promise.reject(err.message));
    })
    .then((data) => {
      res.send({
        status: true,
        data,
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
