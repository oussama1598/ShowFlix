module.exports = () => (_err, req, res, next) => {
  const err = _err;
  const env = process.env.NODE_ENV || 'development';

  if (env !== 'development') {
    err.stack = 'Internal Server Error';
  }

  res.send({
    status: false,
    error: err.stack,
  });
};
