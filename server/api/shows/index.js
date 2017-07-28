import express from 'express'
import * as Controller from './shows.controller'

const router = express.Router()

router
  .get('/:page', Controller.getShowsByPage)
  .get('/show/:imdb', Controller.getShow)
  .get('/show/:imdb/:season/:episode', Controller.getTorrents)

export default router
