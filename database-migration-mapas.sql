-- Migração: mapas (Leaflet + OpenStreetMap) - coordenadas aproximadas (centro de bairro/região)
-- Execute apenas se as colunas ainda não existirem. Não sobrescreve dados existentes.

-- Usuarios: adicionar latitude/longitude aproximadas
ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS latitude DECIMAL(10,8) NULL,
  ADD COLUMN IF NOT EXISTS longitude DECIMAL(11,8) NULL;

-- Anuncios: no banco de produção já podem existir (confirmado). Adiciona somente se ausentes.
ALTER TABLE anuncios
  ADD COLUMN IF NOT EXISTS latitude DECIMAL(10,8) NULL,
  ADD COLUMN IF NOT EXISTS longitude DECIMAL(11,8) NULL;

-- Observação: as coordenadas são obtidas via Nominatim (OpenStreetMap) a partir de cidade/bairro/estado,
-- armazenadas como localização aproximada e nunca devem representar endereço residencial exato.
