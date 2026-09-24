// Integração do front-end com o banco de dados através da API do Node/Express.
const estadosHerbWay = {
  AC: 'Acre', AL: 'Alagoas', AP: 'Amapá', AM: 'Amazonas', BA: 'Bahia', CE: 'Ceará',
  DF: 'Distrito Federal', ES: 'Espírito Santo', GO: 'Goiás', MA: 'Maranhão', MT: 'Mato Grosso',
  MS: 'Mato Grosso do Sul', MG: 'Minas Gerais', PA: 'Pará', PB: 'Paraíba', PR: 'Paraná',
  PE: 'Pernambuco', PI: 'Piauí', RJ: 'Rio de Janeiro', RN: 'Rio Grande do Norte',
  RS: 'Rio Grande do Sul', RO: 'Rondônia', RR: 'Roraima', SC: 'Santa Catarina',
  SP: 'São Paulo', SE: 'Sergipe', TO: 'Tocantins'
};

window.HerbWay = (() => {
  let dados = { usuarios: [], servicos: [], contratacoes: [], avaliacoes: [] };
  let usuarioAtual = null;

  async function requisicao(url, opcoes = {}) {
    const resposta = await fetch(url, {
      ...opcoes,
      headers: { 'Content-Type': 'application/json', ...(opcoes.headers || {}) }
    });
    const corpo = await resposta.json().catch(() => ({}));
    if (!resposta.ok) throw new Error(corpo.erro || 'Não foi possível concluir a operação.');
    return corpo;
  }

  async function carregar() {
    dados = await requisicao('/api/dados');
    try { usuarioAtual = await requisicao('/api/me'); }
    catch { usuarioAtual = null; }
    return dados;
  }

  const pronto = carregar();

  return {
    pronto,
    ler: () => dados,
    conta: () => usuarioAtual,
    async entrar(email, senha) {
      usuarioAtual = await requisicao('/login', { method: 'POST', body: JSON.stringify({ email, senha }) });
      await carregar();
      return usuarioAtual;
    },
    async cadastrar(nome, email, senha) {
      usuarioAtual = await requisicao('/cadastro', { method: 'POST', body: JSON.stringify({ nome, email, senha }) });
      await carregar();
      return usuarioAtual;
    },
    async editarPerfil(campos) {
      usuarioAtual = await requisicao('/api/perfil', { method: 'PUT', body: JSON.stringify(campos) });
      await carregar();
      window.dispatchEvent(new Event('herbway:atualizado'));
    },
    async salvarServico(campos, id) {
      const url = id ? '/api/servicos/' + encodeURIComponent(id) : '/api/servicos';
      await requisicao(url, { method: id ? 'PUT' : 'POST', body: JSON.stringify(campos) });
      await carregar();
      window.dispatchEvent(new Event('herbway:atualizado'));
    },
    async excluirServico(id) {
      await requisicao('/api/servicos/' + encodeURIComponent(id), { method: 'DELETE' });
      await carregar();
      window.dispatchEvent(new Event('herbway:atualizado'));
    },
    async contratar(id, data) {
      await requisicao('/api/contratacoes', { method: 'POST', body: JSON.stringify({ servicoId: id, data }) });
      await carregar();
      window.dispatchEvent(new Event('herbway:atualizado'));
    },
    async concluir(id) {
      await requisicao('/api/contratacoes/' + encodeURIComponent(id) + '/concluir', { method: 'PUT' });
      await carregar();
      window.dispatchEvent(new Event('herbway:atualizado'));
    },
    async avaliar(id, nota, comentario) {
      await requisicao('/api/contratacoes/' + encodeURIComponent(id) + '/avaliar', { method: 'POST', body: JSON.stringify({ nota, comentario }) });
      await carregar();
      window.dispatchEvent(new Event('herbway:atualizado'));
    },
    async sair() {
      try { await requisicao('/api/logout', { method: 'POST' }); } finally { usuarioAtual = null; }
    },
    estados: estadosHerbWay,
    iniciais: nome => nome.trim().split(/\s+/).slice(0, 2).map(parte => parte[0]).join('').toUpperCase(),
    nomeCurto: nome => nome.trim().split(/\s+/).slice(0, 2).join(' '),
    moeda: valor => valor === null || valor === undefined ? 'A combinar' : 'A partir de ' + Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
    data: valor => valor.split('-').reverse().join('/'),
    avaliacao: usuario => Number(usuario.avaliacoes) ? '★ ' + Number(usuario.avaliacao).toFixed(1).replace('.', ',') + ' (' + usuario.avaliacoes + ')' : 'Sem avaliações',
    estrelas: nota => '★'.repeat(nota) + '☆'.repeat(5 - nota),
    rotulosNota: ['Insatisfeito', 'Mediano', 'Bom', 'Muito bom', 'Excelente']
  };
})();
