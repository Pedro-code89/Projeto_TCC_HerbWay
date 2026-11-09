const menuHerbWay = document.querySelector('#menu-principal');
const botaoMenuHerbWay = document.querySelector('#botao-menu');
const fundoMenuHerbWay = document.querySelector('#fundo-menu');

function atualizarCabecalho() {
  const conectado = Boolean(HerbWay.conta());
  document.querySelectorAll('[data-conta]').forEach(item => { item.hidden = !conectado; });
  document.querySelectorAll('[data-visitante]').forEach(item => { item.hidden = conectado; });
  if (conectado) HerbWay.aplicarAvatar(document.querySelector('#avatar-cabecalho'), HerbWay.conta());
}
function abrirMenu() {
  menuHerbWay?.classList.add('aberto');
  fundoMenuHerbWay?.classList.add('aberto');
  botaoMenuHerbWay?.setAttribute('aria-expanded', 'true');
  botaoMenuHerbWay?.setAttribute('aria-label', 'Fechar menu');
  document.querySelector('#fechar-menu')?.focus();
}
function fecharMenu() {
  menuHerbWay?.classList.remove('aberto');
  fundoMenuHerbWay?.classList.remove('aberto');
  botaoMenuHerbWay?.setAttribute('aria-expanded', 'false');
  botaoMenuHerbWay?.setAttribute('aria-label', 'Abrir menu');
}
function alternarMenu() { menuHerbWay?.classList.contains('aberto') ? fecharMenu() : abrirMenu(); }
botaoMenuHerbWay?.addEventListener('click', alternarMenu);
document.querySelector('#fechar-menu')?.addEventListener('click', () => { fecharMenu(); botaoMenuHerbWay?.focus(); });
fundoMenuHerbWay?.addEventListener('click', fecharMenu);
/* Mantém a navegação por teclado dentro do painel enquanto ele estiver aberto. */
document.addEventListener('keydown', evento => {
  if (!menuHerbWay?.classList.contains('aberto')) return;
  if (evento.key === 'Escape') { fecharMenu(); botaoMenuHerbWay?.focus(); return; }
  if (evento.key !== 'Tab') return;
  const focaveis = [...menuHerbWay.querySelectorAll('a[href], button:not([hidden])')].filter(item => item.offsetParent !== null);
  if (!focaveis.length) return;
  const primeiro = focaveis[0], ultimo = focaveis[focaveis.length - 1];
  if (evento.shiftKey && document.activeElement === primeiro) { evento.preventDefault(); ultimo.focus(); }
  else if (!evento.shiftKey && document.activeElement === ultimo) { evento.preventDefault(); primeiro.focus(); }
});
document.querySelector('#sair')?.addEventListener('click', async () => { await HerbWay.sair(); location.assign('/login'); });
function irParaLogin() { location.assign('/login?voltar=' + encodeURIComponent(location.pathname + location.search)); }

/* Modo escuro: reflete o tema na interface e o persiste no localStorage. */
const botaoTemaHerbWay = document.querySelector('#alternar-tema');
function refletirTema(tema) {
  const escuro = tema === 'escuro';
  document.documentElement.dataset.tema = escuro ? 'escuro' : 'claro';
  if (botaoTemaHerbWay) {
    botaoTemaHerbWay.setAttribute('aria-pressed', String(escuro));
    botaoTemaHerbWay.setAttribute('aria-label', escuro ? 'Ativar modo claro' : 'Ativar modo escuro');
    botaoTemaHerbWay.title = escuro ? 'Ativar modo claro' : 'Ativar modo escuro';
  }
  const rotulo = document.querySelector('#rotulo-tema');
  if (rotulo) rotulo.textContent = escuro ? 'Modo claro' : 'Modo escuro';
  const uso = document.querySelector('#uso-icone-tema');
  if (uso) uso.setAttribute('href', escuro ? '#icone-sol' : '#icone-lua');
  const corDoTema = document.querySelector('meta[name="theme-color"]');
  if (corDoTema) corDoTema.setAttribute('content', escuro ? '#1e6b55' : '#194e40');
}
botaoTemaHerbWay?.addEventListener('click', () => {
  const tema = document.documentElement.dataset.tema === 'escuro' ? 'claro' : 'escuro';
  refletirTema(tema);
  try { localStorage.setItem('herbway-tema', tema); } catch (erro) { /* sem armazenamento */ }
});
window.matchMedia('(prefers-color-scheme: dark)')?.addEventListener('change', evento => {
  let salvo = null;
  try { salvo = localStorage.getItem('herbway-tema'); } catch (erro) { /* sem armazenamento */ }
  if (!salvo) refletirTema(evento.matches ? 'escuro' : 'claro');
});
refletirTema(document.documentElement.dataset.tema || 'claro');

function validarFormulario(formulario) {
  for (const campo of formulario.querySelectorAll('input, textarea')) {
    if (!['password', 'checkbox', 'date', 'number', 'file'].includes(campo.type)) campo.value = campo.value.trim();
    campo.setCustomValidity('');
    if (campo.minLength > 0 && campo.value.length < campo.minLength) campo.setCustomValidity(`Preencha com pelo menos ${campo.minLength} caracteres.`);
  }
  return formulario.reportValidity();
}
document.querySelectorAll('input, textarea').forEach(campo => campo.addEventListener('input', () => campo.setCustomValidity('')));
document.querySelectorAll('[data-estados]').forEach(select => {
  for (const sigla in HerbWay.estados) select.add(new Option(HerbWay.estados[sigla], sigla));
});
document.querySelectorAll('[data-fechar]').forEach(botao => botao.addEventListener('click', () => botao.closest('dialog').close()));
function mostrarErro(id, mensagem) { const elemento = document.getElementById(id); if (!elemento) return; elemento.textContent = mensagem; elemento.hidden = !mensagem; }
let tempoAvisoHerbWay;
function mostrarAviso(mensagem) { const aviso = document.querySelector('#aviso'); if (!aviso) return; clearTimeout(tempoAvisoHerbWay); aviso.textContent = mensagem; aviso.hidden = false; tempoAvisoHerbWay = setTimeout(() => { aviso.hidden = true; }, 4500); }
for (const botao of document.querySelectorAll('[data-senha]')) {
  botao.setAttribute('aria-pressed', 'false');
  botao.addEventListener('click', () => { const campo = document.getElementById(botao.dataset.senha); const mostrar = campo.type === 'password'; campo.type = mostrar ? 'text' : 'password'; botao.textContent = mostrar ? 'Ocultar' : 'Mostrar'; botao.setAttribute('aria-pressed', String(mostrar)); });
}

HerbWay.pronto.then(() => {
  atualizarCabecalho();
  if (document.querySelector('[data-requer-conta]') && !HerbWay.conta()) irParaLogin();
  window.dispatchEvent(new Event('herbway:atualizado'));
}).catch(erro => console.error('Erro ao carregar dados:', erro));
window.addEventListener('pageshow', atualizarCabecalho);
window.addEventListener('herbway:atualizado', atualizarCabecalho);

// Visualizações (proprietário): painel com totais por período e visitantes.
(function () {
  function iniciais(nome) {
    return String(nome || '?').trim().split(/\s+/).slice(0, 2).map(p => p[0]).join('').toUpperCase();
  }
  function formatarData(valor) {
    if (!valor) return '';
    const d = valor instanceof Date ? valor : new Date(valor);
    if (Number.isNaN(d.getTime())) return String(valor).slice(0, 16).replace('T', ' ');
    return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  }
  async function carregar(tipo, id, periodo) {
    const base = tipo === 'perfil' ? '/api/usuarios/' : '/api/servicos/';
    const resp = await fetch(base + encodeURIComponent(id) + '/visualizacoes?periodo=' + encodeURIComponent(periodo));
    const corpo = await resp.json().catch(() => ({}));
    if (!resp.ok) throw new Error(corpo.erro || 'Não foi possível carregar as visualizações.');
    return corpo;
  }
  function renderVisitantes(lista, ul) {
    ul.replaceChildren();
    if (!lista || !lista.length) {
      const li = document.createElement('li');
      li.className = 'texto-cinza';
      li.textContent = 'Nenhuma visualização registrada neste período.';
      ul.append(li);
      return;
    }
    lista.forEach(v => {
      const li = document.createElement('li');
      li.className = 'visualizacao-visitante';
      const avatar = document.createElement('a');
      avatar.href = '/profissional/' + encodeURIComponent(v.id);
      avatar.className = 'avatar-pequeno visualizacao-avatar';
      avatar.setAttribute('aria-label', 'Ver perfil de ' + (v.nome || 'usuário'));
      if (v.foto) { const img = document.createElement('img'); img.src = v.foto; img.alt = ''; avatar.append(img); }
      else { avatar.textContent = iniciais(v.nome); }
      const info = document.createElement('div');
      info.className = 'visualizacao-info';
      const nome = document.createElement('a');
      nome.href = '/profissional/' + encodeURIComponent(v.id);
      nome.className = 'link-verde';
      nome.textContent = v.nome || 'Usuário';
      const data = document.createElement('span');
      data.className = 'texto-cinza';
      data.textContent = 'Última visualização: ' + formatarData(v.ultimaVisualizacao);
      info.append(nome, data);
      li.append(avatar, info);
      ul.append(li);
    });
  }
  async function abrir(dialogId, tipo, id) {
    const dialog = document.getElementById(dialogId);
    if (!dialog) return;
    const totalEl = dialog.querySelector('[data-vis-total]');
    const pessoasEl = dialog.querySelector('[data-vis-pessoas]');
    const anonEl = dialog.querySelector('[data-vis-anonimos]');
    const listaEl = dialog.querySelector('[data-vis-lista]');
    const statusEl = dialog.querySelector('[data-vis-status]');
    const botoes = [...dialog.querySelectorAll('[data-periodo-vis]')];
    let periodo = 'total';
    async function atualizar() {
      botoes.forEach(b => { const on = b.dataset.periodoVis === periodo; b.classList.toggle('ativa', on); b.setAttribute('aria-pressed', String(on)); });
      if (statusEl) { statusEl.hidden = false; statusEl.textContent = 'Carregando...'; }
      if (listaEl) listaEl.replaceChildren();
      try {
        const d = await carregar(tipo, id, periodo);
        if (totalEl) totalEl.textContent = String(d.total ?? 0);
        if (pessoasEl) pessoasEl.textContent = String(d.pessoas ?? 0);
        if (anonEl) anonEl.textContent = d.anonimos ? ` (inclui ${d.anonimos} visita(s) sem conta)` : '';
        if (d.indisponivel) {
          if (statusEl) { statusEl.hidden = false; statusEl.textContent = 'Registro de visualizações indisponível no banco. Execute database-migration-visualizacoes.sql e reinicie o servidor.'; }
          if (listaEl) listaEl.replaceChildren();
        } else {
          if (statusEl) statusEl.hidden = true;
          if (listaEl) renderVisitantes(d.visitantes, listaEl);
        }
      } catch (e) {
        if (statusEl) { statusEl.hidden = false; statusEl.textContent = e.message; }
      }
    }
    botoes.forEach(b => b.onclick = () => { periodo = b.dataset.periodoVis; atualizar(); });
    dialog.showModal();
    atualizar();
  }
  window.HerbWayVisualizacoes = { abrir };
})();
