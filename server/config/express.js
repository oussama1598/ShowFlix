'use strict'

import express from 'express'
import favicon from 'serve-favicon'
import morgan from 'morgan'
import shrinkRay from 'shrink-ray'
import bodyParser from 'body-parser'
import methodOverride from 'method-override'
import cookieParser from 'cookie-parser'
import errorHandler from 'errorhandler'
import path from 'path'
import config from './config'

// middlewares
import expressValidator from '../middlewares/expressValidator'
import jsonify from '../middlewares/jsonify'

export default app => {
  const env = app.get('env')

  if (env === 'development') {
    app.use(express.static(path.join(config.root, '.tmp')))
  }

  app.use(favicon(path.join(config.root, 'client', 'favicon.ico')))
  app.set('appPath', path.join(config.root, 'client'))
  app.use(express.static(app.get('appPath')))
  app.use(morgan('dev'))

  app.set('views', `${config.root}/server/views`)
  app.engine('html', require('ejs').renderFile)
  app.set('view engine', 'html')
  app.use(shrinkRay())
  app.use(bodyParser.urlencoded({ extended: false }))
  app.use(bodyParser.json())
  app.use(methodOverride())
  app.use(cookieParser())
  app.use(expressValidator())
  app.use(jsonify())

  if (env === 'development') {
    const webpackDevMiddleware = require('webpack-dev-middleware')
    const stripAnsi = require('strip-ansi')
    const webpack = require('webpack')
    const makeWebpackConfig = require('../../webpack.make')
    const webpackConfig = makeWebpackConfig({ DEV: true })
    const compiler = webpack(webpackConfig)
    const browserSync = require('browser-sync').create()

    /**
     * Run Browsersync and use middleware for Hot Module Replacement
     */
    browserSync.init({
      open: false,
      logFileChanges: false,
      proxy: `localhost:${config.port}`,
      ws: true,
      middleware: [
        webpackDevMiddleware(compiler, {
          noInfo: false,
          stats: {
            colors: true,
            timings: true,
            chunks: false
          }
        })
      ],
      port: config.browserSyncPort,
      plugins: ['bs-fullscreen-message']
    })

    /**
     * Reload all devices when bundle is complete
     * or send a fullscreen error message to the browser instead
     */
    compiler.plugin('done', stats => {
      console.log('webpack done hook')
      if (stats.hasErrors() || stats.hasWarnings()) {
        return browserSync.sockets.emit('fullscreen:message', {
          title: 'Webpack Error:',
          body: stripAnsi(stats.toString()),
          timeout: 100000
        })
      }
      browserSync.reload()
    })
  }

  if (env === 'development' || env === 'test') {
    app.use(errorHandler()) // Error handler - has to be last
  }
}
