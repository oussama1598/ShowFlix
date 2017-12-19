import { Router } from 'express'
import { getAll, addRecord, deleteRecord } from './queue.controller'

export default Router()
  .get('/', getAll)
  .post('/', addRecord)
  .delete('/', deleteRecord)
