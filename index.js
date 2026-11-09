const express = require('express');
const path = require('path');
const session = require('express-session');
const { testarConexao } = require('./src/Config/database');

const homeRoutes = require('./src/Routes/homeRoutes');
const usuarioRoutes = require('./src/Routes/usuarioRoutes');
const servicoRoutes = require('./src/Routes/servicoRoutes');
const contratacaoRoutes = require('./src/Routes/contratacaoRoutes');
const apiRoutes = require('./src/Routes/apiRoutes');
const localidadeRoutes = require('./src/Routes/localidadeRoutes');
const visualizacaoRoutes = require('./src/Routes/visualizacaoRoutes');

const app = express();
const port = 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src', 'Views'));
app.use('/vendor/leaflet', express.static(path.join(__dirname, 'node_modules', 'leaflet', 'dist')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));
app.use(express.json({ limit: '25mb' }));
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
app.use(localidadeRoutes);
app.use(visualizacaoRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  const status = err.statusCode || 500;
  const mensagem = err.statusCode ? err.message : 'Erro interno do servidor.';
  if (req.path.startsWith('/api/')) return res.status(status).json({ erro: mensagem });
  res.status(status).send(mensagem);
});

testarConexao()
  .then(() => app.listen(port, () => console.log(`Rodando em: http://localhost:${port}`)))
  .catch(erro => {
    console.error('Não foi possível conectar ao MySQL.');
    console.error(erro.message);
    process.exit(1);
  });
