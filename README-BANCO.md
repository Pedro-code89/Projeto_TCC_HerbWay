# HerbWay - conexão com MySQL

## 1. Criar o banco

Execute no MySQL Workbench o SQL do HerbwayDB fornecido no trabalho. Ele deve criar as tabelas:
- usuarios
- categorias
- anuncios
- contratacoes
- avaliacoes
- portfolio

## 2. Configurar o MySQL

Por padrão o projeto usa:
- host: localhost
- usuário: root
- senha: vazia
- banco: HerbwayDB

Se sua senha do MySQL for diferente, abra `src/Config/database.js` e altere, ou configure as variáveis de ambiente `DB_HOST`, `DB_USER`, `DB_PASSWORD` e `DB_NAME`.

## 3. Instalar as dependências

No terminal, dentro da pasta do projeto:

```bash
npm install
```

As dependências importantes são `express`, `ejs`, `mysql2` e `express-session`.

## 4. Iniciar

```bash
node index.js
```

Depois abra:

http://localhost:3000

## 5. O que foi conectado

- Cadastro -> INSERT em `usuarios`
- Login -> consulta em `usuarios` + sessão
- Perfil -> SELECT/UPDATE em `usuarios`
- Serviços -> SELECT/INSERT/UPDATE/DELETE em `anuncios`
- Categorias -> `categorias`
- Contratações -> INSERT/SELECT/UPDATE em `contratacoes`
- Avaliações -> a nota média é calculada pela tabela `avaliacoes`
- Portfólio -> a tabela está pronta no banco para uso futuro

O front-end deixou de usar `localStorage` como banco principal e passou a consumir a API do Node/Express, que consulta o MySQL.
