import * as errors from './components/errors'
import path from 'path'
import express from 'express'

// import Routes
import downloadsRouter from './api/downloads'
import showsRouter from './api/shows'
import queueRouter from './api/queue'
import subsRouter from './api/subtitles'

const ApiRouter = express.Router()

export default app => {
  ApiRouter.use('/downloads', downloadsRouter)
    .use('/', showsRouter)
    .use('/queue', queueRouter)
    .use('/subtitles', subsRouter)

  app.use('/api', ApiRouter)
    .get('/:url(api|auth|components|app|bower_components|assets)/*', errors.pageNotFound)
    .get('/*', (req, res) => {
      res.sendFile(path.resolve(`${app.get('appPath')}/index.html`))
    })
}
