const utils = require('../utils/utils');

module.exports.getAll = (req, res) => {
  if (!utils.cache.get('downloads')) {
    const data = global.downloadsdb
      .get()
      .value();

    utils.cache.set('downloads', data);
    return res.send(data);
  }

  return res.send(utils.cache.get('downloads'));
};

module.exports.deleteRecord = (req, res) => {
  res.send('ok');
};
