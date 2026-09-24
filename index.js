const express = require('express');
const path = require('path');
const session = require('express-session');
const { testarConexao } = require('./src/Config/database');

const homeRoutes = require('./src/Routes/homeRoutes');
const usuarioRoutes = require('./src/Routes/usuarioRoutes');
const servicoRoutes = require('./src/Routes/servicoRoutes');
const contratacaoRoutes = require('./src/Routes/contratacaoRoutes');
const apiRoutes = require('./src/Routes/apiRoutes');

const app = express();
const port = 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src', 'Views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'herbway-segredo-tcc',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax' }
}));

app.use(homeRoutes);
app.use(usuarioRoutes);
app.use(servicoRoutes);
app.use(contratacaoRoutes);
app.use(apiRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  if (req.path.startsWith('/api/')) return res.status(500).json({ erro: 'Erro interno do servidor.' });
  res.status(500).send('Erro interno do servidor.');
});

testarConexao()
  .then(() => app.listen(port, () => console.log(`Rodando em: http://localhost:${port}`)))
  .catch(erro => {
    console.error('Não foi possível conectar ao MySQL.');
    console.error(erro.message);
    process.exit(1);
  });
