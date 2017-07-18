import express from 'express'
import * as Controller from './shows.controller'

const router = express.Router()

router
  .get('/', Controller.getAllShows)
  .get('/:imdb', Controller.getShow)
  .get('/:imdb/:season/:episode', Controller.getTorrents)

export default router
