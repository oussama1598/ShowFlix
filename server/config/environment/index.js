'use strict'

import path from 'path'
import sharedConfig from './shared'

// Export the config object based on the NODE_ENV
// ==============================================
export default Object.assign({
  env: process.env.NODE_ENV,
  root: path.normalize(`${__dirname}/../../..`),
  browserSyncPort: process.env.BROWSER_SYNC_PORT || 3000,
  port: process.env.PORT || 9000,
  ip: process.env.IP || '0.0.0.0'
}, sharedConfig, require(`./${process.env.NODE_ENV}.js`) || {})
