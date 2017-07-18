const env = process.env.NODE_ENV = process.env.NODE_ENV || 'development'

if (env === 'development') require('babel-register')

module.exports = require('./app')
