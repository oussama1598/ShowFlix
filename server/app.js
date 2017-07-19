import express from 'express'
import config from './config/config'
import http from 'http'
import expressConfig from './config/express'
import Routes from './routes'
import databases from './services/databases'

const app = express()
const server = http.createServer(app)

expressConfig(app)
Routes(app)

server.listen(config.port, config.ip, () =>
  console.log('server listening on %d', config.port)
)

export default app
