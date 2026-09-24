# HerbWay - Aiven

Esta versão do HerbWay foi preparada para usar o MySQL hospedado no Aiven.

## 1. Instalar dependências

Abra o terminal dentro desta pasta e execute:

```bash
npm install
```

## 2. Criar o arquivo .env

Copie `.env.example` para `.env` e preencha os dados mostrados no painel do Aiven:

```env
DB_HOST=...
DB_PORT=...
DB_USER=avnadmin
DB_PASSWORD=...
DB_NAME=defaultdb
SESSION_SECRET=herbway-segredo-tcc
```

O arquivo `.env` não deve ser enviado para o GitHub.

## 3. Criar as tabelas no Aiven

No SQL Editor do Aiven, execute o SQL do HerbWay para criar:

- usuarios
- categorias
- anuncios
- contratacoes
- avaliacoes
- portfolio

O banco usado pelo exemplo do professor é `defaultdb`. Se o seu Aiven mostrar outro nome, coloque esse nome no `DB_NAME`.

## 4. Rodar o projeto

```bash
node index.js
```

Se a conexão funcionar, o terminal deverá mostrar:

```text
Banco de dados conectado com sucesso.
Rodando em: http://localhost:3000
```

Depois abra:

http://localhost:3000

## 5. O que continua igual no HerbWay

A mudança principal é somente a conexão do banco. O projeto continua usando Node.js + Express + EJS + MySQL.

As funções já conectadas ao banco continuam usando as mesmas tabelas:

- Cadastro -> usuarios
- Login -> usuarios
- Perfil -> usuarios
- Serviços -> anuncios
- Categorias -> categorias
- Contratações -> contratacoes
- Avaliações -> avaliacoes
- Portfólio -> portfolio

## Importante

Não coloque a senha real do Aiven no código-fonte nem envie o `.env` para o GitHub.
