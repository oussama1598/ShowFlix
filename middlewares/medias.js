const utils = require('../utils/utils');

module.exports.check = () => (_req, res, next) => {
  const req = _req;
  const record = utils.filesdbHelpers.getFileBy({
      infoHash: req.params.infoHash,
    })
    .value();
  if (!record) return res.sendStatus(404);

  req.record = record;
  return next();
};
