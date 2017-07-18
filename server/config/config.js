import path from 'path'
import configJson from '../data/config.json'

export default Object.assign({
  env: process.env.NODE_ENV,
  root: path.normalize(`${__dirname}/../..`),
  browserSyncPort: process.env.BROWSER_SYNC_PORT || 3000,
  // Server port
  port: process.env.PORT || 8888,
  // Server IP
  ip: process.env.IP || '0.0.0.0'
}, configJson)
