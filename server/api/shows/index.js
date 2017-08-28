import express from 'express'
import apicache from 'apicache'
import * as Controller from './shows.controller'

const router = express.Router()
const cache = apicache.options({
  debug: true
}).middleware('5 minutes', (req, res) => {
  console.log(res.statusCode)
  return res.statusCode === 200
})

router
  .get('/shows/:page', cache, Controller.getShowsByPage)
  .get('/show/:imdb', cache, Controller.getShow)
  .get('/show/:imdb/:season/:episode', cache, Controller.getTorrents)

export default router
