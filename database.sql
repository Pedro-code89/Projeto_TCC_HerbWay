-- latitude/longitude: localização aproximada (centro de bairro/região) para mapas. Migração: database-migration-mapas.sql
CREATE TABLE usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    telefone VARCHAR(20),
    senha VARCHAR(255) NOT NULL,
    cidade VARCHAR(100),
    estado CHAR(2),
    bairro VARCHAR(100),
    sobre TEXT,
    foto MEDIUMTEXT,
    latitude DECIMAL(10,8) NULL,
    longitude DECIMAL(11,8) NULL,
    email_verificado TINYINT(1) NOT NULL DEFAULT 0
);

CREATE TABLE categorias (
    id_categoria INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    imagem VARCHAR(255)
);

-- fotos: referências das imagens do anúncio (JSON com array de caminhos/URLs), usado pela galeria.
-- latitude/longitude: localização aproximada (centro de bairro/região). Migração: database-migration-mapas.sql
-- Bancos existentes: ALTER TABLE anuncios ADD COLUMN fotos TEXT NULL;
CREATE TABLE anuncios (
    id_anuncio INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_categoria INT NOT NULL,
    titulo VARCHAR(150) NOT NULL,
    descricao TEXT NOT NULL,
    preco DECIMAL(10,2),
    cidade VARCHAR(100) NOT NULL,
    estado CHAR(2) NOT NULL,
    ativo BOOLEAN DEFAULT TRUE,
    fotos MEDIUMTEXT DEFAULT NULL,
    latitude DECIMAL(10,8) NULL,
    longitude DECIMAL(11,8) NULL,

    CONSTRAINT fk_anuncio_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuarios(id_usuario),

    CONSTRAINT fk_anuncio_categoria
        FOREIGN KEY (id_categoria)
        REFERENCES categorias(id_categoria)
);

CREATE TABLE tokens (
    id_token INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    tipo VARCHAR(20) NOT NULL,
    token_hash CHAR(64) NOT NULL,
    expira_em DATETIME NOT NULL,
    usado TINYINT(1) NOT NULL DEFAULT 0,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_token_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuarios(id_usuario)
);

CREATE TABLE mensagens (
    id_mensagem INT AUTO_INCREMENT PRIMARY KEY,
    id_anuncio INT NOT NULL,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    telefone VARCHAR(20),
    mensagem TEXT NOT NULL,
    data_envio DATETIME DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_mensagem_anuncio
        FOREIGN KEY (id_anuncio)
        REFERENCES anuncios(id_anuncio)
);

CREATE TABLE contratacoes (
    id_contratacao INT AUTO_INCREMENT PRIMARY KEY,
    id_cliente INT NOT NULL,
    id_anuncio INT NOT NULL,
    data_servico DATE NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'Contratado',

    CONSTRAINT fk_contratacao_cliente
        FOREIGN KEY (id_cliente)
        REFERENCES usuarios(id_usuario),

    CONSTRAINT fk_contratacao_anuncio
        FOREIGN KEY (id_anuncio)
        REFERENCES anuncios(id_anuncio)
);

CREATE TABLE avaliacoes (
    id_avaliacao INT AUTO_INCREMENT PRIMARY KEY,
    id_cliente INT NOT NULL,
    id_profissional INT NOT NULL,
    id_anuncio INT,
    id_contratacao INT,
    nota INT NOT NULL,
    comentario TEXT,

    CONSTRAINT fk_avaliacao_cliente
        FOREIGN KEY (id_cliente)
        REFERENCES usuarios(id_usuario),

    CONSTRAINT fk_avaliacao_profissional
        FOREIGN KEY (id_profissional)
        REFERENCES usuarios(id_usuario),

    CONSTRAINT fk_avaliacao_anuncio
        FOREIGN KEY (id_anuncio)
        REFERENCES anuncios(id_anuncio),

    CONSTRAINT fk_avaliacao_contratacao
        FOREIGN KEY (id_contratacao)
        REFERENCES contratacoes(id_contratacao),

    CONSTRAINT uk_avaliacao_contratacao
        UNIQUE (id_contratacao),

    CONSTRAINT chk_nota
        CHECK (nota BETWEEN 1 AND 5)
);

-- visualizacoes: contagem de acessos a perfis e serviços (migração: database-migration-visualizacoes.sql)
CREATE TABLE IF NOT EXISTS visualizacoes (
    id_visualizacao INT AUTO_INCREMENT PRIMARY KEY,
    tipo ENUM('perfil', 'servico') NOT NULL,
    id_usuario_alvo INT NULL,
    id_servico_alvo INT NULL,
    id_visualizador INT NULL,
    sessao_id VARCHAR(128) NULL,
    visto_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_vis_usuario_alvo FOREIGN KEY (id_usuario_alvo) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    CONSTRAINT fk_vis_servico_alvo FOREIGN KEY (id_servico_alvo) REFERENCES anuncios(id_anuncio) ON DELETE CASCADE,
    CONSTRAINT fk_vis_visualizador FOREIGN KEY (id_visualizador) REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
    INDEX idx_vis_perfil (tipo, id_usuario_alvo, visto_em),
    INDEX idx_vis_servico (tipo, id_servico_alvo, visto_em)
);