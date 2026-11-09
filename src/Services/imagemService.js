const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

const FORMATOS = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif'
};
const MAX_IMAGENS = 6;
const MAX_BYTES = 2 * 1024 * 1024; // 2 MB por imagem
const BASE_UPLOAD = path.join(__dirname, '..', '..', 'public', 'uploads', 'servicos');

function erro(mensagem) {
  const e = new Error(mensagem);
  e.statusCode = 400;
  return e;
}

function normalizarExistente(item) {
  if (!item) return null;
  if (typeof item === 'string') {
    const url = item.trim();
    if (!url) return null;
    // Aceita apenas referências internas já armazenadas pelo sistema.
    if (/^\/uploads\/servicos\/\d+\/[a-zA-Z0-9._-]+$/.test(url)) return { url, legenda: '' };
    return null;
  }
  if (typeof item === 'object') {
    const url = String(item.url || item.caminho || '').trim();
    if (/^\/uploads\/servicos\/\d+\/[a-zA-Z0-9._-]+$/.test(url)) {
      return { url, legenda: String(item.legenda || item.descricao || '').slice(0, 120) };
    }
  }
  return null;
}

function decodificarDataUrl(valor) {
  if (typeof valor !== 'string') return null;
  const m = valor.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=\s]+)$/);
  if (!m) return null;
  const mime = m[1].toLowerCase();
  const ext = FORMATOS[mime];
  if (!ext) throw erro('Formato de imagem inválido. Use JPG, PNG, WEBP ou GIF.');
  const buffer = Buffer.from(m[2].replace(/\s/g, ''), 'base64');
  if (!buffer.length) throw erro('Imagem inválida.');
  if (buffer.length > MAX_BYTES) throw erro(`Cada imagem deve ter no máximo ${MAX_BYTES / (1024 * 1024)} MB.`);
  return { buffer, ext };
}

async function garantirPasta(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function salvarBuffer(dir, buffer, ext) {
  const nome = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${ext}`;
  await fs.writeFile(path.join(dir, nome), buffer);
  return nome;
}

async function processarFotos(anuncioId, itens) {
  if (itens == null) return undefined; // não alterar
  if (!Array.isArray(itens)) throw erro('Formato de imagens inválido.');
  if (itens.length > MAX_IMAGENS) throw erro(`Você pode enviar no máximo ${MAX_IMAGENS} imagens.`);

  const dir = path.join(BASE_UPLOAD, String(anuncioId));
  await garantirPasta(dir);

  const resultado = [];
  const manterArquivos = new Set();

  for (const item of itens) {
    // Novo upload via data URL
    const dataUrl = typeof item === 'string' ? item : (item && item.dataUrl) || (item && item.data) || (item && typeof item.url === 'string' && item.url.startsWith('data:') ? item.url : null);
    if (dataUrl && String(dataUrl).startsWith('data:')) {
      const dec = decodificarDataUrl(dataUrl);
      if (!dec) throw erro('Não foi possível processar uma das imagens. Use JPG, PNG, WEBP ou GIF.');
      const nome = await salvarBuffer(dir, dec.buffer, dec.ext);
      const url = `/uploads/servicos/${anuncioId}/${nome}`;
      resultado.push({ url, legenda: String((item && item.legenda) || '').slice(0, 120) });
      manterArquivos.add(nome);
      continue;
    }
    // Imagem já existente (mantida)
    const existente = normalizarExistente(item);
    if (existente) {
      // Só mantém arquivos que pertencem a este anúncio.
      const prefixo = `/uploads/servicos/${anuncioId}/`;
      if (existente.url.startsWith(prefixo)) {
        resultado.push(existente);
        manterArquivos.add(path.basename(existente.url));
      }
    }
  }

  // Remove arquivos antigos deste anúncio que não foram mantidos.
  try {
    const arquivos = await fs.readdir(dir);
    await Promise.all(arquivos.filter(a => !manterArquivos.has(a)).map(a => fs.unlink(path.join(dir, a)).catch(() => {})));
  } catch (_) { /* pasta pode não existir */ }

  return JSON.stringify(resultado);
}

async function removerPastaFotos(anuncioId) {
  try { await fs.rm(path.join(BASE_UPLOAD, String(anuncioId)), { recursive: true, force: true }); } catch (_) {}
}

function parsearFotos(valor) {
  if (!valor) return [];
  try {
    const arr = typeof valor === 'string' ? JSON.parse(valor) : valor;
    if (Array.isArray(arr)) {
      return arr.map(f => {
        if (typeof f === 'string') return { url: f, legenda: '' };
        if (f && typeof f === 'object') return { url: f.url || f.caminho || '', legenda: f.legenda || f.descricao || '' };
        return null;
      }).filter(f => f && f.url);
    }
    if (arr && typeof arr === 'object' && arr.url) return [{ url: arr.url, legenda: arr.legenda || '' }];
  } catch (_) {
    return String(valor).split(',').map(u => u.trim()).filter(Boolean).map(url => ({ url, legenda: '' }));
  }
  return [];
}

function capaDeFotos(valor) {
  const fotos = parsearFotos(valor);
  return fotos.length ? fotos[0].url : null;
}

module.exports = { processarFotos, removerPastaFotos, parsearFotos, capaDeFotos, FORMATOS, MAX_IMAGENS, MAX_BYTES };
