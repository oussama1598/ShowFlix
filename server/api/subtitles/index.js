import { Router } from 'express'
import { getSubs } from './subtitles.controller'

export default Router()
  .get('/', getSubs)
