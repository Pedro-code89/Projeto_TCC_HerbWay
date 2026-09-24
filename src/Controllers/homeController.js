function home(req, res) {
  res.render('Pages/home', { pagina: 'dashboard' });
}

module.exports = { home };
