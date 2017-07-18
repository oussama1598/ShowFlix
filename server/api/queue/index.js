import express from 'express'
import * as Controller from './queue.controller'

const router = express.Router()

router.route('/')
  .get(Controller.getAll)
  .post(Controller.addRecord)
  .delete(Controller.deleteRecord)

export default router
