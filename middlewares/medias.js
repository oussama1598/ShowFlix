const mediasHandler = require('../modules/mediasHandler');

module.exports.check = (_req, res, next) => {
    const req = _req;
    const record = mediasHandler.getFileBy({
        infoHash: req.params.infoHash
    }).value();
    if (!record) return res.sendStatus(404);

    req.record = record;
    next();
};
