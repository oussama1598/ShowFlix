import { Router } from 'express'
import QueueRouter from './queue'
import FilesRouter from './files'
import ShowsRouter from './shows'
import SubsRouter from './subtitles'

export default Router()
  .use('/queue', QueueRouter)
  .use('/files', FilesRouter)
  .use('/shows', ShowsRouter)
  .use('/subtitles', SubsRouter)
