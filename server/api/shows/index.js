import express from 'express'
import apicache from 'apicache'
import * as Controller from './shows.controller'
import config from '../../config/config'

const router = express.Router()
const cache = apicache.options({
  debug: config.env === 'development'
}).middleware('1 day', (req, res) => res.statusCode === 200)

router
  .get('/shows/:page', cache, Controller.getShowsByPage)
  .get('/show/:imdb', cache, Controller.getShow)
  .get('/show/:imdb/:season/:episode', cache, Controller.getTorrents)

export default router
