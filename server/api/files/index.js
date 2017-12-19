import { Router } from 'express'
import { getAll, deleteRecord } from './files.controller'

export default Router()
  .get('/', getAll)
  .delete('/', deleteRecord)
