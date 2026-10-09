'use strict';
/* Gestão Jú Festas — ferramenta de gestão para presentes personalizados.
   Os dados ficam no navegador (localStorage). Use Ajustes > Cópia de segurança. */

const CHAVE = 'jf-gestao-v1';
const ET = [['novo','Novo'],['pagamento','Aguardando pagamento'],['arte','Arte em aprovação'],['producao','Em produção'],['pronto','Pronto para entrega'],['entregue','Entregue'],['cancelado','Cancelado']];
const ABERTO = s => s !== 'entregue' && s !== 'cancelado';
const TECNICAS = ['Sublimação','DTF UV','Recorte Silhouette','Montagem','Outra'];
const CATS = {datas:'Datas e aniversários', casamento:'Casamento e padrinhos', lembrancinhas:'Lembrancinhas', empresas:'Para empresas'};
const CAT_SAIDA = ['Insumos','Embalagens','Entrega','Taxas de pagamento','Equipamentos','Marketing','Impostos (DAS)','Outros'];
const FORMAS = ['Pix','Cartão de crédito','Cartão de débito','Dinheiro','Transferência'];
const ORIGENS = ['','Instagram','Indicação','WhatsApp','Catálogo','Empresa','Outro'];
const ST_ORC = [['rascunho','Rascunho'],['enviado','Enviado'],['aprovado','Aprovado'],['recusado','Recusado']];
const MODELOS_PADRAO = {
  confirma: ['Confirmar pedido','Oi, {nome}! Recebi o seu pedido {codigo}. Total: {total}. Assim que o Pix cair eu começo a arte e te mando para aprovar.'],
  cobranca: ['Lembrar do pagamento','Oi, {nome}! Passando para lembrar do pagamento do pedido {codigo}. Falta {saldo}. Assim que cair eu já começo a sua arte.'],
  arte: ['Enviar arte para aprovar','Oi, {nome}! A arte do seu pedido {codigo} está pronta. Dá uma olhada e me diz se posso produzir ou se quer ajustar alguma coisa.'],
  producao: ['Avisar que entrou em produção','Oi, {nome}! Arte aprovada, seu pedido {codigo} entrou em produção. Fica pronto até {entrega}.'],
  pronto: ['Avisar que ficou pronto','Oi, {nome}! Seu pedido {codigo} ficou pronto. Vamos combinar a entrega?'],
  posvenda: ['Pós-venda','Oi, {nome}! Chegou tudo certinho? Quem recebeu gostou? Se puder, me manda uma foto. Posso postar no Instagram?'],
  data: ['Lembrar de uma data','Oi, {nome}! Tô te lembrando: {rotulo} está chegando, dia {dia}. Quer que eu prepare um presente com nome? Pedindo com uma semana de antecedência dá tempo.'],
  campanha: ['Campanha de data comercial','Oi, {nome}! {rotulo} está chegando, dia {dia}. Já estou separando os presentes personalizados. Quer ver as opções?'],
  reativar: ['Retomar contato','Oi, {nome}! Faz um tempinho que a gente não se fala. Tem novidade por aqui. Quer dar uma olhada?'],
  orcamento: ['Enviar orçamento para empresa','Olá, {nome}! Segue o orçamento {codigo} da Jú Festas e Presentes:\n{itens}\nTotal: {total}\nProdução: {prazo}. Orçamento válido até {validade}.']
};
const MSG_ETAPA = {novo:'confirma', pagamento:'cobranca', arte:'arte', producao:'producao', pronto:'pronto', entregue:'posvenda'};
const DATAS_PADRAO = [
  {id:'d1',nome:'Dia das Crianças',data:'2026-10-12'},{id:'d2',nome:'Dia do Professor',data:'2026-10-15'},
  {id:'d3',nome:'Black Friday',data:'2026-11-27'},{id:'d4',nome:'Natal',data:'2026-12-25'},
  {id:'d5',nome:'Dia da Mulher',data:'2027-03-08'},{id:'d6',nome:'Páscoa',data:'2027-03-28'},
  {id:'d7',nome:'Dia das Mães',data:'2027-05-09'},{id:'d8',nome:'Dia dos Namorados',data:'2027-06-12'},
  {id:'d9',nome:'Dia dos Pais',data:'2027-08-08'}
];
const ABAS = [['hoje','Hoje'],['pedidos','Pedidos'],['producao','Produção'],['clientes','Clientes'],['produtos','Produtos e preço'],['insumos','Insumos'],['financeiro','Financeiro'],['empresas','Empresas'],['relatorios','Relatórios'],['ajustes','Ajustes']];

/* ---------- utilidades ---------- */
const $ = s => document.querySelector(s);
const esc = t => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const brl = v => 'R$ ' + Number(v || 0).toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2});
const pct = v => (isFinite(v) ? v : 0).toLocaleString('pt-BR', {maximumFractionDigits:1}) + '%';
const num = t => { if (typeof t === 'number') return t; const v = parseFloat(String(t || '').replace(/[^\d,.-]/g,'').replace(/\.(?=\d{3}(\D|$))/g,'').replace(',','.')); return isFinite(v) ? v : 0; };
const numTxt = v => v ? String(Math.round(v * 100) / 100).replace('.', ',') : '';
const hoje = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0'); };
const br = iso => iso ? iso.slice(0,10).split('-').reverse().join('/') : '';
const brCurto = iso => iso ? iso.slice(8,10) + '/' + iso.slice(5,7) : '';
const dias = (a, b) => Math.round((new Date(b.slice(0,10) + 'T12:00') - new Date(a.slice(0,10) + 'T12:00')) / 864e5);
const somaDias = (iso, n) => { const d = new Date(iso + 'T12:00'); d.setDate(d.getDate() + n); return d.toISOString().slice(0,10); };
const novoId = p => p + Date.now().toString(36) + Math.random().toString(36).slice(2,6);
const fone = w => { const d = String(w || '').replace(/\D/g,''); return d.length === 11 ? `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}` : d.length === 10 ? `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}` : d; };
const waNum = w => { const d = String(w || '').replace(/\D/g,''); return d.length > 11 ? d : '55' + d; };
const primeiro = n => String(n || '').trim().split(' ')[0] || 'tudo bem';
const mesNome = m => ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'][m];
const etNome = k => (ET.find(e => e[0] === k) || ET[0])[1];
function proxDDMM(ddmm) { const m = /^(\d{1,2})\/(\d{1,2})$/.exec(String(ddmm || '').trim()); if (!m) return null; const h = new Date(hoje() + 'T12:00'); let d = new Date(h.getFullYear(), m[2]-1, +m[1], 12); if (d < h) d = new Date(h.getFullYear()+1, m[2]-1, +m[1], 12); return Math.round((d - h) / 864e5); }

/* ---------- dados ---------- */
function base() {
  return {v:1, exemplo:false, criado:new Date().toISOString(),
    config:{nomeLoja:'Jú Festas e Presentes', whats:'', fixas:15, taxas:5, lucro:30, hora:25, capacidade:20, das:0, limiteMei:81000, prefixo:'JF'},
    modelos:JSON.parse(JSON.stringify(MODELOS_PADRAO)), datas:DATAS_PADRAO.map(d => ({...d})),
    produtos:[], insumos:[], clientes:[], pedidos:[], lancamentos:[], orcamentos:[]};
}
let D, semArmazenamento = false;
function carregar() {
  try { const t = localStorage.getItem(CHAVE); D = t ? JSON.parse(t) : null; } catch (e) { semArmazenamento = true; D = null; }
  if (!D) D = base();
  const b = base();
  for (const k of Object.keys(b)) if (D[k] === undefined) D[k] = b[k];
  D.config = {...b.config, ...D.config};
  for (const k of Object.keys(MODELOS_PADRAO)) if (!D.modelos[k]) D.modelos[k] = MODELOS_PADRAO[k];
}
function salvar() {
  try { localStorage.setItem(CHAVE, JSON.stringify(D)); localStorage.setItem(CHAVE + '-salvo', new Date().toISOString()); }
  catch (e) { semArmazenamento = true; aviso('Não consegui guardar neste navegador. Baixe uma cópia de segurança em Ajustes para não perder os dados.'); }
}
const prod = id => D.produtos.find(p => p.id === id);
const ins = id => D.insumos.find(i => i.id === id);
const cli = id => D.clientes.find(c => c.id === id);
const ped = id => D.pedidos.find(p => p.id === id);
const orc = id => D.orcamentos.find(o => o.id === id);

/* ---------- cálculos ---------- */
const C = () => D.config;
function custoInsumos(p) { return (p.ficha || []).reduce((s, f) => { const i = ins(f.insumo); return s + (i ? i.custo * num(f.qtd) : 0); }, 0); }
function custoProduto(p) { return custoInsumos(p) + num(p.embalagem) + num(p.tempo) / 60 * num(C().hora); }
function divisor() { return 1 - (num(C().fixas) + num(C().taxas) + num(C().lucro)) / 100; }
function precoSugerido(p) { const d = divisor(); return d > 0 ? custoProduto(p) / d : 0; }
function lucroUnit(p, preco) { return preco * (1 - (num(C().fixas) + num(C().taxas)) / 100) - custoProduto(p); }
const totalItens = o => (o.itens || []).reduce((s, i) => s + num(i.qtd) * num(i.preco), 0);
const totalPedido = o => totalItens(o) + num(o.frete) - num(o.desconto);
const pagoPedido = o => (o.pagamentos || []).reduce((s, p) => s + num(p.valor), 0);
const saldoPedido = o => Math.max(0, totalPedido(o) - pagoPedido(o));
const custoPedido = o => (o.itens || []).reduce((s, i) => { const p = prod(i.produto); return s + num(i.qtd) * (p ? custoProduto(p) : num(i.custo)); }, 0);
const pecasPedido = o => (o.itens || []).reduce((s, i) => s + num(i.qtd), 0);
const tecnicasPedido = o => [...new Set((o.itens || []).map(i => { const p = prod(i.produto); return p ? p.tecnica : 'Outra'; }))];
const pedidosDe = id => D.pedidos.filter(o => o.cliente === id && o.status !== 'cancelado');
function proxCodigo(pref) { const n = D.pedidos.length + D.orcamentos.length + 1; let c; let k = n; do { c = (pref || C().prefixo) + String(k).padStart(4, '0'); k++; } while (D.pedidos.some(o => o.codigo === c) || D.orcamentos.some(o => o.codigo === c)); return c; }
function baixaInsumos(o, sinal) {
  (o.itens || []).forEach(it => { const p = prod(it.produto); if (!p) return; (p.ficha || []).forEach(f => { const i = ins(f.insumo); if (i) i.estoque = Math.round((num(i.estoque) - sinal * num(f.qtd) * num(it.qtd)) * 1000) / 1000; }); });
  o.baixado = sinal > 0;
}
function mudarStatus(o, novo) {
  if (novo === 'producao' && !o.baixado) baixaInsumos(o, 1);
  if (novo === 'cancelado' && o.baixado) baixaInsumos(o, -1);
  if (novo === 'entregue') o.entregueEm = o.entregueEm || hoje();
  o.status = novo; salvar();
}
function registrarPagamento(o, valor, forma, data) {
  const pid = novoId('pg'), lid = novoId('l');
  o.pagamentos = o.pagamentos || [];
  o.pagamentos.push({id:pid, valor, forma, data, lanc:lid});
  D.lancamentos.push({id:lid, tipo:'entrada', categoria:'Vendas', valor, data, desc:'Pedido ' + o.codigo, pedido:o.id, forma});
  salvar();
}

/* ---------- mensagens ---------- */
function texto(k, c, x) {
  x = x || {}; const o = x.pedido; const m = (D.modelos[k] || MODELOS_PADRAO[k])[1];
  return m.replace(/\{nome\}/g, primeiro(c && c.nome)).replace(/\{codigo\}/g, o ? o.codigo : (x.codigo || ''))
    .replace(/\{total\}/g, o ? brl(totalPedido(o)) : (x.total || '')).replace(/\{saldo\}/g, o ? brl(saldoPedido(o)) : '')
    .replace(/\{entrega\}/g, o && o.entrega ? br(o.entrega) : 'a data combinada').replace(/\{rotulo\}/g, x.rotulo || '')
    .replace(/\{dia\}/g, x.dia || '').replace(/\{itens\}/g, x.itens || '').replace(/\{prazo\}/g, x.prazo || '').replace(/\{validade\}/g, x.validade || '');
}
function zap(c, t, rot, k) {
  const w = c && c.whats;
  if (!w) return `<span class="info">sem WhatsApp cadastrado</span>`;
  return `<a class="btn zap" target="_blank" rel="noopener" data-act="registrar-envio" data-cli="${c.id || ''}" data-mod="${k || ''}" href="https://wa.me/${waNum(w)}?text=${encodeURIComponent(t)}">${esc(rot || 'WhatsApp')}</a>`;
}

/* ---------- estado da tela ---------- */
const S = {aba:'hoje', view:'lista', id:null, edit:null, filtro:'abertos', busca:'', mes:hoje().slice(0,7), msg:'', imp:'', confirmar:null, cliMsg:''};
let app;
function aviso(t) { S.msg = t; const a = $('#aviso'); if (a) { a.textContent = t; a.hidden = !t; } }
function ir(aba, view, id) { S.aba = aba || S.aba; S.view = view || 'lista'; S.id = id || null; S.confirmar = null; S.msg = ''; render(); window.scrollTo(0, 0); }

/* ---------- casca ---------- */
function casca() {
  document.body.innerHTML = `
  <header class="topo"><div class="wrap">
    <img class="logo" src="img/logo.webp" alt="Jú Festas e Presentes">
    <div class="tit"><b>Gestão</b><small id="salvo"></small></div>
    <button class="btn" data-act="novo-pedido">+ Pedido</button>
  </div>
  <nav class="abas wrap" aria-label="Módulos">${ABAS.map(a => `<button class="aba" data-act="aba" data-aba="${a[0]}">${a[1]}</button>`).join('')}</nav></header>
  <div class="wrap"><div class="aviso" id="aviso" role="status" hidden></div><main id="app"></main></div>`;
  app = $('#app');
}
function marcaAbas() { document.querySelectorAll('.aba').forEach(b => b.setAttribute('aria-current', b.dataset.aba === S.aba ? 'page' : 'false')); const s = $('#salvo'); if (s) s.textContent = semArmazenamento ? 'sem gravação neste navegador' : 'dados neste navegador'; }

const mascote = (k, html) => `<div class="ju"><img src="img/mascote-${k}.webp" alt=""><div class="balao">${html}</div></div>`;
const kpi = (rot, val, extra) => `<div class="kpi"><small>${rot}</small><b>${val}</b>${extra ? `<span>${extra}</span>` : ''}</div>`;
const tagEt = s => `<span class="tag et-${s}">${etNome(s)}</span>`;
const opts = (lista, sel) => lista.map(o => { const [v, t] = Array.isArray(o) ? o : [o, o]; return `<option value="${esc(v)}" ${String(sel) === String(v) ? 'selected' : ''}>${esc(t)}</option>`; }).join('');
const campo = (rot, html, dica) => `<label class="campo">${rot}${dica ? ` <small>${dica}</small>` : ''}${html}</label>`;
const inp = (f, v, extra) => `<input type="text" data-f="${f}" value="${esc(v)}" ${extra || ''}>`;
const confirmarBtn = (act, id, rot) => S.confirmar === act + id ? `<button class="link perigo" data-act="${act}" data-id="${id}" data-ok="1">Confirmar: ${rot.toLowerCase()}</button>` : `<button class="link" data-act="pedir-conf" data-conf="${act + id}">${rot}</button>`;

/* ---------- HOJE ---------- */
function telaHoje() {
  const h = hoje(), ab = D.pedidos.filter(o => ABERTO(o.status));
  if (!D.produtos.length && !D.pedidos.length && !D.clientes.length) {
    return `${mascote('ei', '<b>Ei, você! Vamos começar?</b><span>Você pode explorar a ferramenta com dados de exemplo ou começar do zero, cadastrando seus insumos e produtos.</span><div class="acoes"><button class="btn forte" data-act="exemplos">Ver com dados de exemplo</button><button class="btn" data-act="aba" data-aba="insumos">Começar do zero</button></div>')}
    <div class="bloco"><header><b>Por onde começar</b></header><ol class="passos">
      <li><b>Insumos</b><span>Cadastre o que você compra: canecas, MDF, acrílico, caixas, fitas, com o custo de cada um.</span></li>
      <li><b>Produtos e preço</b><span>Monte a ficha técnica de cada produto. A ferramenta calcula o custo e sugere o preço pelo markup divisor.</span></li>
      <li><b>Pedidos</b><span>Registre cada venda, ou importe a mensagem que chega do catálogo. Daí saem a produção, a baixa de insumos e o caixa.</span></li>
    </ol></div>`;
  }
  const mes = h.slice(0,7), ent = D.lancamentos.filter(l => l.tipo === 'entrada' && l.data.slice(0,7) === mes).reduce((s, l) => s + num(l.valor), 0);
  const sai = D.lancamentos.filter(l => l.tipo === 'saida' && l.data.slice(0,7) === mes).reduce((s, l) => s + num(l.valor), 0);
  const receber = ab.reduce((s, o) => s + saldoPedido(o), 0);
  const sem = ab.filter(o => o.entrega && dias(h, o.entrega) <= 7).sort((a, b) => a.entrega < b.entrega ? -1 : 1);
  const falta = D.insumos.filter(i => num(i.estoque) <= num(i.minimo));
  const pos = D.pedidos.filter(o => o.status === 'entregue' && !o.posVenda && o.entregueEm && dias(o.entregueEm, h) >= 2 && dias(o.entregueEm, h) <= 30);
  const datas = []; D.clientes.forEach(c => [['seu aniversário', c.aniversario], [c.dataRotulo || 'a data especial', c.dataDia]].forEach(([r, d]) => { const n = proxDDMM(d); if (n !== null && n <= 30) datas.push({c, rotulo:r, dia:d, n}); })); datas.sort((a, b) => a.n - b.n);
  const camp = D.datas.map(d => ({...d, n:dias(h, d.data)})).filter(d => d.n >= 0 && d.n <= 21).sort((a, b) => a.n - b.n);
  const fase = n => n <= 3 ? 'último dia de pedido' : n <= 7 ? 'reforçar a campanha' : n <= 14 ? 'abrir a campanha' : 'preparar a campanha';
  return `<div class="kpis">${kpi('Pedidos em aberto', ab.length)}${kpi('A receber', brl(receber))}${kpi('Entregas em 7 dias', sem.length)}${kpi('Resultado do mês', brl(ent - sai), 'entradas ' + brl(ent) + ' · saídas ' + brl(sai))}</div>
  ${camp.length ? `<div class="bloco"><header><b>Campanhas</b><span>regra: abre 14 dias antes, reforça 7, último dia de pedido 3</span></header>${camp.map(d => `<div class="lin"><span><b>${esc(d.nome)}</b> · ${br(d.data)} · ${d.n === 0 ? 'é hoje' : 'faltam ' + d.n + ' dias'}</span><span class="tag ${d.n <= 3 ? 'alerta' : ''}">${fase(d.n)}</span></div>`).join('')}</div>` : ''}
  <h2 class="sec">Entregas dos próximos 7 dias</h2>${sem.length ? sem.map(cartaoPedido).join('') : '<div class="vazio">Nenhuma entrega marcada para esta semana.</div>'}
  ${falta.length ? `<div class="bloco"><header><b>Insumos no mínimo ou abaixo</b><button class="link" data-act="aba" data-aba="insumos">Ver lista de compras</button></header>${falta.map(i => `<div class="lin"><span>${esc(i.nome)}</span><span class="tag alerta">${numTxt(num(i.estoque)) || '0'} ${esc(i.unidade)} · mínimo ${numTxt(num(i.minimo))}</span></div>`).join('')}</div>` : ''}
  <h2 class="sec">Relacionamento</h2>
  <div class="bloco"><header><b>Pós-venda</b><span>entregues há 2 a 30 dias</span></header>${pos.length ? pos.map(o => { const c = cli(o.cliente); return `<div class="lin"><span>${esc(c ? c.nome : 'Cliente')} · ${esc(o.codigo)} · entregue em ${br(o.entregueEm)}</span><div class="acoes">${zap(c, texto('posvenda', c, {pedido:o}), 'Perguntar se gostou', 'posvenda')}<button class="link" data-act="pos-feito" data-id="${o.id}">Já falei</button></div></div>`; }).join('') : '<div class="dentro info">Nenhum pós-venda pendente.</div>'}</div>
  <div class="bloco"><header><b>Datas das clientes</b><span>próximos 30 dias</span></header>${datas.length ? datas.map(x => `<div class="lin"><span>${esc(x.c.nome)} · ${esc(x.rotulo)} em ${esc(x.dia)} · ${x.n === 0 ? 'é hoje' : 'faltam ' + x.n + ' dias'}</span><div class="acoes">${zap(x.c, texto('data', x.c, {rotulo:x.rotulo, dia:x.dia}), 'Lembrar', 'data')}</div></div>`).join('') : '<div class="dentro info">Nenhuma data de cliente nos próximos 30 dias.</div>'}</div>`;
}

/* ---------- PEDIDOS ---------- */
function cartaoPedido(o) {
  const c = cli(o.cliente), i = ET.findIndex(e => e[0] === o.status), prox = ABERTO(o.status) ? ET[i + 1] : null, k = MSG_ETAPA[o.status];
  const atraso = ABERTO(o.status) && o.entrega && o.entrega < hoje(), saldo = saldoPedido(o);
  return `<div class="bloco cartao"><div class="dentro">
    <div class="vtopo"><div style="min-width:0"><div class="rotulo">${esc(o.codigo)} · ${tagEt(o.status)}</div><h3><button class="link nome" data-act="ver-pedido" data-id="${o.id}">${esc(c ? c.nome : 'Cliente não cadastrado')}</button></h3></div><div class="dir"><div class="preco">${brl(totalPedido(o))}</div>${ABERTO(o.status) ? `<small class="${saldo > 0 ? 'falta' : 'ok'}">${saldo > 0 ? 'falta ' + brl(saldo) : 'pago'}</small>` : ''}</div></div>
    <p class="desc">${(o.itens || []).map(it => esc(num(it.qtd) + ' × ' + (it.nome || (prod(it.produto) || {}).nome || 'item'))).join(' · ')}</p>
    <div class="tags">${o.entrega ? `<span class="tag ${atraso ? 'alerta' : ''}">Entrega ${br(o.entrega)}${atraso ? ' · atrasada' : ''}</span>` : ''}${tecnicasPedido(o).map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div>
    <div class="acoes">${prox && prox[0] !== 'cancelado' ? `<button class="btn" data-act="avancar" data-id="${o.id}">Avançar para: ${prox[1]}</button>` : ''}${k ? zap(c, texto(k, c, {pedido:o}), (D.modelos[k] || MODELOS_PADRAO[k])[0], k) : ''}<button class="link" data-act="ver-pedido" data-id="${o.id}">Abrir</button></div>
  </div></div>`;
}
function telaPedidos() {
  const f = S.filtro, q = S.busca.toLowerCase();
  const l = D.pedidos.filter(o => (f === 'abertos' ? ABERTO(o.status) : f === 'todos' ? true : o.status === f) && (!q || (o.codigo || '').toLowerCase().includes(q) || ((cli(o.cliente) || {}).nome || '').toLowerCase().includes(q))).sort((a, b) => (a.criado || '') < (b.criado || '') ? 1 : -1);
  return `<div class="duasb"><button class="cta" data-act="novo-pedido">+ Registrar pedido</button><button class="cta sec" data-act="importar">Importar pedido do catálogo</button></div>
  <div class="linha">${[['abertos','Em aberto'],['todos','Todos']].concat(ET).map(e => `<button class="chip" data-act="filtro" data-v="${e[0]}" aria-pressed="${f === e[0]}">${e[1]}${e[0] !== 'abertos' && e[0] !== 'todos' ? ' (' + D.pedidos.filter(o => o.status === e[0]).length + ')' : ''}</button>`).join('')}</div>
  ${campo('Buscar por cliente ou código', `<input type="text" id="busca" value="${esc(S.busca)}">`)}
  <div id="lista">${l.length ? l.map(cartaoPedido).join('') : mascote('lembra', D.pedidos.length ? 'Nenhum pedido neste filtro.' : '<b>Nenhum pedido ainda.</b><span>Registre o primeiro ou cole a mensagem que chegou do catálogo.</span>')}</div>`;
}
function telaPedido() {
  const o = ped(S.id); if (!o) return ir('pedidos');
  const c = cli(o.cliente), total = totalPedido(o), custo = custoPedido(o), taxa = total * num(C().taxas) / 100, lucro = total - custo - taxa, saldo = saldoPedido(o);
  const ck = o.check || {};
  return `<button class="voltar" data-act="aba" data-aba="${S.aba}">‹ Voltar</button>
  <div class="bloco"><div class="dentro">
    <div class="vtopo"><div><div class="rotulo">${esc(o.codigo)} · criado em ${br(o.criado)}</div><h1>${esc(c ? c.nome : 'Cliente não cadastrado')}</h1>${c ? `<div class="info">${esc(fone(c.whats))}${c.bairro ? ' · ' + esc(c.bairro) : ''}</div>` : ''}</div><div class="dir">${tagEt(o.status)}</div></div>
    <label class="campo">Etapa<select data-act-change="status" data-id="${o.id}">${opts(ET, o.status)}</select></label>
    <table class="tab"><tr><th>Item</th><th>Qtd</th><th>Valor</th></tr>${(o.itens || []).map(it => `<tr><td>${esc(it.nome || (prod(it.produto) || {}).nome || 'item')}${it.obs ? `<br><small>${esc(it.obs)}</small>` : ''}</td><td>${num(it.qtd)}</td><td>${brl(num(it.qtd) * num(it.preco))}</td></tr>`).join('')}
    ${num(o.frete) ? `<tr><td colspan="2">Entrega</td><td>${brl(o.frete)}</td></tr>` : ''}${num(o.desconto) ? `<tr><td colspan="2">Desconto</td><td>− ${brl(o.desconto)}</td></tr>` : ''}<tr class="tot"><td colspan="2">Total</td><td>${brl(total)}</td></tr></table>
    <div class="tags">${o.entrega ? `<span class="tag">Entrega ${br(o.entrega)}</span>` : ''}${o.local ? `<span class="tag">${esc(o.local)}</span>` : ''}${o.baixado ? '<span class="tag">insumos baixados</span>' : ''}</div>
    ${o.obs ? `<p class="desc">${esc(o.obs)}</p>` : ''}
    <div class="acoes"><button class="btn" data-act="editar-pedido" data-id="${o.id}">Editar</button>${confirmarBtn('excluir-pedido', o.id, 'Excluir pedido')}</div>
  </div></div>
  <div class="bloco"><header><b>Pagamento</b><span>${saldo > 0 ? 'falta ' + brl(saldo) : 'quitado'}</span></header><div class="dentro">
    ${(o.pagamentos || []).map(p => `<div class="lin0"><span>${br(p.data)} · ${esc(p.forma)}</span><span><b>${brl(p.valor)}</b> ${confirmarBtn('excluir-pag', o.id + ':' + p.id, 'Remover')}</span></div>`).join('') || '<div class="info">Nenhum pagamento registrado.</div>'}
    ${saldo > 0 ? `<div class="tres">${campo('Valor recebido', `<input type="text" id="pg-valor" value="${numTxt(saldo)}" inputmode="decimal">`)}${campo('Forma', `<select id="pg-forma">${opts(FORMAS)}</select>`)}${campo('Data', `<input type="date" id="pg-data" value="${hoje()}">`)}</div><button class="btn forte" data-act="pagar" data-id="${o.id}">Registrar pagamento</button><div class="info">Para registrar um sinal, troque o valor. O pagamento entra sozinho no Financeiro.</div>` : ''}
  </div></div>
  <div class="bloco"><header><b>Produção</b><span>${tecnicasPedido(o).join(', ')}</span></header><div class="dentro">
    ${[['arte','Arte aprovada pela cliente'],['separado','Insumos separados'],['produzido','Produzido'],['embalado','Embalado']].map(([k, t]) => `<label class="opc"><span>${t}</span><input type="checkbox" data-act-change="check" data-id="${o.id}" data-k="${k}" ${ck[k] ? 'checked' : ''}></label>`).join('')}
  </div></div>
  <div class="bloco"><header><b>Resultado do pedido</b><span>pela ficha técnica</span></header><div class="dentro soma">
    <div><span>Total</span><span>${brl(total)}</span></div><div><span>Custo dos produtos</span><span>− ${brl(custo)}</span></div><div><span>Taxas (${pct(num(C().taxas))})</span><span>− ${brl(taxa)}</span></div><div class="total"><span>Lucro estimado</span><span>${brl(lucro)}</span></div>
  </div></div>
  <div class="bloco"><header><b>Mensagens</b></header><div class="dentro acoes">${['confirma','cobranca','arte','producao','pronto','posvenda'].map(k => zap(c, texto(k, c, {pedido:o}), (D.modelos[k] || MODELOS_PADRAO[k])[0], k)).join('')}</div></div>`;
}
function itemVazio() { return {produto:'', nome:'', qtd:'1', preco:'', obs:''}; }
function novoPedido(cliente) { return {_tipo:'pedido', _novo:true, id:novoId('p'), codigo:proxCodigo(), cliente:cliente || '', _nome:'', _whats:'', itens:[itemVazio()], frete:'', desconto:'', entrega:'', local:'', status:'novo', obs:'', pagamentos:[], criado:hoje(), check:{}}; }
function formPedido() {
  const e = S.edit, clientes = D.clientes.slice().sort((a, b) => a.nome.localeCompare(b.nome));
  const produtos = D.produtos.filter(p => p.ativo !== false).sort((a, b) => a.nome.localeCompare(b.nome));
  return `<button class="voltar" data-act="cancelar-form">‹ Voltar sem guardar</button><h1>${e._novo ? 'Registrar pedido' : 'Editar pedido ' + esc(e.codigo)}</h1>
  ${e._imp ? '<div class="aviso">Confira os dados lidos da mensagem antes de guardar. Itens que não achei no cadastro de produtos ficaram com o nome da mensagem.</div>' : ''}
  <div class="bloco"><header><b>Cliente</b></header><div class="dentro">
    ${campo('Cliente', `<select data-f="cliente" data-rerender="1"><option value="">Nova cliente</option>${clientes.map(c => `<option value="${c.id}" ${e.cliente === c.id ? 'selected' : ''}>${esc(c.nome)} · ${esc(fone(c.whats))}</option>`).join('')}</select>`)}
    ${e.cliente ? '' : `<div class="duas">${campo('Nome', inp('_nome', e._nome, 'maxlength="60"'))}${campo('WhatsApp', inp('_whats', e._whats, 'inputmode="tel"'), 'com DDD')}</div>`}
  </div></div>
  <div class="bloco"><header><b>Itens</b><button class="link" data-act="add-item">+ Item</button></header><div class="dentro">
    ${e.itens.map((it, n) => `<div class="item-ed"><div class="duas">${campo('Produto', `<select data-f="itens.${n}.produto" data-rerender="1"><option value="">${it.nome && !it.produto ? esc(it.nome) + ' (fora do cadastro)' : 'Escolha'}</option>${produtos.map(p => `<option value="${p.id}" ${it.produto === p.id ? 'selected' : ''}>${esc(p.nome)}</option>`).join('')}</select>`)}<div class="duas">${campo('Qtd', inp(`itens.${n}.qtd`, it.qtd, 'inputmode="numeric"'))}${campo('Preço un.', inp(`itens.${n}.preco`, it.preco, 'inputmode="decimal"'))}</div></div>
    ${campo('Personalização', inp(`itens.${n}.obs`, it.obs, 'maxlength="200"'), 'nome, frase, cor')}${e.itens.length > 1 ? `<button class="link" data-act="rm-item" data-n="${n}">Remover item</button>` : ''}</div>`).join('')}
  </div></div>
  <div class="bloco"><header><b>Entrega e etapa</b></header><div class="dentro">
    <div class="duas">${campo('Data de entrega', `<input type="date" data-f="entrega" value="${esc(e.entrega)}">`)}${campo('Etapa', `<select data-f="status">${opts(ET, e.status)}</select>`)}</div>
    ${campo('Entrega ou retirada', inp('local', e.local, 'maxlength="80"'), 'bairro ou "retirada"')}
    <div class="duas">${campo('Taxa de entrega', inp('frete', e.frete, 'inputmode="decimal"'))}${campo('Desconto', inp('desconto', e.desconto, 'inputmode="decimal"'))}</div>
    ${campo('Anotações', `<textarea data-f="obs" rows="2">${esc(e.obs)}</textarea>`)}
    <div class="soma" id="resumo"></div>
  </div></div>
  <div class="erro" id="erro" role="alert"></div><button class="cta" data-act="salvar-pedido">Guardar pedido</button>`;
}
function resumoPedidoForm() { const r = $('#resumo'); if (!r || !S.edit || S.edit._tipo !== 'pedido') return; const o = S.edit; r.innerHTML = `<div class="total"><span>Total</span><span>${brl(totalPedido(o))}</span></div><div><span>Lucro estimado</span><span>${brl(totalPedido(o) * (1 - num(C().taxas) / 100) - custoPedido(o))}</span></div>`; }
function salvarPedido() {
  const e = S.edit, err = t => { $('#erro').textContent = t; };
  e.itens = e.itens.filter(it => it.produto || it.nome);
  if (!e.itens.length) { e.itens = [itemVazio()]; return err('Inclua pelo menos um item.'); }
  if (e.itens.some(it => !(num(it.qtd) > 0))) return err('Confira a quantidade de cada item.');
  let cid = e.cliente;
  if (!cid) { const nome = (e._nome || '').trim(), w = String(e._whats || '').replace(/\D/g, ''); if (!nome) return err('Escolha uma cliente ou informe o nome da nova cliente.'); const ja = w && D.clientes.find(c => c.whats === w); if (ja) cid = ja.id; else { const c = novoCliente(); Object.assign(c, {nome, whats:w, origem:e._imp ? 'Catálogo' : ''}); delete c._tipo; delete c._novo; D.clientes.push(c); cid = c.id; } }
  const o = {id:e.id, codigo:e.codigo, cliente:cid, itens:e.itens.map(it => { const p = prod(it.produto); return {produto:it.produto, nome:p ? p.nome : it.nome, qtd:num(it.qtd), preco:num(it.preco), obs:it.obs || '', custo:p ? custoProduto(p) : num(it.custo)}; }),
    frete:num(e.frete), desconto:num(e.desconto), entrega:e.entrega, local:e.local, obs:e.obs, pagamentos:e.pagamentos || [], criado:e.criado, check:e.check || {}, baixado:!!e.baixado, entregueEm:e.entregueEm, posVenda:e.posVenda, status:e.status};
  const antigo = ped(o.id);
  if (antigo) { const st = o.status; o.status = antigo.status; Object.assign(antigo, o); if (st !== antigo.status) mudarStatus(antigo, st); }
  else { const st = o.status; o.status = 'novo'; D.pedidos.push(o); if (st !== 'novo') mudarStatus(o, st); }
  salvar(); S.edit = null; ir('pedidos', 'pedido', o.id);
}
function lerMensagem(t) {
  const cod = (/pedido\s+(JF[A-Z0-9]+)/i.exec(t) || [])[1], tot = (/\*?Total:\s*R\$\s*([\d.,]+)/i.exec(t) || [])[1];
  if (!cod && !tot) return null;
  const e = novoPedido(); e._imp = true; e.itens = []; if (cod) e.codigo = cod;
  t.split('\n').forEach((l, i, a) => { const m = /^\s*\d+\.\s*\*(.+?)\*/.exec(l); if (!m) return; const nome = m[1].trim(); let qtd = 1, valor = 0; const obs = [];
    for (let j = i + 1; j < a.length && /^\s{2,}\S/.test(a[j]); j++) { const x = a[j].trim(); if (/^Quantidade:/.test(x)) qtd = num(x.split(':')[1]) || 1; else if (/^Valor:/.test(x)) valor = num(x.split('R$')[1]); else obs.push(x); }
    const p = D.produtos.find(p => p.nome.toLowerCase() === nome.toLowerCase());
    e.itens.push({produto:p ? p.id : '', nome, qtd:String(qtd), preco:numTxt(valor / qtd), obs:obs.join(' · ')}); });
  if (!e.itens.length) e.itens = [itemVazio()];
  const fr = /^(Entrega|Retirada)\s*\((.+?)\):\s*(R\$\s*[\d.,]+|grátis)/im.exec(t); if (fr) { e.local = fr[1] + ': ' + fr[2]; e.frete = /grátis/i.test(fr[3]) ? '' : numTxt(num(fr[3].replace('R$', ''))); }
  const dt = /Preciso para o dia:\s*(\d{2})\/(\d{2})\/(\d{4})/.exec(t); if (dt) e.entrega = dt[3] + '-' + dt[2] + '-' + dt[1];
  e._nome = ((/Meu nome:\s*(.+)/.exec(t) || [])[1] || '').trim(); e.status = /QR Code/.test(t) ? 'pagamento' : 'novo';
  return e;
}
function telaImportar() {
  return `<button class="voltar" data-act="aba" data-aba="pedidos">‹ Voltar</button><h1>Importar pedido do catálogo</h1>
  <div class="bloco"><div class="dentro">${campo('Cole aqui a mensagem que a cliente mandou pelo WhatsApp', `<textarea id="imp" rows="10" placeholder="Oi, Jú! Fiz o pedido JF... no catálogo:">${esc(S.imp)}</textarea>`)}
  <div class="erro" id="erro" role="alert"></div><button class="cta" data-act="ler-msg">Ler pedido</button><div class="info">Eu leio o código, os itens, a personalização, a entrega e a data. Você confere antes de guardar.</div></div></div>`;
}

/* ---------- PRODUÇÃO ---------- */
function telaProducao() {
  const h = hoje(), fila = D.pedidos.filter(o => ['pagamento','arte','producao'].includes(o.status)).sort((a, b) => (a.entrega || '9') < (b.entrega || '9') ? -1 : 1);
  const cap = num(C().capacidade) || 0, dias14 = Array.from({length:14}, (_, i) => somaDias(h, i));
  const carga = dias14.map(d => ({d, n:fila.filter(o => o.entrega === d).reduce((s, o) => s + pecasPedido(o), 0)}));
  const max = Math.max(cap, ...carga.map(x => x.n), 1);
  const porTec = {}; fila.forEach(o => tecnicasPedido(o).forEach(t => (porTec[t] = porTec[t] || []).push(o)));
  const ck = o => o.check || {};
  const linha = o => { const c = cli(o.cliente), atraso = o.entrega && o.entrega < h; return `<div class="lin"><span><button class="link nome2" data-act="ver-pedido" data-id="${o.id}">${esc(o.codigo)} · ${esc(c ? c.nome : '')}</button><br><small>${(o.itens || []).map(it => esc(num(it.qtd) + ' × ' + it.nome + (it.obs ? ' (' + it.obs + ')' : ''))).join(' · ')}</small></span><span class="dir">${tagEt(o.status)}<br><small class="${atraso ? 'falta' : ''}">${o.entrega ? 'entrega ' + brCurto(o.entrega) : 'sem data'}</small><br><small>${['arte','separado','produzido','embalado'].filter(k => ck(o)[k]).length}/4 etapas</small></span></div>`; };
  return `<div class="bloco"><header><b>Peças por dia de entrega</b><span>próximos 14 dias · capacidade ${cap} por dia</span></header><div class="dentro">
    <div class="carga" role="img" aria-label="Peças com entrega em cada um dos próximos 14 dias">${carga.map(x => `<div class="dia" title="${br(x.d)}: ${x.n} peças"><div class="barra-v"><i style="height:${Math.round(x.n / max * 100)}%" class="${cap && x.n > cap ? 'acima' : ''}"></i>${cap ? `<s style="bottom:${Math.round(cap / max * 100)}%"></s>` : ''}</div><b>${x.n || ''}</b><small>${x.d.slice(8)}</small></div>`).join('')}</div>
    <div class="info">Os números de baixo são os dias do mês, a partir de hoje. A linha tracejada é a sua capacidade por dia, que você ajusta em Ajustes. Barras em vermelho passam da capacidade.</div>
  </div></div>
  ${fila.length ? Object.keys(porTec).sort().map(t => `<div class="bloco"><header><b>${esc(t)}</b><span>${porTec[t].length} ${porTec[t].length === 1 ? 'pedido' : 'pedidos'}</span></header>${porTec[t].map(linha).join('')}</div>`).join('') : mascote('uau', '<b>Fila vazia.</b><span>Pedidos aguardando pagamento, em arte ou em produção aparecem aqui, separados por técnica e pela data de entrega.</span>')}`;
}

/* ---------- CLIENTES ---------- */
function novoCliente() { return {_tipo:'cliente', _novo:true, id:novoId('c'), nome:'', whats:'', bairro:'', endereco:'', origem:'', etiquetas:'', aniversario:'', dataRotulo:'', dataDia:'', obs:'', autorizaFoto:false, aceitaMsg:true, contatos:[], criado:hoje()}; }
function listaClientes() {
  const q = S.busca.toLowerCase(), qd = q.replace(/\D/g, '');
  const l = D.clientes.filter(c => !q || c.nome.toLowerCase().includes(q) || (qd && String(c.whats).includes(qd)) || (c.bairro || '').toLowerCase().includes(q) || (c.etiquetas || '').toLowerCase().includes(q)).sort((a, b) => a.nome.localeCompare(b.nome));
  return l.length ? `<div class="bloco">${l.map(c => { const ps = pedidosDe(c.id); return `<button class="lin cli" data-act="ver-cliente" data-id="${c.id}"><span><b>${esc(c.nome)}</b><br><small>${esc(fone(c.whats))}${c.bairro ? ' · ' + esc(c.bairro) : ''}${c.etiquetas ? ' · ' + esc(c.etiquetas) : ''}</small></span><span class="dir"><b>${brl(ps.reduce((s, o) => s + totalPedido(o), 0))}</b><br><small>${ps.length} ${ps.length === 1 ? 'pedido' : 'pedidos'}</small></span></button>`; }).join('')}</div>` : mascote('ei', D.clientes.length ? 'Não encontrei ninguém com essa busca.' : '<b>Nenhuma cliente cadastrada.</b><span>Cadastre aqui ou registre um pedido, que eu cadastro junto.</span>');
}
function telaClientes() { return `<button class="cta" data-act="novo-cliente">+ Cadastrar cliente</button>${campo('Buscar por nome, WhatsApp, bairro ou etiqueta', `<input type="text" id="busca-cli" value="${esc(S.busca)}">`)}<div id="lista-cli">${listaClientes()}</div>`; }
function telaCliente() {
  const c = cli(S.id); if (!c) return ir('clientes');
  const ps = D.pedidos.filter(o => o.cliente === c.id).sort((a, b) => (a.criado || '') < (b.criado || '') ? 1 : -1), tot = pedidosDe(c.id).reduce((s, o) => s + totalPedido(o), 0);
  return `<button class="voltar" data-act="aba" data-aba="clientes">‹ Todas as clientes</button>
  <div class="bloco"><div class="dentro"><div class="vtopo"><div><h1>${esc(c.nome)}</h1><div class="info">${esc(fone(c.whats))}${c.bairro ? ' · ' + esc(c.bairro) : ''}${c.origem ? ' · veio por ' + esc(c.origem) : ''}</div></div><div class="dir"><div class="preco">${brl(tot)}</div><small class="info">${pedidosDe(c.id).length} pedidos · ticket ${brl(pedidosDe(c.id).length ? tot / pedidosDe(c.id).length : 0)}</small></div></div>
  <div class="tags">${c.etiquetas ? c.etiquetas.split(',').map(t => t.trim()).filter(Boolean).map(t => `<span class="tag">${esc(t)}</span>`).join('') : ''}<span class="tag ${c.autorizaFoto ? 'ok' : ''}">${c.autorizaFoto ? 'autoriza foto no Instagram' : 'sem autorização de foto'}</span>${c.aceitaMsg === false ? '<span class="tag alerta">não quer receber campanhas</span>' : ''}</div>
  ${c.endereco ? `<div><span class="rotulo">Endereço</span><br>${esc(c.endereco)}</div>` : ''}
  ${c.aniversario || c.dataDia ? `<div><span class="rotulo">Datas</span><br>${c.aniversario ? 'Aniversário em ' + esc(c.aniversario) : ''}${c.aniversario && c.dataDia ? ' · ' : ''}${c.dataDia ? esc(c.dataRotulo || 'Data especial') + ' em ' + esc(c.dataDia) : ''}</div>` : ''}
  ${c.obs ? `<div><span class="rotulo">Anotações</span><br>${esc(c.obs)}</div>` : ''}
  <div class="acoes">${zap(c, 'Oi, ' + primeiro(c.nome) + '! ', 'Abrir conversa')}<button class="btn" data-act="novo-pedido" data-cli="${c.id}">+ Pedido</button><button class="link" data-act="editar-cliente" data-id="${c.id}">Editar</button>${confirmarBtn('excluir-cliente', c.id, 'Excluir')}</div></div></div>
  <div class="bloco"><header><b>Mensagens prontas</b></header><div class="dentro acoes">${c.aceitaMsg === false ? '<span class="info">Esta cliente pediu para não receber campanhas.</span>' : ['posvenda','reativar'].map(k => zap(c, texto(k, c), D.modelos[k][0], k)).join('')}</div></div>
  ${(c.contatos || []).length ? `<div class="bloco"><header><b>Contatos registrados</b></header>${c.contatos.slice(-8).reverse().map(x => `<div class="lin"><span>${br(x.data)}</span><span>${esc((D.modelos[x.modelo] || [x.modelo || 'Conversa'])[0])}</span></div>`).join('')}</div>` : ''}
  <h2 class="sec">Pedidos</h2>${ps.length ? ps.map(cartaoPedido).join('') : '<div class="vazio">Ainda sem pedidos.</div>'}`;
}
function formCliente() {
  const e = S.edit;
  return `<button class="voltar" data-act="cancelar-form">‹ Voltar sem guardar</button><h1>${e._novo ? 'Cadastrar cliente' : 'Editar cliente'}</h1>
  <div class="bloco"><div class="dentro">
  ${campo('Nome', inp('nome', e.nome, 'maxlength="60"'))}
  <div class="duas">${campo('WhatsApp', inp('whats', fone(e.whats), 'inputmode="tel"'), 'com DDD')}${campo('Como chegou', `<select data-f="origem">${opts(ORIGENS, e.origem)}</select>`)}</div>
  <div class="duas">${campo('Bairro ou cidade', inp('bairro', e.bairro, 'maxlength="40"'))}${campo('Etiquetas', inp('etiquetas', e.etiquetas, 'maxlength="80"'), 'separe por vírgula: noiva, empresa')}</div>
  ${campo('Endereço de entrega', inp('endereco', e.endereco, 'maxlength="140"'), 'opcional')}
  <div class="tres">${campo('Aniversário', inp('aniversario', e.aniversario, 'maxlength="5" placeholder="12/03" inputmode="numeric"'), 'dd/mm')}${campo('Outra data', inp('dataRotulo', e.dataRotulo, 'maxlength="30" placeholder="aniversário da filha"'))}${campo('Dia', inp('dataDia', e.dataDia, 'maxlength="5" inputmode="numeric"'), 'dd/mm')}</div>
  <label class="opc"><span>Autoriza mostrar o produto pronto no Instagram</span><input type="checkbox" data-f="autorizaFoto" ${e.autorizaFoto ? 'checked' : ''}></label>
  <label class="opc"><span>Aceita receber mensagens de campanhas</span><input type="checkbox" data-f="aceitaMsg" ${e.aceitaMsg !== false ? 'checked' : ''}></label>
  ${campo('Anotações', `<textarea data-f="obs" rows="3" maxlength="500">${esc(e.obs)}</textarea>`, 'gostos, cores, família')}
  <div class="erro" id="erro" role="alert"></div><button class="cta" data-act="salvar-cliente">Guardar cliente</button></div></div>`;
}
function salvarCliente() {
  const e = S.edit, err = t => { $('#erro').textContent = t; };
  if (!String(e.nome).trim()) return err('Informe o nome da cliente.');
  for (const k of ['aniversario', 'dataDia']) if (String(e[k] || '').trim() && proxDDMM(e[k]) === null) return err('Escreva as datas como dia/mês, por exemplo 12/03.');
  const c = {...e, nome:String(e.nome).trim(), whats:String(e.whats || '').replace(/\D/g, '')}; delete c._tipo; delete c._novo;
  const i = D.clientes.findIndex(x => x.id === c.id); if (i >= 0) D.clientes[i] = c; else D.clientes.push(c);
  salvar(); S.edit = null; ir('clientes', 'cliente', c.id);
}

/* ---------- PRODUTOS E PREÇO ---------- */
function telaProdutos() {
  const d = divisor();
  return `<div class="bloco"><header><b>Markup divisor</b><button class="link" data-act="aba" data-aba="ajustes">Ajustar percentuais</button></header><div class="dentro">
    <div class="formula">Preço = custo ÷ (1 − (${pct(num(C().fixas))} despesas fixas + ${pct(num(C().taxas))} taxas + ${pct(num(C().lucro))} lucro)) = custo ÷ ${d > 0 ? d.toLocaleString('pt-BR', {maximumFractionDigits:2}) : '—'}</div>
    <div class="info">O custo soma insumos da ficha técnica, embalagem e o seu tempo (${brl(C().hora)} por hora).${d <= 0 ? ' Os percentuais somam 100% ou mais: reduza algum em Ajustes.' : ''}</div>
  </div></div>
  <button class="cta" data-act="novo-produto">+ Cadastrar produto</button>
  ${D.produtos.length ? `<div class="tabela"><table class="tab"><tr><th>Produto</th><th>Custo</th><th>Sugerido</th><th>Preço</th><th>Margem</th></tr>${D.produtos.slice().sort((a, b) => a.nome.localeCompare(b.nome)).map(p => { const cu = custoProduto(p), lu = lucroUnit(p, num(p.preco)), mg = num(p.preco) ? lu / num(p.preco) * 100 : 0, sug = precoSugerido(p); return `<tr class="${p.ativo === false ? 'apagado' : ''}"><td><button class="link nome2" data-act="editar-produto" data-id="${p.id}">${esc(p.nome)}</button><br><small>${esc(CATS[p.cat] || '')} · ${esc(p.tecnica || '')}${p.ativo === false ? ' · fora de linha' : ''}</small></td><td>${brl(cu)}</td><td>${brl(sug)}</td><td><b>${brl(p.preco)}</b>${num(p.preco) && num(p.preco) < sug - 0.005 ? '<br><small class="falta">abaixo do sugerido</small>' : ''}</td><td class="${mg < num(C().lucro) / 2 ? 'falta' : ''}">${pct(mg)}<br><small>${brl(lu)}</small></td></tr>`; }).join('')}</table></div>
  <div class="info">Margem = lucro por unidade depois de custo, despesas fixas e taxas, dividido pelo preço. Em vermelho: margem abaixo da metade do lucro desejado.</div>` : mascote('lembra', D.insumos.length ? '<b>Nenhum produto cadastrado.</b><span>Cadastre um produto e monte a ficha técnica com os insumos que ele usa.</span>' : '<b>Comece pelos insumos.</b><span>A ficha técnica de cada produto usa o custo dos insumos. Cadastre-os primeiro na aba Insumos.</span>')}`;
}
function novoProduto() { return {_tipo:'produto', _novo:true, id:novoId('pr'), nome:'', cat:'datas', tecnica:'Sublimação', preco:'', tempo:'15', embalagem:'', ficha:[{insumo:'', qtd:'1'}], ativo:true, prazo:'3'}; }
function formProduto() {
  const e = S.edit, insumos = D.insumos.slice().sort((a, b) => a.nome.localeCompare(b.nome));
  return `<button class="voltar" data-act="cancelar-form">‹ Voltar sem guardar</button><h1>${e._novo ? 'Cadastrar produto' : 'Editar produto'}</h1>
  <div class="bloco"><header><b>Produto</b></header><div class="dentro">
    ${campo('Nome', inp('nome', e.nome, 'maxlength="60"'))}
    <div class="duas">${campo('Categoria', `<select data-f="cat">${opts(Object.entries(CATS), e.cat)}</select>`)}${campo('Técnica principal', `<select data-f="tecnica">${opts(TECNICAS, e.tecnica)}</select>`)}</div>
    <div class="tres">${campo('Prazo', inp('prazo', e.prazo, 'inputmode="numeric"'), 'dias úteis')}${campo('Seu tempo', inp('tempo', e.tempo, 'inputmode="numeric"'), 'minutos por unidade')}${campo('Embalagem', inp('embalagem', e.embalagem, 'inputmode="decimal"'), 'R$ por unidade')}</div>
    <label class="opc"><span>Produto ativo (desmarque para fora de linha)</span><input type="checkbox" data-f="ativo" ${e.ativo !== false ? 'checked' : ''}></label>
  </div></div>
  <div class="bloco"><header><b>Ficha técnica</b><button class="link" data-act="add-ficha">+ Insumo</button></header><div class="dentro">
    ${insumos.length ? e.ficha.map((f, n) => `<div class="duas">${campo('Insumo', `<select data-f="ficha.${n}.insumo"><option value="">Escolha</option>${insumos.map(i => `<option value="${i.id}" ${f.insumo === i.id ? 'selected' : ''}>${esc(i.nome)} (${brl(i.custo)}/${esc(i.unidade)})</option>`).join('')}</select>`)}<div class="duas">${campo('Quantidade', inp(`ficha.${n}.qtd`, f.qtd, 'inputmode="decimal"'))}<button class="link" data-act="rm-ficha" data-n="${n}" style="align-self:center">Remover</button></div></div>`).join('') : '<div class="info">Cadastre insumos na aba Insumos para montar a ficha técnica.</div>'}
  </div></div>
  <div class="bloco"><header><b>Preço</b></header><div class="dentro"><div class="soma" id="resumo"></div>
    <div class="duas">${campo('Preço de venda', inp('preco', e.preco, 'inputmode="decimal"'), 'R$')}<button class="btn" data-act="usar-sugerido" style="align-self:end">Usar o preço sugerido</button></div>
  </div></div>
  <div class="erro" id="erro" role="alert"></div><button class="cta" data-act="salvar-produto">Guardar produto</button>${e._novo ? '' : confirmarBtn('excluir-produto', e.id, 'Excluir produto')}`;
}
function resumoProdutoForm() {
  const r = $('#resumo'); if (!r || !S.edit || S.edit._tipo !== 'produto') return; const p = S.edit, ci = custoInsumos(p), cu = custoProduto(p), sug = precoSugerido(p), pr = num(p.preco), lu = lucroUnit(p, pr);
  r.innerHTML = `<div><span>Insumos</span><span>${brl(ci)}</span></div><div><span>Embalagem</span><span>${brl(num(p.embalagem))}</span></div><div><span>Seu tempo (${num(p.tempo)} min)</span><span>${brl(num(p.tempo) / 60 * num(C().hora))}</span></div><div class="total"><span>Custo por unidade</span><span>${brl(cu)}</span></div><div class="total"><span>Preço sugerido</span><span>${brl(sug)}</span></div>${pr ? `<div><span>Lucro com ${brl(pr)}</span><span class="${lu < 0 ? 'falta' : ''}">${brl(lu)} (${pct(lu / pr * 100)})</span></div>` : ''}`;
}
function salvarProduto() {
  const e = S.edit, err = t => { $('#erro').textContent = t; };
  if (!String(e.nome).trim()) return err('Dê um nome ao produto.');
  if (!(num(e.preco) > 0)) return err('Informe o preço de venda, ou toque em "Usar o preço sugerido".');
  const p = {id:e.id, nome:String(e.nome).trim(), cat:e.cat, tecnica:e.tecnica, preco:num(e.preco), tempo:num(e.tempo), embalagem:num(e.embalagem), prazo:num(e.prazo), ativo:e.ativo !== false, ficha:e.ficha.filter(f => f.insumo && num(f.qtd) > 0).map(f => ({insumo:f.insumo, qtd:num(f.qtd)}))};
  const i = D.produtos.findIndex(x => x.id === p.id); if (i >= 0) D.produtos[i] = p; else D.produtos.push(p);
  salvar(); S.edit = null; ir('produtos');
}

/* ---------- INSUMOS ---------- */
function telaInsumos() {
  const falta = D.insumos.filter(i => num(i.estoque) <= num(i.minimo));
  const valor = D.insumos.reduce((s, i) => s + Math.max(0, num(i.estoque)) * num(i.custo), 0);
  return `<div class="kpis">${kpi('Insumos cadastrados', D.insumos.length)}${kpi('No mínimo ou abaixo', falta.length)}${kpi('Valor em estoque', brl(valor))}</div>
  <button class="cta" data-act="novo-insumo">+ Cadastrar insumo</button>
  ${falta.length ? `<div class="bloco"><header><b>Lista de compras</b><button class="link" data-act="copiar-compras">Copiar lista</button></header>${falta.map(i => `<div class="lin"><span>${esc(i.nome)}</span><span>comprar ${numTxt(Math.max(num(i.minimo) * 2 - num(i.estoque), 1))} ${esc(i.unidade)}</span></div>`).join('')}<div class="dentro info">Quantidade sugerida: o dobro do mínimo, menos o que você tem.</div></div>` : ''}
  ${D.insumos.length ? `<div class="bloco">${D.insumos.slice().sort((a, b) => a.nome.localeCompare(b.nome)).map(i => { const baixo = num(i.estoque) <= num(i.minimo); return `<div class="lin"><span><button class="link nome2" data-act="editar-insumo" data-id="${i.id}">${esc(i.nome)}</button><br><small>${brl(i.custo)} por ${esc(i.unidade)} · mínimo ${numTxt(num(i.minimo)) || 0}</small></span><span class="dir"><b class="${baixo ? 'falta' : ''}">${numTxt(num(i.estoque)) || '0'} ${esc(i.unidade)}</b><br><button class="link" data-act="abrir-compra" data-id="${i.id}">Registrar compra</button></span></div>${S.id === i.id && S.view === 'compra' ? `<div class="dentro compra"><div class="tres">${campo('Quantidade', '<input type="text" id="cp-qtd" inputmode="decimal">', esc(i.unidade))}${campo('Valor pago', '<input type="text" id="cp-valor" inputmode="decimal">', 'total, R$')}${campo('Data', `<input type="date" id="cp-data" value="${hoje()}">`)}</div><label class="opc"><span>Atualizar o custo do insumo com esta compra</span><input type="checkbox" id="cp-custo" checked></label><div class="erro" id="erro" role="alert"></div><button class="btn forte" data-act="salvar-compra" data-id="${i.id}">Guardar compra</button><div class="info">A compra soma ao estoque e entra como saída no Financeiro.</div></div>` : ''}`; }).join('')}</div>` : mascote('ei', '<b>Nenhum insumo cadastrado.</b><span>Comece pelo que mais usa: caneca branca para sublimação, papel de sublimação, chapa de MDF, acrílico, caixas, fitas.</span>')}
  <div class="info">O estoque baixa sozinho quando um pedido entra em produção, pela ficha técnica de cada produto.</div>`;
}
function novoInsumo() { return {_tipo:'insumo', _novo:true, id:novoId('i'), nome:'', unidade:'un', custo:'', estoque:'', minimo:''}; }
function formInsumo() {
  const e = S.edit;
  return `<button class="voltar" data-act="cancelar-form">‹ Voltar sem guardar</button><h1>${e._novo ? 'Cadastrar insumo' : 'Editar insumo'}</h1>
  <div class="bloco"><div class="dentro">${campo('Nome', inp('nome', e.nome, 'maxlength="60" placeholder="Caneca branca 325 ml"'))}
  <div class="duas">${campo('Unidade', `<select data-f="unidade">${opts(['un','m','folha','placa','pacote','g','ml'], e.unidade)}</select>`)}${campo('Custo por unidade', inp('custo', e.custo, 'inputmode="decimal"'), 'R$')}</div>
  <div class="duas">${campo('Estoque atual', inp('estoque', e.estoque, 'inputmode="decimal"'))}${campo('Estoque mínimo', inp('minimo', e.minimo, 'inputmode="decimal"'), 'avisa ao chegar nele')}</div>
  <div class="erro" id="erro" role="alert"></div><button class="cta" data-act="salvar-insumo">Guardar insumo</button>${e._novo ? '' : confirmarBtn('excluir-insumo', e.id, 'Excluir insumo')}</div></div>`;
}
function salvarInsumo() {
  const e = S.edit; if (!String(e.nome).trim()) { $('#erro').textContent = 'Dê um nome ao insumo.'; return; }
  const i = {id:e.id, nome:String(e.nome).trim(), unidade:e.unidade, custo:num(e.custo), estoque:num(e.estoque), minimo:num(e.minimo)};
  const k = D.insumos.findIndex(x => x.id === i.id); if (k >= 0) D.insumos[k] = i; else D.insumos.push(i);
  salvar(); S.edit = null; ir('insumos');
}

/* ---------- FINANCEIRO ---------- */
function telaFinanceiro() {
  const m = S.mes, ano = m.slice(0,4), ls = D.lancamentos.filter(l => l.data.slice(0,7) === m).sort((a, b) => a.data < b.data ? 1 : -1);
  const ent = ls.filter(l => l.tipo === 'entrada').reduce((s, l) => s + num(l.valor), 0), sai = ls.filter(l => l.tipo === 'saida').reduce((s, l) => s + num(l.valor), 0);
  const fatAno = D.lancamentos.filter(l => l.tipo === 'entrada' && l.categoria === 'Vendas' && l.data.slice(0,4) === ano).reduce((s, l) => s + num(l.valor), 0);
  const lim = num(C().limiteMei) || 81000, usado = fatAno / lim * 100;
  const mesesPass = ano === hoje().slice(0,4) ? Number(hoje().slice(5,7)) : 12, proj = mesesPass ? fatAno / mesesPass * 12 : 0;
  const porCat = {}; ls.filter(l => l.tipo === 'saida').forEach(l => porCat[l.categoria] = (porCat[l.categoria] || 0) + num(l.valor));
  const dasPago = D.lancamentos.some(l => l.categoria === 'Impostos (DAS)' && l.data.slice(0,7) === hoje().slice(0,7));
  const [a, mm] = m.split('-').map(Number), ant = new Date(a, mm - 2, 1), seg = new Date(a, mm, 1), fm = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  return `<div class="mesnav"><button class="btn" data-act="mes" data-v="${fm(ant)}">‹</button><b>${mesNome(mm - 1).replace(/^./, c => c.toUpperCase())} de ${a}</b><button class="btn" data-act="mes" data-v="${fm(seg)}">›</button></div>
  <div class="kpis">${kpi('Entradas', brl(ent))}${kpi('Saídas', brl(sai))}${kpi('Resultado', brl(ent - sai))}${kpi('Margem do mês', ent ? pct((ent - sai) / ent * 100) : '—')}</div>
  <div class="bloco"><header><b>Limite do MEI em ${ano}</b><span>${brl(fatAno)} de ${brl(lim)}</span></header><div class="dentro">
    <div class="medidor" role="img" aria-label="Faturamento do ano: ${pct(usado)} do limite"><i style="width:${Math.min(100, usado)}%" class="${usado >= 80 ? 'acima' : ''}"></i></div>
    <div class="info">${pct(usado)} do limite usado. No ritmo atual, o ano fecha em cerca de ${brl(proj)}${proj > lim ? ', acima do limite: converse com seu contador' : ''}. Conta só o que entrou como venda.</div>
    ${num(C().das) ? `<div class="lin0"><span>DAS deste mês (${brl(C().das)})</span>${dasPago ? '<span class="tag ok">pago</span>' : `<button class="btn" data-act="pagar-das">Registrar pagamento do DAS</button>`}</div>` : '<div class="info">Informe o valor do seu DAS em Ajustes para ter o lembrete mensal.</div>'}
  </div></div>
  <button class="cta" data-act="novo-lanc">+ Registrar entrada ou saída</button>
  ${Object.keys(porCat).length ? `<div class="bloco"><header><b>Saídas por categoria</b></header><div class="dentro">${barras(Object.entries(porCat).sort((x, y) => y[1] - x[1]).map(([k, v]) => [k, v, brl(v)]))}</div></div>` : ''}
  <div class="bloco"><header><b>Lançamentos do mês</b></header>${ls.length ? ls.map(l => `<div class="lin"><span>${br(l.data)} · ${esc(l.desc || l.categoria)}<br><small>${esc(l.categoria)}${l.forma ? ' · ' + esc(l.forma) : ''}</small></span><span class="dir"><b class="${l.tipo === 'saida' ? 'falta' : 'ok'}">${l.tipo === 'saida' ? '− ' : '+ '}${brl(l.valor)}</b><br>${l.pedido ? '<small>vem do pedido</small>' : confirmarBtn('excluir-lanc', l.id, 'Excluir')}</span></div>`).join('') : '<div class="dentro info">Nenhum lançamento neste mês.</div>'}</div>`;
}
function barras(linhas) {
  const max = Math.max(...linhas.map(l => l[1]), 1);
  return `<div class="barras">${linhas.map(([rot, v, txt]) => `<div class="b-lin" title="${esc(rot)}: ${esc(txt)}"><span class="b-rot">${esc(rot)}</span><span class="b-trilho"><i style="width:${v > 0 ? Math.max(2, v / max * 100) : 0}%"></i></span><span class="b-val">${esc(txt)}</span></div>`).join('')}</div>`;
}
function formLanc() {
  const e = S.edit;
  return `<button class="voltar" data-act="cancelar-form">‹ Voltar sem guardar</button><h1>Registrar lançamento</h1><div class="bloco"><div class="dentro">
  ${campo('Tipo', `<select data-f="tipo" data-rerender="1">${opts([['saida','Saída (despesa)'],['entrada','Entrada (fora de pedido)']], e.tipo)}</select>`)}
  <div class="duas">${campo('Valor', inp('valor', e.valor, 'inputmode="decimal"'), 'R$')}${campo('Data', `<input type="date" data-f="data" value="${esc(e.data)}">`)}</div>
  ${campo('Categoria', `<select data-f="categoria">${opts(e.tipo === 'saida' ? CAT_SAIDA : ['Vendas','Outras entradas'], e.categoria)}</select>`)}
  ${campo('Descrição', inp('desc', e.desc, 'maxlength="80"'))}
  <div class="erro" id="erro" role="alert"></div><button class="cta" data-act="salvar-lanc">Guardar lançamento</button></div></div>`;
}

/* ---------- EMPRESAS ---------- */
const totalOrc = o => (o.itens || []).reduce((s, i) => s + num(i.qtd) * num(i.preco), 0);
function telaEmpresas() {
  const l = D.orcamentos.slice().sort((a, b) => (a.criado || '') < (b.criado || '') ? 1 : -1);
  const aprovados = l.filter(o => o.status === 'aprovado'), env = l.filter(o => o.status === 'enviado');
  return `<div class="kpis">${kpi('Orçamentos enviados', env.length, brl(env.reduce((s, o) => s + totalOrc(o), 0)))}${kpi('Aprovados', aprovados.length, brl(aprovados.reduce((s, o) => s + totalOrc(o), 0)))}${kpi('Taxa de aprovação', l.filter(o => o.status !== 'rascunho').length ? pct(aprovados.length / l.filter(o => ['aprovado','recusado','enviado'].includes(o.status)).length * 100) : '—')}</div>
  <button class="cta" data-act="novo-orc">+ Novo orçamento para empresa</button>
  ${l.length ? l.map(o => { const venc = o.validade && o.validade < hoje() && o.status === 'enviado'; return `<div class="bloco cartao"><div class="dentro"><div class="vtopo"><div><div class="rotulo">${esc(o.codigo)} · <span class="tag">${(ST_ORC.find(s => s[0] === o.status) || ST_ORC[0])[1]}</span></div><h3>${esc(o.empresa)}</h3><small class="info">${esc(o.contato || '')}${o.whats ? ' · ' + esc(fone(o.whats)) : ''}</small></div><div class="dir"><div class="preco">${brl(totalOrc(o))}</div><small class="${venc ? 'falta' : 'info'}">${o.validade ? (venc ? 'venceu em ' : 'válido até ') + br(o.validade) : ''}</small></div></div>
  <p class="desc">${(o.itens || []).map(i => esc(num(i.qtd) + ' × ' + ((prod(i.produto) || {}).nome || i.nome || 'item'))).join(' · ')}</p>
  <div class="acoes">${o.whats ? zap({id:'', nome:o.contato || o.empresa, whats:o.whats}, msgOrc(o), 'Enviar pelo WhatsApp', 'orcamento') : ''}${o.status === 'aprovado' && !o.pedido ? `<button class="btn forte" data-act="converter-orc" data-id="${o.id}">Transformar em pedido</button>` : ''}${o.pedido ? `<button class="link" data-act="ver-pedido" data-id="${o.pedido}">Ver pedido</button>` : ''}<button class="link" data-act="editar-orc" data-id="${o.id}">Editar</button>${confirmarBtn('excluir-orc', o.id, 'Excluir')}</div></div></div>`; }).join('') : mascote('lembra', '<b>Nenhum orçamento ainda.</b><span>Brindes de fim de ano pedem de 30 a 45 dias. Para entregar antes do Natal, os orçamentos precisam sair até meados de novembro.</span>')}`;
}
function msgOrc(o) { return texto('orcamento', {nome:o.contato || o.empresa}, {codigo:o.codigo, total:brl(totalOrc(o)), itens:(o.itens || []).map(i => `- ${num(i.qtd)} × ${(prod(i.produto) || {}).nome || i.nome || 'item'}: ${brl(num(i.preco))} cada`).join('\n'), prazo:o.prazo ? o.prazo + ' dias após a aprovação' : 'a combinar', validade:o.validade ? br(o.validade) : 'a combinar'}); }
function novoOrc() { return {_tipo:'orc', _novo:true, id:novoId('o'), codigo:proxCodigo('OR'), empresa:'', contato:'', whats:'', itens:[{produto:'', nome:'', qtd:'10', preco:''}], validade:somaDias(hoje(), 15), prazo:'30', status:'rascunho', obs:'', nf:true, criado:hoje()}; }
function formOrc() {
  const e = S.edit, produtos = D.produtos.filter(p => p.ativo !== false).sort((a, b) => a.nome.localeCompare(b.nome));
  return `<button class="voltar" data-act="cancelar-form">‹ Voltar sem guardar</button><h1>${e._novo ? 'Novo orçamento' : 'Editar orçamento ' + esc(e.codigo)}</h1>
  <div class="bloco"><header><b>Empresa</b></header><div class="dentro">${campo('Empresa', inp('empresa', e.empresa, 'maxlength="60"'))}
  <div class="duas">${campo('Contato', inp('contato', e.contato, 'maxlength="60"'))}${campo('WhatsApp do contato', inp('whats', fone(e.whats), 'inputmode="tel"'))}</div></div></div>
  <div class="bloco"><header><b>Itens</b><button class="link" data-act="add-item-orc">+ Item</button></header><div class="dentro">
  ${e.itens.map((it, n) => `<div class="item-ed"><div class="duas">${campo('Produto', `<select data-f="itens.${n}.produto" data-rerender="1"><option value="">Escolha</option>${produtos.map(p => `<option value="${p.id}" ${it.produto === p.id ? 'selected' : ''}>${esc(p.nome)}</option>`).join('')}</select>`)}<div class="duas">${campo('Qtd', inp(`itens.${n}.qtd`, it.qtd, 'inputmode="numeric"'))}${campo('Preço un.', inp(`itens.${n}.preco`, it.preco, 'inputmode="decimal"'))}</div></div>${e.itens.length > 1 ? `<button class="link" data-act="rm-item-orc" data-n="${n}">Remover item</button>` : ''}</div>`).join('')}
  </div></div>
  <div class="bloco"><header><b>Condições</b></header><div class="dentro"><div class="tres">${campo('Validade', `<input type="date" data-f="validade" value="${esc(e.validade)}">`)}${campo('Prazo de produção', inp('prazo', e.prazo, 'inputmode="numeric"'), 'dias')}${campo('Situação', `<select data-f="status">${opts(ST_ORC, e.status)}</select>`)}</div>
  <label class="opc"><span>Com nota fiscal</span><input type="checkbox" data-f="nf" ${e.nf ? 'checked' : ''}></label>${campo('Anotações', `<textarea data-f="obs" rows="2">${esc(e.obs)}</textarea>`, 'uso de logo, entrega')}<div class="soma" id="resumo"></div></div></div>
  <div class="erro" id="erro" role="alert"></div><button class="cta" data-act="salvar-orc">Guardar orçamento</button>`;
}
function resumoOrcForm() { const r = $('#resumo'); if (!r || !S.edit || S.edit._tipo !== 'orc') return; const o = S.edit, cu = (o.itens || []).reduce((s, i) => { const p = prod(i.produto); return s + num(i.qtd) * (p ? custoProduto(p) : 0); }, 0), t = totalOrc(o), lu = t * (1 - num(C().taxas) / 100) - cu; r.innerHTML = `<div class="total"><span>Total</span><span>${brl(t)}</span></div><div><span>Lucro estimado</span><span class="${lu < 0 ? 'falta' : ''}">${brl(lu)}${t ? ' (' + pct(lu / t * 100) + ')' : ''}</span></div>`; }
function salvarOrc() {
  const e = S.edit; if (!String(e.empresa).trim()) { $('#erro').textContent = 'Informe o nome da empresa.'; return; }
  const o = {...e, empresa:String(e.empresa).trim(), whats:String(e.whats || '').replace(/\D/g, ''), itens:e.itens.filter(i => i.produto || i.nome).map(i => ({produto:i.produto, nome:(prod(i.produto) || {}).nome || i.nome, qtd:num(i.qtd), preco:num(i.preco)}))};
  delete o._tipo; delete o._novo;
  const k = D.orcamentos.findIndex(x => x.id === o.id); if (k >= 0) D.orcamentos[k] = o; else D.orcamentos.push(o);
  salvar(); S.edit = null; ir('empresas');
}
function converterOrc(o) {
  let c = o.whats && D.clientes.find(x => x.whats === o.whats);
  if (!c) { c = novoCliente(); Object.assign(c, {nome:o.contato ? o.contato + ' (' + o.empresa + ')' : o.empresa, whats:o.whats, origem:'Empresa', etiquetas:'empresa'}); delete c._tipo; delete c._novo; D.clientes.push(c); }
  const p = {id:novoId('p'), codigo:proxCodigo(), cliente:c.id, itens:o.itens.map(i => { const pr = prod(i.produto); return {produto:i.produto, nome:i.nome, qtd:num(i.qtd), preco:num(i.preco), obs:'', custo:pr ? custoProduto(pr) : 0}; }), frete:0, desconto:0, entrega:o.prazo ? somaDias(hoje(), num(o.prazo)) : '', local:'', status:'pagamento', obs:'Orçamento ' + o.codigo + (o.nf ? ' · com nota fiscal' : ''), pagamentos:[], criado:hoje(), check:{}};
  D.pedidos.push(p); o.pedido = p.id; salvar(); ir('pedidos', 'pedido', p.id);
}

/* ---------- RELATÓRIOS ---------- */
function telaRelatorios() {
  const ano = S.mes.slice(0,4), ps = D.pedidos.filter(o => o.status !== 'cancelado' && (o.criado || '').slice(0,4) === ano);
  const fat = ps.reduce((s, o) => s + totalPedido(o), 0), lucro = ps.reduce((s, o) => s + totalPedido(o) * (1 - num(C().taxas) / 100) - custoPedido(o), 0);
  const porProd = {}; ps.forEach(o => (o.itens || []).forEach(i => { const k = i.nome || 'item'; const p = porProd[k] = porProd[k] || {qtd:0, rec:0, custo:0}; p.qtd += num(i.qtd); p.rec += num(i.qtd) * num(i.preco); const pr = prod(i.produto); p.custo += num(i.qtd) * (pr ? custoProduto(pr) : num(i.custo)); }));
  const top = Object.entries(porProd).sort((a, b) => b[1].rec - a[1].rec).slice(0, 8);
  const clis = {}; ps.forEach(o => clis[o.cliente] = (clis[o.cliente] || 0) + 1); const nCli = Object.keys(clis).length, rec = Object.values(clis).filter(n => n > 1).length;
  const porMes = Array.from({length:12}, (_, m) => [mesNome(m).slice(0,3), ps.filter(o => Number((o.criado || '').slice(5,7)) === m + 1).reduce((s, o) => s + totalPedido(o), 0)]);
  const orig = {}; D.clientes.forEach(c => { const k = c.origem || 'Não informado'; orig[k] = (orig[k] || 0) + 1; });
  return `<div class="mesnav"><button class="btn" data-act="mes" data-v="${Number(ano) - 1}-${S.mes.slice(5)}">‹</button><b>Ano de ${ano}</b><button class="btn" data-act="mes" data-v="${Number(ano) + 1}-${S.mes.slice(5)}">›</button></div>
  ${ps.length ? `<div class="kpis">${kpi('Vendido no ano', brl(fat))}${kpi('Lucro estimado', brl(lucro), fat ? pct(lucro / fat * 100) + ' de margem' : '')}${kpi('Pedidos', ps.length, 'ticket médio ' + brl(fat / ps.length))}${kpi('Clientes que voltaram', nCli ? pct(rec / nCli * 100) : '—', rec + ' de ' + nCli)}</div>
  <div class="bloco"><header><b>Vendas por mês</b><span>pela data do pedido</span></header><div class="dentro">${barras(porMes.map(([m, v]) => [m, v, brl(v)]))}</div></div>
  <div class="bloco"><header><b>Mais vendidos</b><span>por receita</span></header><div class="dentro">${barras(top.map(([k, v]) => [k, v.rec, brl(v.rec) + ' · ' + v.qtd + ' un.']))}</div></div>
  <div class="bloco"><header><b>Margem por produto</b></header><div class="tabela"><table class="tab"><tr><th>Produto</th><th>Receita</th><th>Custo</th><th>Margem</th></tr>${top.map(([k, v]) => { const m = v.rec ? (v.rec * (1 - num(C().taxas) / 100) - v.custo) / v.rec * 100 : 0; return `<tr><td>${esc(k)}</td><td>${brl(v.rec)}</td><td>${brl(v.custo)}</td><td class="${m < num(C().lucro) / 2 ? 'falta' : ''}">${pct(m)}</td></tr>`; }).join('')}</table></div></div>
  <div class="bloco"><header><b>Como as clientes chegaram</b></header><div class="dentro">${barras(Object.entries(orig).sort((a, b) => b[1] - a[1]).map(([k, v]) => [k, v, v + (v === 1 ? ' cliente' : ' clientes')]))}</div></div>` : mascote('lembra', `<b>Sem pedidos em ${ano}.</b><span>Os relatórios aparecem conforme você registra pedidos.</span>`)}`;
}

/* ---------- AJUSTES ---------- */
function telaAjustes() {
  const c = C(), salvo = (() => { try { return localStorage.getItem(CHAVE + '-backup'); } catch (e) { return null; } })();
  return `<div class="bloco"><header><b>Cópia de segurança</b><span>${salvo ? 'última cópia baixada em ' + br(salvo) : 'nenhuma cópia baixada ainda'}</span></header><div class="dentro">
    <div class="info">Os dados ficam só neste navegador. Baixe uma cópia toda semana e guarde no Google Drive ou no computador. Para usar em outro aparelho, restaure a cópia lá.</div>
    <div class="acoes"><button class="btn forte" data-act="backup">Baixar cópia de segurança</button><label class="btn">Restaurar cópia<input type="file" id="restaurar" accept="application/json,.json" hidden></label><button class="btn" data-act="csv">Baixar pedidos em planilha (CSV)</button></div>
  </div></div>
  <div class="bloco"><header><b>Preço e produção</b></header><div class="dentro">
    <div class="tres">${campo('Despesas fixas', `<input type="text" id="c-fixas" value="${numTxt(c.fixas)}" inputmode="decimal">`, '% do preço')}${campo('Taxas', `<input type="text" id="c-taxas" value="${numTxt(c.taxas)}" inputmode="decimal">`, '% do preço')}${campo('Lucro desejado', `<input type="text" id="c-lucro" value="${numTxt(c.lucro)}" inputmode="decimal">`, '% do preço')}</div>
    <div class="tres">${campo('Valor da sua hora', `<input type="text" id="c-hora" value="${numTxt(c.hora)}" inputmode="decimal">`, 'R$')}${campo('Capacidade', `<input type="text" id="c-cap" value="${numTxt(c.capacidade)}" inputmode="numeric">`, 'peças por dia')}${campo('Prefixo dos pedidos', `<input type="text" id="c-pref" value="${esc(c.prefixo)}" maxlength="4">`)}</div>
    <div class="info">Os percentuais vieram como ponto de partida. Troque pelos da sua planilha de formação de preço.</div>
  </div></div>
  <div class="bloco"><header><b>MEI e contato</b></header><div class="dentro">
    <div class="tres">${campo('Limite anual do MEI', `<input type="text" id="c-lim" value="${numTxt(c.limiteMei)}" inputmode="decimal">`, 'R$')}${campo('Valor do DAS', `<input type="text" id="c-das" value="${numTxt(c.das)}" inputmode="decimal">`, 'R$ por mês')}${campo('Seu WhatsApp', `<input type="text" id="c-whats" value="${esc(fone(c.whats))}" inputmode="tel">`)}</div>
  </div></div>
  <div class="erro" id="erro" role="alert"></div><button class="cta" data-act="salvar-ajustes">Guardar ajustes</button>
  <h2 class="sec">Datas comerciais</h2>
  <div class="bloco">${D.datas.slice().sort((a, b) => a.data < b.data ? -1 : 1).map(d => `<div class="lin"><span>${esc(d.nome)}</span><span>${br(d.data)} ${confirmarBtn('excluir-data', d.id, 'Remover')}</span></div>`).join('')}
  <div class="dentro"><div class="duas">${campo('Nova data', '<input type="text" id="dt-nome" maxlength="40" placeholder="Dia dos Avós">')}${campo('Dia', `<input type="date" id="dt-dia">`)}</div><button class="btn" data-act="add-data">Incluir data</button></div></div>
  <h2 class="sec">Modelos de mensagem</h2>
  <div class="info">Use {nome}, {codigo}, {total}, {saldo}, {entrega}, {rotulo} e {dia}. Eles são trocados pelos dados da cliente e do pedido.</div>
  ${Object.keys(MODELOS_PADRAO).map(k => `<div class="bloco"><header><b>${esc(D.modelos[k][0])}</b>${D.modelos[k][1] !== MODELOS_PADRAO[k][1] ? `<button class="link" data-act="modelo-padrao" data-k="${k}">Voltar ao texto original</button>` : ''}</header><div class="dentro"><textarea rows="3" data-modelo="${k}">${esc(D.modelos[k][1])}</textarea></div></div>`).join('')}
  <h2 class="sec">Dados</h2>
  <div class="bloco"><div class="dentro">${D.exemplo ? `<div class="info">Você está vendo dados de exemplo.</div>${confirmarBtn('limpar', '', 'Apagar todos os dados de exemplo')}` : `<div class="info">Apagar tudo remove produtos, insumos, clientes, pedidos e lançamentos deste navegador. Baixe uma cópia antes.</div>${confirmarBtn('limpar', '', 'Apagar todos os dados')}`}</div></div>`;
}
function baixar(nome, tipo, conteudo) { const b = new Blob([conteudo], {type:tipo}), a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = nome; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); }
function csv() {
  const q = v => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
  const linhas = [['Código','Data','Cliente','WhatsApp','Itens','Total','Pago','Etapa','Entrega'].map(q).join(';')].concat(D.pedidos.map(o => { const c = cli(o.cliente) || {}; return [o.codigo, br(o.criado), c.nome, fone(c.whats), (o.itens || []).map(i => num(i.qtd) + ' x ' + i.nome).join(' | '), String(totalPedido(o).toFixed(2)).replace('.', ','), String(pagoPedido(o).toFixed(2)).replace('.', ','), etNome(o.status), br(o.entrega)].map(q).join(';'); }));
  baixar('pedidos-' + hoje() + '.csv', 'text/csv;charset=utf-8', '﻿' + linhas.join('\n'));
}

/* ---------- dados de exemplo ---------- */
function carregarExemplos() {
  const n = base(); n.exemplo = true; n.config = {...D.config}; n.modelos = D.modelos; n.datas = D.datas; D = n;
  const I = (id, nome, unidade, custo, estoque, minimo) => D.insumos.push({id, nome:nome + ' (exemplo)', unidade, custo, estoque, minimo});
  I('i-caneca','Caneca branca para sublimação','un',9.5,24,12); I('i-papel','Papel de sublimação A4','folha',0.9,60,30); I('i-caixa','Caixa de presente','un',4.2,8,10);
  I('i-fita','Fita de cetim','m',0.8,40,15); I('i-mdf','Chapa de MDF 3 mm','placa',18,3,2); I('i-acrilico','Chaveiro de acrílico','un',2.6,30,20); I('i-choc','Chocolates sortidos','pacote',12,5,4);
  const P = (id, nome, cat, tecnica, preco, tempo, embalagem, ficha, prazo) => D.produtos.push({id, nome:nome + ' (exemplo)', cat, tecnica, preco, tempo, embalagem, ficha:ficha.map(([insumo, qtd]) => ({insumo, qtd})), ativo:true, prazo});
  P('p-caneca','Caneca com nome na caixinha','datas','Sublimação',55,20,1.5,[['i-caneca',1],['i-papel',1],['i-caixa',1],['i-fita',0.6]],3);
  P('p-box','Box aniversário com caneca','datas','Sublimação',99.9,35,2,[['i-caneca',1],['i-papel',1],['i-caixa',1],['i-fita',1],['i-choc',1]],3);
  P('p-padrinho','Caixa convite para padrinhos','casamento','Montagem',79.9,40,2,[['i-caneca',1],['i-papel',1],['i-caixa',1],['i-fita',1.2]],7);
  P('p-mdf','Lembrancinha em MDF (10 un.)','lembrancinhas','Recorte Silhouette',65,60,3,[['i-mdf',0.5],['i-fita',2]],7);
  P('p-chav','Chaveiros de acrílico com foto (10 un.)','lembrancinhas','DTF UV',75,45,2,[['i-acrilico',10]],6);
  P('p-kit','Kit fim de ano para equipe','empresas','Sublimação',89.9,30,2,[['i-caneca',1],['i-papel',1],['i-caixa',1],['i-choc',1]],30);
  const Cl = (id, nome, whats, bairro, origem, aniversario, etiquetas) => D.clientes.push({id, nome:nome + ' (exemplo)', whats, bairro, endereco:'', origem, etiquetas, aniversario, dataRotulo:'', dataDia:'', obs:'', autorizaFoto:true, aceitaMsg:true, contatos:[], criado:hoje()});
  const h = hoje(), aniv = brCurto(somaDias(h, 12));
  Cl('c1','Ana','41900000001','Boqueirão','Instagram',aniv,'mãe'); Cl('c2','Bruna','41900000002','Hauer','Indicação','','noiva'); Cl('c3','Carla','41900000003','São José dos Pinhais','Catálogo','','');
  const Pd = (id, cod, cliente, itens, status, entrega, pago, criado, extra) => { const o = {id, codigo:cod, cliente, itens:itens.map(([p, q]) => { const pr = prod(p); return {produto:p, nome:pr.nome, qtd:q, preco:pr.preco, obs:'', custo:custoProduto(pr)}; }), frete:15, desconto:0, entrega, local:'Entrega', status:'novo', obs:'', pagamentos:[], criado, check:{}, ...extra}; D.pedidos.push(o); if (pago) registrarPagamento(o, pago === 'tudo' ? totalPedido(o) : pago, 'Pix', criado); if (status !== 'novo') { if (['producao','pronto','entregue'].includes(status)) mudarStatus(o, 'producao'); mudarStatus(o, status); } return o; };
  Pd('e1','JF0001','c1',[['p-box',1]],'producao',somaDias(h, 2),'tudo',somaDias(h, -3),{check:{arte:true, separado:true}});
  Pd('e2','JF0002','c2',[['p-padrinho',6]],'arte',somaDias(h, 6),150,somaDias(h, -2));
  Pd('e3','JF0003','c3',[['p-caneca',2],['p-chav',1]],'pagamento',somaDias(h, 5),0,somaDias(h, -1));
  const o4 = Pd('e4','JF0004','c1',[['p-caneca',1]],'entregue',somaDias(h, -6),'tudo',somaDias(h, -12)); o4.entregueEm = somaDias(h, -5);
  D.lancamentos.push({id:'l-ex1', tipo:'saida', categoria:'Insumos', valor:228, data:somaDias(h, -8), desc:'Canecas para sublimação (exemplo)'});
  D.lancamentos.push({id:'l-ex2', tipo:'saida', categoria:'Embalagens', valor:84, data:somaDias(h, -4), desc:'Caixas e fitas (exemplo)'});
  D.orcamentos.push({id:'o-ex1', codigo:'OR0001', empresa:'Empresa exemplo Ltda.', contato:'Rafael', whats:'41900000009', itens:[{produto:'p-kit', nome:prod('p-kit').nome, qtd:25, preco:84.9}], validade:somaDias(h, 10), prazo:30, status:'enviado', obs:'Logo da empresa na caneca', nf:true, criado:somaDias(h, -1)});
  salvar(); ir('hoje');
}

/* ---------- render e eventos ---------- */
function render() {
  if (!app) casca();
  let h;
  if (S.view === 'form' && S.edit) h = ({pedido:formPedido, cliente:formCliente, produto:formProduto, insumo:formInsumo, lanc:formLanc, orc:formOrc})[S.edit._tipo]();
  else if (S.view === 'pedido') h = telaPedido();
  else if (S.view === 'cliente') h = telaCliente();
  else if (S.view === 'importar') h = telaImportar();
  else h = ({hoje:telaHoje, pedidos:telaPedidos, producao:telaProducao, clientes:telaClientes, produtos:telaProdutos, insumos:telaInsumos, financeiro:telaFinanceiro, empresas:telaEmpresas, relatorios:telaRelatorios, ajustes:telaAjustes})[S.aba]();
  if (typeof h === 'string') app.innerHTML = h;
  marcaAbas(); aviso(S.msg || (semArmazenamento ? 'Este navegador não está guardando os dados. Baixe uma cópia de segurança em Ajustes antes de fechar.' : ''));
  resumoPedidoForm(); resumoProdutoForm(); resumoOrcForm();
}
function setPath(obj, path, val) { const ks = path.split('.'); let o = obj; for (let i = 0; i < ks.length - 1; i++) o = o[ks[i]]; o[ks[ks.length - 1]] = val; }
function editar(tipo, obj) { S.edit = {...JSON.parse(JSON.stringify(obj)), _tipo:tipo}; if (tipo === 'pedido') S.edit.itens = S.edit.itens.map(i => ({...i, qtd:String(i.qtd), preco:numTxt(i.preco)})); if (tipo === 'produto') { S.edit.preco = numTxt(S.edit.preco); S.edit.embalagem = numTxt(S.edit.embalagem); S.edit.ficha = S.edit.ficha.length ? S.edit.ficha : [{insumo:'', qtd:'1'}]; } if (tipo === 'insumo') ['custo','estoque','minimo'].forEach(k => S.edit[k] = numTxt(S.edit[k])); if (tipo === 'orc') S.edit.itens = S.edit.itens.map(i => ({...i, qtd:String(i.qtd), preco:numTxt(i.preco)})); S.view = 'form'; render(); window.scrollTo(0, 0); }
function abrirForm(obj) { S.edit = obj; S.view = 'form'; render(); window.scrollTo(0, 0); }

const ACT = {
  'aba': el => { S.busca = ''; ir(el.dataset.aba); },
  'filtro': el => { S.filtro = el.dataset.v; render(); },
  'mes': el => { S.mes = el.dataset.v; render(); },
  'pedir-conf': el => { S.confirmar = el.dataset.conf; render(); },
  'novo-pedido': el => abrirForm(novoPedido(el.dataset.cli)),
  'ver-pedido': el => ir(S.aba === 'hoje' || S.aba === 'producao' || S.aba === 'clientes' || S.aba === 'empresas' ? S.aba : 'pedidos', 'pedido', el.dataset.id),
  'editar-pedido': el => editar('pedido', ped(el.dataset.id)),
  'add-item': () => { S.edit.itens.push(itemVazio()); render(); },
  'rm-item': el => { S.edit.itens.splice(+el.dataset.n, 1); render(); },
  'salvar-pedido': salvarPedido,
  'cancelar-form': () => { const t = S.edit && S.edit._tipo, id = S.edit && S.edit.id; S.edit = null; if (t === 'pedido' && ped(id)) ir(S.aba, 'pedido', id); else if (t === 'cliente' && cli(id)) ir('clientes', 'cliente', id); else ir(S.aba); },
  'avancar': el => { const o = ped(el.dataset.id), i = ET.findIndex(e => e[0] === o.status); mudarStatus(o, ET[i + 1][0]); render(); },
  'pagar': el => { const o = ped(el.dataset.id), v = num($('#pg-valor').value); if (!(v > 0)) { aviso('Informe o valor recebido.'); return; } registrarPagamento(o, v, $('#pg-forma').value, $('#pg-data').value || hoje()); if (o.status === 'pagamento' && saldoPedido(o) === 0) mudarStatus(o, 'arte'); render(); },
  'excluir-pag': el => { const [oid, pid] = el.dataset.id.split(':'), o = ped(oid), p = o.pagamentos.find(x => x.id === pid); o.pagamentos = o.pagamentos.filter(x => x.id !== pid); D.lancamentos = D.lancamentos.filter(l => l.id !== p.lanc); salvar(); S.confirmar = null; render(); },
  'excluir-pedido': el => { const o = ped(el.dataset.id); if (o.baixado) baixaInsumos(o, -1); D.lancamentos = D.lancamentos.filter(l => l.pedido !== o.id); D.pedidos = D.pedidos.filter(x => x.id !== o.id); salvar(); ir('pedidos'); },
  'pos-feito': el => { ped(el.dataset.id).posVenda = true; salvar(); render(); },
  'importar': () => { S.imp = ''; ir('pedidos', 'importar'); },
  'ler-msg': () => { S.imp = $('#imp').value; const e = lerMensagem(S.imp); if (!e) { $('#erro').textContent = 'Não reconheci um pedido do catálogo nessa mensagem. Confira se colou o texto inteiro, ou registre o pedido à mão.'; return; } if (D.pedidos.some(o => o.codigo === e.codigo)) { $('#erro').textContent = 'O pedido ' + e.codigo + ' já foi registrado.'; return; } abrirForm(e); },
  'novo-cliente': () => abrirForm(novoCliente()),
  'ver-cliente': el => ir('clientes', 'cliente', el.dataset.id),
  'editar-cliente': el => editar('cliente', cli(el.dataset.id)),
  'salvar-cliente': salvarCliente,
  'excluir-cliente': el => { const id = el.dataset.id; if (D.pedidos.some(o => o.cliente === id)) { S.confirmar = null; aviso('Esta cliente tem pedidos. Exclua os pedidos antes, ou mantenha o cadastro.'); render(); return; } D.clientes = D.clientes.filter(c => c.id !== id); salvar(); ir('clientes'); },
  'registrar-envio': el => { const c = cli(el.dataset.cli); if (c) { c.contatos = (c.contatos || []).concat({data:hoje(), modelo:el.dataset.mod}).slice(-30); salvar(); } return true; },
  'novo-produto': () => abrirForm(novoProduto()),
  'editar-produto': el => editar('produto', prod(el.dataset.id)),
  'add-ficha': () => { S.edit.ficha.push({insumo:'', qtd:'1'}); render(); },
  'rm-ficha': el => { S.edit.ficha.splice(+el.dataset.n, 1); render(); },
  'usar-sugerido': () => { S.edit.preco = numTxt(Math.ceil(precoSugerido(S.edit) * 10) / 10); render(); },
  'salvar-produto': salvarProduto,
  'excluir-produto': el => { D.produtos = D.produtos.filter(p => p.id !== el.dataset.id); salvar(); S.edit = null; ir('produtos'); },
  'novo-insumo': () => abrirForm(novoInsumo()),
  'editar-insumo': el => editar('insumo', ins(el.dataset.id)),
  'salvar-insumo': salvarInsumo,
  'excluir-insumo': el => { const id = el.dataset.id; D.produtos.forEach(p => p.ficha = (p.ficha || []).filter(f => f.insumo !== id)); D.insumos = D.insumos.filter(i => i.id !== id); salvar(); S.edit = null; ir('insumos'); },
  'abrir-compra': el => { S.view = S.id === el.dataset.id && S.view === 'compra' ? 'lista' : 'compra'; S.id = el.dataset.id; render(); },
  'salvar-compra': el => { const i = ins(el.dataset.id), q = num($('#cp-qtd').value), v = num($('#cp-valor').value); if (!(q > 0)) { $('#erro').textContent = 'Informe a quantidade comprada.'; return; } i.estoque = num(i.estoque) + q; if (v > 0) { if ($('#cp-custo').checked) i.custo = Math.round(v / q * 100) / 100; D.lancamentos.push({id:novoId('l'), tipo:'saida', categoria:'Insumos', valor:v, data:$('#cp-data').value || hoje(), desc:'Compra: ' + i.nome}); } salvar(); S.view = 'lista'; S.id = null; aviso('Compra registrada: ' + numTxt(q) + ' ' + i.unidade + ' de ' + i.nome + '.'); S.msg = ''; render(); },
  'copiar-compras': el => { const t = 'Lista de compras\n' + D.insumos.filter(i => num(i.estoque) <= num(i.minimo)).map(i => '- ' + i.nome + ': ' + numTxt(Math.max(num(i.minimo) * 2 - num(i.estoque), 1)) + ' ' + i.unidade).join('\n'); (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => { el.textContent = 'Copiada'; }).catch(() => aviso(t)); },
  'novo-lanc': () => abrirForm({_tipo:'lanc', id:novoId('l'), tipo:'saida', valor:'', data:hoje(), categoria:'Insumos', desc:''}),
  'salvar-lanc': () => { const e = S.edit; if (!(num(e.valor) > 0)) { $('#erro').textContent = 'Informe o valor.'; return; } D.lancamentos.push({id:e.id, tipo:e.tipo, valor:num(e.valor), data:e.data || hoje(), categoria:e.categoria, desc:e.desc}); salvar(); S.mes = (e.data || hoje()).slice(0,7); S.edit = null; ir('financeiro'); },
  'excluir-lanc': el => { D.lancamentos = D.lancamentos.filter(l => l.id !== el.dataset.id); salvar(); S.confirmar = null; render(); },
  'pagar-das': () => { D.lancamentos.push({id:novoId('l'), tipo:'saida', categoria:'Impostos (DAS)', valor:num(C().das), data:hoje(), desc:'DAS do MEI'}); salvar(); render(); },
  'novo-orc': () => abrirForm(novoOrc()),
  'editar-orc': el => editar('orc', orc(el.dataset.id)),
  'add-item-orc': () => { S.edit.itens.push({produto:'', nome:'', qtd:'10', preco:''}); render(); },
  'rm-item-orc': el => { S.edit.itens.splice(+el.dataset.n, 1); render(); },
  'salvar-orc': salvarOrc,
  'excluir-orc': el => { D.orcamentos = D.orcamentos.filter(o => o.id !== el.dataset.id); salvar(); S.confirmar = null; render(); },
  'converter-orc': el => converterOrc(orc(el.dataset.id)),
  'salvar-ajustes': () => { const c = C(), v = id => num($(id).value); Object.assign(c, {fixas:v('#c-fixas'), taxas:v('#c-taxas'), lucro:v('#c-lucro'), hora:v('#c-hora'), capacidade:v('#c-cap'), limiteMei:v('#c-lim') || 81000, das:v('#c-das'), whats:$('#c-whats').value.replace(/\D/g, ''), prefixo:($('#c-pref').value.trim() || 'JF').toUpperCase()}); if (c.fixas + c.taxas + c.lucro >= 100) { $('#erro').textContent = 'Despesas, taxas e lucro somam 100% ou mais. Reduza algum deles.'; return; } salvar(); aviso('Ajustes guardados.'); },
  'add-data': () => { const n = $('#dt-nome').value.trim(), d = $('#dt-dia').value; if (!n || !d) { aviso('Informe o nome e o dia da data comercial.'); return; } D.datas.push({id:novoId('d'), nome:n, data:d}); salvar(); render(); },
  'excluir-data': el => { D.datas = D.datas.filter(d => d.id !== el.dataset.id); salvar(); S.confirmar = null; render(); },
  'modelo-padrao': el => { D.modelos[el.dataset.k] = MODELOS_PADRAO[el.dataset.k].slice(); salvar(); render(); },
  'backup': () => { baixar('gestao-ju-festas-' + hoje() + '.json', 'application/json', JSON.stringify(D, null, 1)); try { localStorage.setItem(CHAVE + '-backup', hoje()); } catch (e) {} aviso('Cópia baixada. Guarde o arquivo em um lugar seguro.'); },
  'csv': csv,
  'exemplos': carregarExemplos,
  'limpar': () => { const c = D.config, m = D.modelos, d = D.datas; D = base(); D.config = c; D.modelos = m; D.datas = d; salvar(); ir('hoje'); }
};

document.addEventListener('click', ev => {
  const el = ev.target.closest('[data-act]'); if (!el) return;
  const f = ACT[el.dataset.act]; if (!f) return;
  if (el.tagName === 'A') { f(el, ev); return; }
  ev.preventDefault(); f(el, ev);
});
document.addEventListener('input', ev => {
  const t = ev.target;
  if (t.dataset.f && S.edit) { setPath(S.edit, t.dataset.f, t.type === 'checkbox' ? t.checked : t.value); if (t.dataset.rerender) { if (t.dataset.f.endsWith('.produto')) { const n = t.dataset.f.split('.')[1], p = prod(t.value); if (p) S.edit.itens[n].preco = numTxt(p.preco); } render(); } else { resumoPedidoForm(); resumoProdutoForm(); resumoOrcForm(); } return; }
  if (t.dataset.modelo) { D.modelos[t.dataset.modelo][1] = t.value; clearTimeout(t._tm); t._tm = setTimeout(salvar, 400); return; }
  if (t.id === 'busca') { S.busca = t.value; const pos = t.selectionStart; render(); const b = $('#busca'); b.focus(); b.setSelectionRange(pos, pos); return; }
  if (t.id === 'busca-cli') { S.busca = t.value; $('#lista-cli').innerHTML = listaClientes(); }
});
document.addEventListener('change', ev => {
  const t = ev.target;
  if (t.dataset.actChange === 'status') { mudarStatus(ped(t.dataset.id), t.value); render(); }
  if (t.dataset.actChange === 'check') { const o = ped(t.dataset.id); o.check = o.check || {}; o.check[t.dataset.k] = t.checked; salvar(); }
  if (t.id === 'restaurar' && t.files[0]) { const r = new FileReader(); r.onload = () => { try { const d = JSON.parse(r.result); if (!d || !Array.isArray(d.pedidos) || !d.config) throw 0; D = d; carregar0(); salvar(); ir('hoje'); aviso('Cópia restaurada.'); } catch (e) { aviso('Este arquivo não é uma cópia de segurança da Gestão Jú Festas.'); } }; r.readAsText(t.files[0]); }
});
function carregar0() { const b = base(); for (const k of Object.keys(b)) if (D[k] === undefined) D[k] = b[k]; D.config = {...b.config, ...D.config}; }

carregar();
try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) {}
casca(); render();
