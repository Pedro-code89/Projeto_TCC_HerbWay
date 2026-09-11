// Dependências
const express = require('express');
const path = require('path');

// Importando as rotas
const homeRoutes = require('./src/Routes/homeRoutes');
const jardineiroRoutes = require('./src/Routes/jardineiroRoutes');
const usuarioRoutes = require('./src/Routes/usuarioRoutes');

// Servidor
const app = express();
const port = 3000;

// Configuração do EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src', 'Views'));

// Arquivos públicos
app.use(express.static(path.join(__dirname, 'public')));

// Formulários
app.use(express.urlencoded({ extended: true }));

// Rotas
app.use(homeRoutes);
//app.use(jardineiroRoutes);
app.use(usuarioRoutes);

// Iniciando o servidor
app.listen(port, () => {
    console.log(`Rodando em: http://localhost:${port}`);
});