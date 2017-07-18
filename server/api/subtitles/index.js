import express from 'express'
import * as Controller from './subtitles.controller'

const router = express.Router()

router.route('/')
  .get(Controller.getSubs)

export default router
