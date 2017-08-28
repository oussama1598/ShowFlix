import express from 'express'
import config from './config/config'
import http from 'http'
import expressConfig from './config/express'
import Routes from './routes'
import Parser from './modules/Parser'

const app = express()
const server = http.createServer(app)
const parser = new Parser()

expressConfig(app)
Routes(app)
parser.init()

server.listen(config.port, config.ip, () =>
  console.log('server listening on %d', config.port)
)

export default app
