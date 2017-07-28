export default function () {
  return (req, res, next) => {
    res.jsonify = obj => {
      res.set({ 'content-type': 'application/json;charset=utf-8' })
      res.end(JSON.stringify(obj))
    }
    next()
  }
}
