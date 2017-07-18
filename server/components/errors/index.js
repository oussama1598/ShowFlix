export function pageNotFound (req, res) {
  res.status(404)
  res.render('404', {}, (err, html) => {
    if (err) {
      return res.status(404).json({
        status: 404
      })
    }
    res.send(html)
  })
};
