const tvShowsApi = require('../lib/tvShowsApi');

module.exports.search = (req, res) => {
  req.checkQuery('keyword', 'Keyword is required')
    .notEmpty();
  req.checkQuery('season', 'Season is required')
    .notEmpty()
    .isInt()
    .withMessage('season must be a valid number');

  req.getValidationResult()
    .then((result) => {
      if (!result.isEmpty()) {
        return Promise.reject({
          message: result.array(),
        });
      }

      return tvShowsApi.search(req.query.keyword, req.query.season, req.query.episode)
        .catch(err => Promise.reject({
          message: err.toString(),
        }));
    })
    .then((data) => {
      res.send({
        status: true,
        data,
      });
    })
    .catch((err) => {
      res.send({
        status: false,
        error: err.message,
      });
    });
};
