import * as errors from './components/errors'
import path from 'path'
import ApiRouter from './api'

export default app => {
  app.use('/api', ApiRouter)
    .get('/:url(api|auth|components|app|bower_components|assets)/*', errors.pageNotFound)
    .get('/*', (req, res) => {
      res.sendFile(path.resolve(`${app.get('appPath')}/index.html`))
    })
}
