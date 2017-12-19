import { Router } from 'express'
import apicache from 'apicache'
import * as Controller from './shows.controller'

const cache = apicache.options({
  debug: true
}).middleware('5 minutes', (req, res) => {
  console.log(res.statusCode)
  return res.statusCode === 200
})

export default Router()
  .get('/', cache, Controller.getShowsByPage)
  .get('/:imdb', cache, Controller.getShow)
  .get('/:imdb/:season/:episode', cache, Controller.getTorrents)
