import express from 'express'
import * as Controller from './downloads.controller'

const router = express.Router()

router.route('/')
  .get(Controller.getAll)
  .delete(Controller.deleteRecord)

export default router
