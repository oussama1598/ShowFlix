const utils = require('../utils/utils');

module.exports.getRecords = (req, res) => {
    res.send(
        global.queuedb
        .db()
        .get('queue')
        .value()
    );
};

module.exports.deleteRecord = (req, res) => {
    req.checkBody('name', 'The name is required.').notEmpty();
    req.checkBody('season', 'Season number is required.')
        .notEmpty()
        .isInt()
        .withMessage('Season must be a valid number');
    req.checkBody('episode', 'Episode number is required.')
        .notEmpty()
        .isInt()
        .withMessage('episode must be a valid number');

    req.getValidationResult().then(result => {
            if (!result.isEmpty()) {
                return Promise.reject({
                    message: result.array()
                });
            }

            return utils.deleteFromQueue(req.body);
        })
        .then(() => {
            res.send({
                status: true
            });
        })
        .catch(err => {
            res.send({
                status: false,
                error: err.message
            });
        });
};

module.exports.addRecord = (req, res) => {
    req.checkBody('keyword', 'Keyword is required').notEmpty();
    req.checkBody('season', 'Season is required')
        .notEmpty()
        .isInt()
        .withMessage('Season must be a valid number');
    req.checkBody('to', 'To is required')
        .notEmpty()
        .isIntOrF()
        .withMessage('To is not a valid entry');
    req.checkBody('from', 'From is required').notEmpty()
        .isInt()
        .withMessage('From must be a valid number')
        .FromAndTo(req.body.to)
        .withMessage('from can\'t be less that to');

    req.getValidationResult().then(result => {
            if (!result.isEmpty()) {
                return Promise.reject(result.array());
            }

            return Promise.resolve();
        })
        .then(() => {
            res.send({
                status: true
            });
        })
        .catch(error => {
            res.send({
                status: false,
                error
            });
        });

    // sources.addtoQueue({
    //     keyword,
    //     season,
    //     from,
    //     to
    // }, null, Url).then(() => {
    //     res.send({
    //         status: true
    //     });
    // }).catch(error => {
    //     global.log(error);
    //     res.send({
    //         status: false,
    //         error
    //     });
    // });
};
