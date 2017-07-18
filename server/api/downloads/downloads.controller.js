import { cache } from '../../utils/utils'
import databases from '../../config/databases'

export function getAll (req, res) {
  if (!cache().get('downloads')) {
    const data = databases.getDb('downloads').get().value()

    cache().set('downloads', data)
    return res.send(data)
  }

  return res.send(cache().get('downloads'))
}

export function deleteRecord (req, res) {
  res.send('ok')
}
