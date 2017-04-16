module.exports.getAll = (req, res) => {
    res.send(
        global.downloadsdb
        .db()
        .get('downloads')
        .value());
};

module.exports.deleteRecord = (req, res) => {
  res.send('ok');
};
