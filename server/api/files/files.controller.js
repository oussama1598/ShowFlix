import databases from '../../services/databases'

export const getAll = (req, res) =>
  res.status(200).send(
    databases
      .getDb('files')
      .get()
      .value()
  )

export function deleteRecord (req, res) {
  res.send('ok')
}
