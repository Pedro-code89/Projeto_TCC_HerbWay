-- Migração: visualizações de perfis e serviços (estilo Instagram/TikTok)
-- Não sobrescreve dados existentes. Execute no MySQL (Aiven).

CREATE TABLE IF NOT EXISTS visualizacoes (
    id_visualizacao INT AUTO_INCREMENT PRIMARY KEY,
    tipo ENUM('perfil', 'servico') NOT NULL,
    id_usuario_alvo INT NULL,       -- dono do perfil visualizado (perfil) ou dono do anúncio (servico)
    id_servico_alvo INT NULL,       -- id_anuncio, quando tipo = 'servico'
    id_visualizador INT NULL,       -- usuário autenticado que visualizou; NULL para não autenticado
    sessao_id VARCHAR(128) NULL,    -- uso interno de deduplicação (nunca exposto/identidade inventada)
    visto_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_vis_usuario_alvo FOREIGN KEY (id_usuario_alvo) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    CONSTRAINT fk_vis_servico_alvo FOREIGN KEY (id_servico_alvo) REFERENCES anuncios(id_anuncio) ON DELETE CASCADE,
    CONSTRAINT fk_vis_visualizador FOREIGN KEY (id_visualizador) REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
    INDEX idx_vis_perfil (tipo, id_usuario_alvo, visto_em),
    INDEX idx_vis_servico (tipo, id_servico_alvo, visto_em),
    INDEX idx_vis_auth (tipo, id_usuario_alvo, id_servico_alvo, id_visualizador),
    INDEX idx_vis_sessao (tipo, id_usuario_alvo, id_servico_alvo, sessao_id)
);
