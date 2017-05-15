const filesHelper = require('../helpers/filesHelper')

module.exports.check = () => (_req, res, next) => {
  const req = _req
  const record = filesHelper
    .getFileBy({
      infoHash: req.params.infoHash
    })
    .value()
  if (!record) return res.sendStatus(404)

  req.record = record
  return next()
}
