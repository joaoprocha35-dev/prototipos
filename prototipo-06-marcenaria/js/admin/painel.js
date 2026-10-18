/**
 * Painel administrativo (demonstração): indicadores do mês, gráficos, projetos e funcionários.
 * Os dados vêm de js/admin/dados.js (fictícios, salvos só no navegador). Todo o conteúdo é
 * recalculado a partir dos dados a cada alteração, então gráficos e indicadores ficam sempre
 * coerentes com as tabelas.
 */
import {
  AMBIENTES, ETAPAS, FUNCOES, STATUS_FUNCIONARIO,
  carregarDados, dadosExemplo, limparDadosSalvos, novoId, salvarDados,
} from './dados.js';
import { barChart, donutChart, horizontalBars } from './graficos.js';

const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
const moedaCompacta = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact', maximumFractionDigits: 0 });
const dataBR = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' });
const mesAno = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' });
const mesNome = new Intl.DateTimeFormat('pt-BR', { month: 'long', timeZone: 'UTC' });
const mesAbreviado = new Intl.DateTimeFormat('pt-BR', { month: 'short', timeZone: 'UTC' });

const $ = (selector, root = document) => root.querySelector(selector);

let dados = carregarDados();
const meses = listaDeMeses();
const estado = {
  mes: meses[meses.length - 1],
  filtroMes: meses[meses.length - 1],
  filtroEtapa: '',
  busca: '',
};

// ---------- Datas ----------
function mesDe(data) {
  return data.slice(0, 7);
}

function dataDoMes(mes) {
  return new Date(`${mes}-01T00:00:00Z`);
}

function rotuloMes(mes) {
  return mesAno.format(dataDoMes(mes));
}

function deslocarMes(mes, delta) {
  const data = dataDoMes(mes);
  data.setUTCMonth(data.getUTCMonth() + delta);
  return data.toISOString().slice(0, 7);
}

/** 12 meses terminando no mais recente entre "hoje" e o último projeto cadastrado. */
function listaDeMeses() {
  const hoje = new Date().toISOString().slice(0, 7);
  const ultimoProjeto = dados.projetos.map((projeto) => mesDe(projeto.data)).sort().pop() || hoje;
  const fim = ultimoProjeto > hoje ? ultimoProjeto : hoje;
  return Array.from({ length: 12 }, (_, i) => deslocarMes(fim, i - 11));
}

// ---------- Consultas ----------
const projetosDoMes = (mes) => dados.projetos.filter((projeto) => mesDe(projeto.data) === mes);
const soma = (lista, campo) => lista.reduce((total, item) => total + Number(item[campo] || 0), 0);
const emAndamento = (projeto) => projeto.etapa !== 'concluido';
const funcionarioPorId = (id) => dados.funcionarios.find((funcionario) => funcionario.id === id);

function variacao(atual, anterior) {
  if (!anterior) return null;
  return Math.round(((atual - anterior) / anterior) * 100);
}

// ---------- Indicadores ----------
function renderKpis() {
  const mes = estado.mes;
  const anterior = deslocarMes(mes, -1);
  const doMes = projetosDoMes(mes);
  const doAnterior = projetosDoMes(anterior);
  const faturamento = soma(doMes, 'valor');
  const faturamentoAnterior = soma(doAnterior, 'valor');
  const nomeAnterior = mesNome.format(dataDoMes(anterior));
  const ativos = dados.funcionarios.filter((f) => f.status === 'ativo').length;
  const ferias = dados.funcionarios.filter((f) => f.status === 'ferias').length;
  const afastados = dados.funcionarios.filter((f) => f.status === 'afastado').length;
  const nomeMes = mesNome.format(dataDoMes(mes));

  const kpis = [
    {
      label: `Faturamento de ${nomeMes}`,
      value: moeda.format(faturamento),
      delta: variacao(faturamento, faturamentoAnterior),
      deltaText: (d) => `${Math.abs(d)}% em relação a ${nomeAnterior}`,
      destaque: true,
    },
    {
      label: `Projetos fechados em ${nomeMes}`,
      value: String(doMes.length),
      delta: doMes.length - doAnterior.length,
      deltaText: (d) => `${Math.abs(d)} ${Math.abs(d) === 1 ? 'projeto' : 'projetos'} em relação a ${nomeAnterior}`,
    },
    {
      label: 'Ticket médio do mês',
      value: doMes.length ? moeda.format(faturamento / doMes.length) : '—',
      meta: 'valor médio por projeto fechado',
    },
    {
      label: 'Projetos em andamento',
      value: String(dados.projetos.filter(emAndamento).length),
      meta: 'da medição à instalação',
    },
    {
      label: 'Funcionários ativos',
      value: `${ativos} de ${dados.funcionarios.length}`,
      meta: `${ferias} de férias · ${afastados} ${afastados === 1 ? 'afastado' : 'afastados'}`,
    },
    {
      label: 'Folha mensal',
      value: moeda.format(soma(dados.funcionarios, 'salario')),
      meta: 'soma dos salários cadastrados',
    },
  ];

  const lista = $('[data-kpis]');
  lista.replaceChildren(...kpis.map((kpi) => {
    const li = document.createElement('li');
    li.className = `kpi card-ref${kpi.destaque ? ' kpi--destaque' : ''}`;
    li.innerHTML = '<p class="kpi__label"></p><p class="kpi__value"></p><p class="kpi__meta"></p>';
    $('.kpi__label', li).textContent = kpi.label;
    $('.kpi__value', li).textContent = kpi.value;
    const meta = $('.kpi__meta', li);
    if (kpi.delta === undefined) {
      meta.textContent = kpi.meta;
    } else if (kpi.delta === null) {
      meta.textContent = 'sem dados do mês anterior';
    } else {
      const sinal = kpi.delta > 0 ? 'up' : kpi.delta < 0 ? 'down' : 'flat';
      meta.classList.add(`is-${sinal}`);
      const seta = { up: '▲', down: '▼', flat: '=' }[sinal];
      meta.innerHTML = `<span aria-hidden="true">${seta}</span> `;
      meta.append(`${sinal === 'down' ? 'Queda de ' : sinal === 'up' ? 'Alta de ' : 'Igual: '}${kpi.deltaText(kpi.delta)}`);
    }
    return li;
  }));

  $('[data-month-title]').textContent = rotuloMes(mes);
  $('[data-month-label]').textContent = rotuloMes(mes);
}

// ---------- Gráficos ----------
function renderGraficos() {
  const valores = meses.map((mes) => soma(projetosDoMes(mes), 'valor'));
  barChart($('[data-chart-revenue]'), {
    labels: meses.map((mes) => mesAbreviado.format(dataDoMes(mes)).replace('.', '')),
    longLabels: meses.map(rotuloMes),
    values: valores,
    highlight: meses.indexOf(estado.mes),
    format: (n) => moeda.format(n),
    axisFormat: (n) => moedaCompacta.format(n),
    caption: `Faturamento mensal de ${rotuloMes(meses[0])} a ${rotuloMes(meses[meses.length - 1])}`,
  });

  const doMes = projetosDoMes(estado.mes);
  donutChart($('[data-chart-ambientes]'), {
    items: Object.entries(AMBIENTES).map(([id, ambiente]) => ({
      label: ambiente.nome,
      value: doMes.filter((projeto) => projeto.ambiente === id).length,
      color: ambiente.cor,
    })),
    total: String(doMes.length),
    totalLabel: doMes.length === 1 ? 'projeto' : 'projetos',
    format: (n) => String(n),
    caption: `Projetos por ambiente em ${rotuloMes(estado.mes)}`,
    empty: 'Nenhum projeto fechado neste mês.',
  });

  horizontalBars($('[data-chart-etapas]'), {
    items: Object.entries(ETAPAS).filter(([id]) => id !== 'concluido').map(([id, etapa]) => ({
      label: etapa.nome,
      value: dados.projetos.filter((projeto) => projeto.etapa === id).length,
      color: etapa.cor,
    })),
    format: (n) => String(n),
  });
}

// ---------- Projetos ----------
function renderProjetos() {
  const busca = estado.busca.trim().toLocaleLowerCase('pt-BR');
  const lista = dados.projetos
    .filter((projeto) => !estado.filtroMes || mesDe(projeto.data) === estado.filtroMes)
    .filter((projeto) => !estado.filtroEtapa || projeto.etapa === estado.filtroEtapa)
    .filter((projeto) => {
      if (!busca) return true;
      const responsavel = funcionarioPorId(projeto.responsavelId)?.nome ?? '';
      return `${projeto.cliente} ${responsavel}`.toLocaleLowerCase('pt-BR').includes(busca);
    })
    .sort((a, b) => b.data.localeCompare(a.data));

  const corpo = $('[data-projects-body]');
  corpo.replaceChildren(...lista.map((projeto) => {
    const tr = document.createElement('tr');
    const etapa = ETAPAS[projeto.etapa] ?? ETAPAS.medicao;
    tr.innerHTML = `
      <td data-label="Cliente" class="admin-table__main"></td>
      <td data-label="Ambiente"></td>
      <td data-label="Valor" class="is-number"></td>
      <td data-label="Fechamento"></td>
      <td data-label="Etapa"><span class="pill"><span class="pill__dot" style="background:${etapa.cor}"></span><span></span></span></td>
      <td data-label="Responsável"></td>
      <td class="admin-table__actions">
        <button class="admin-action" type="button" data-edit-project="${projeto.id}">Editar<span class="visually-hidden"></span></button>
        <button class="admin-action admin-action--danger" type="button" data-delete-project="${projeto.id}">Excluir<span class="visually-hidden"></span></button>
      </td>`;
    const celulas = tr.children;
    celulas[0].textContent = projeto.cliente;
    celulas[1].textContent = AMBIENTES[projeto.ambiente]?.nome ?? projeto.ambiente;
    celulas[2].textContent = moeda.format(projeto.valor);
    celulas[3].textContent = dataBR.format(new Date(`${projeto.data}T00:00:00Z`));
    celulas[4].querySelector('.pill > span:last-child').textContent = etapa.nome;
    celulas[5].textContent = funcionarioPorId(projeto.responsavelId)?.nome ?? '—';
    tr.querySelectorAll('.admin-action .visually-hidden').forEach((span) => { span.textContent = ` projeto de ${projeto.cliente}`; });
    return tr;
  }));

  const total = soma(lista, 'valor');
  $('[data-projects-count]').textContent = `${lista.length} ${lista.length === 1 ? 'projeto' : 'projetos'} · ${moeda.format(total)}`;
  $('[data-projects-empty]').hidden = lista.length > 0;
}

// ---------- Funcionários ----------
function renderFuncionarios() {
  const contagem = (status) => dados.funcionarios.filter((f) => f.status === status).length;
  const resumo = [
    ['Ativos', contagem('ativo'), 'ativo'],
    ['Férias', contagem('ferias'), 'ferias'],
    ['Afastados', contagem('afastado'), 'afastado'],
    ['Folha mensal', moeda.format(soma(dados.funcionarios, 'salario')), ''],
  ];
  $('[data-team-summary]').replaceChildren(...resumo.map(([rotulo, valor, status]) => {
    const li = document.createElement('li');
    li.className = `team-summary__item${status ? ` is-${status}` : ''}`;
    li.innerHTML = '<span></span><strong></strong>';
    li.firstChild.textContent = rotulo;
    li.lastChild.textContent = valor;
    return li;
  }));

  const corpo = $('[data-employees-body]');
  const ordenados = [...dados.funcionarios].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  corpo.replaceChildren(...ordenados.map((funcionario) => {
    const tr = document.createElement('tr');
    const ativos = dados.projetos.filter((p) => p.responsavelId === funcionario.id && emAndamento(p)).length;
    tr.innerHTML = `
      <td data-label="Nome" class="admin-table__main"></td>
      <td data-label="Função"></td>
      <td data-label="Situação"><span class="pill pill--${funcionario.status}"></span></td>
      <td data-label="Admissão"></td>
      <td data-label="Projetos em andamento" class="is-number"></td>
      <td data-label="Salário" class="is-number"></td>
      <td class="admin-table__actions">
        <button class="admin-action" type="button" data-edit-employee="${funcionario.id}">Editar<span class="visually-hidden"></span></button>
        <button class="admin-action admin-action--danger" type="button" data-delete-employee="${funcionario.id}">Excluir<span class="visually-hidden"></span></button>
      </td>`;
    const celulas = tr.children;
    celulas[0].textContent = funcionario.nome;
    celulas[1].textContent = funcionario.funcao;
    celulas[2].firstChild.textContent = STATUS_FUNCIONARIO[funcionario.status] ?? funcionario.status;
    celulas[3].textContent = dataBR.format(new Date(`${funcionario.admissao}T00:00:00Z`));
    celulas[4].textContent = String(ativos);
    celulas[5].textContent = moeda.format(funcionario.salario);
    tr.querySelectorAll('.admin-action .visually-hidden').forEach((span) => { span.textContent = ` ${funcionario.nome}`; });
    return tr;
  }));
}

// ---------- Seletores ----------
function preencherSelect(select, opcoes, selecionado) {
  select.replaceChildren(...opcoes.map(([valor, rotulo]) => new Option(rotulo, valor, false, valor === selecionado)));
}

function renderFiltros() {
  const opcoesMes = [...meses].reverse().map((mes) => [mes, rotuloMes(mes)]);
  preencherSelect($('[data-month-select]'), opcoesMes, estado.mes);
  preencherSelect($('[data-filter-month]'), [['', 'Todos os meses'], ...opcoesMes], estado.filtroMes);
  preencherSelect($('[data-filter-stage]'), [['', 'Todas as etapas'], ...Object.entries(ETAPAS).map(([id, e]) => [id, e.nome])], estado.filtroEtapa);
}

function renderTudo() {
  renderKpis();
  renderGraficos();
  renderProjetos();
  renderFuncionarios();
}

// ---------- Persistência e avisos ----------
let toastTimer = 0;
function avisar(texto) {
  const toast = $('[data-admin-toast]');
  toast.textContent = texto;
  toast.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 3200);
}

function salvar(mensagem) {
  const ok = salvarDados(dados);
  renderTudo();
  avisar(ok ? mensagem : `${mensagem} (não foi possível salvar neste navegador; vale até fechar a página)`);
}

// ---------- Formulários (dialog) ----------
function configurarDialogo(dialog, { opcoes, preencher, ler, validar, aoSalvar }) {
  const form = $('form', dialog);
  const titulo = $('[data-dialog-title]', dialog);
  const erro = $('[data-form-error]', dialog);
  let editando = null;
  let gatilho = null;

  dialog.querySelectorAll('[data-dialog-close]').forEach((botao) => botao.addEventListener('click', () => dialog.close()));
  dialog.addEventListener('close', () => gatilho?.isConnected && gatilho.focus());
  // Clique no fundo escurecido fecha (o formulário ocupa toda a caixa do dialog).
  dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const valores = ler(new FormData(form));
    const mensagemErro = form.checkValidity() ? validar(valores) : 'Preencha todos os campos obrigatórios.';
    erro.hidden = !mensagemErro;
    erro.textContent = mensagemErro || '';
    if (mensagemErro) {
      form.querySelector(':invalid')?.focus();
      return;
    }
    aoSalvar(valores, editando);
    dialog.close();
  });

  return {
    abrir(item, origem, tituloTexto) {
      editando = item;
      gatilho = origem;
      opcoes(form);
      form.reset();
      erro.hidden = true;
      titulo.textContent = tituloTexto;
      preencher(form, item);
      dialog.showModal();
    },
  };
}

const dialogoProjeto = configurarDialogo($('[data-project-dialog]'), {
  opcoes(form) {
    preencherSelect(form.ambiente, Object.entries(AMBIENTES).map(([id, a]) => [id, a.nome]));
    preencherSelect(form.etapa, Object.entries(ETAPAS).map(([id, e]) => [id, e.nome]));
    preencherSelect(form.responsavelId, [['', 'Sem responsável'], ...dados.funcionarios.map((f) => [f.id, `${f.nome} · ${f.funcao}`])]);
  },
  preencher(form, projeto) {
    const hoje = new Date().toISOString().slice(0, 10);
    form.cliente.value = projeto?.cliente ?? '';
    form.ambiente.value = projeto?.ambiente ?? 'cozinha';
    form.valor.value = projeto?.valor ?? '';
    form.data.value = projeto?.data ?? hoje;
    form.etapa.value = projeto?.etapa ?? 'medicao';
    form.responsavelId.value = projeto?.responsavelId ?? '';
  },
  ler: (dadosForm) => ({
    cliente: String(dadosForm.get('cliente')).trim(),
    ambiente: dadosForm.get('ambiente'),
    valor: Number(dadosForm.get('valor')),
    data: String(dadosForm.get('data')),
    etapa: dadosForm.get('etapa'),
    responsavelId: dadosForm.get('responsavelId') || null,
  }),
  validar(valores) {
    if (!valores.cliente) return 'Informe o cliente.';
    if (!(valores.valor > 0)) return 'Informe um valor maior que zero.';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(valores.data)) return 'Informe a data de fechamento.';
    return '';
  },
  aoSalvar(valores, projeto) {
    if (projeto) Object.assign(projeto, valores);
    else dados.projetos.push({ id: novoId('p'), ...valores });
    salvar(projeto ? 'Projeto atualizado.' : 'Projeto cadastrado.');
  },
});

const dialogoFuncionario = configurarDialogo($('[data-employee-dialog]'), {
  opcoes(form) {
    preencherSelect(form.funcao, FUNCOES.map((f) => [f, f]));
    preencherSelect(form.status, Object.entries(STATUS_FUNCIONARIO));
  },
  preencher(form, funcionario) {
    form.nome.value = funcionario?.nome ?? '';
    form.funcao.value = funcionario?.funcao ?? FUNCOES[0];
    form.status.value = funcionario?.status ?? 'ativo';
    form.admissao.value = funcionario?.admissao ?? new Date().toISOString().slice(0, 10);
    form.salario.value = funcionario?.salario ?? '';
  },
  ler: (dadosForm) => ({
    nome: String(dadosForm.get('nome')).trim(),
    funcao: dadosForm.get('funcao'),
    status: dadosForm.get('status'),
    admissao: String(dadosForm.get('admissao')),
    salario: Number(dadosForm.get('salario')),
  }),
  validar(valores) {
    if (!valores.nome) return 'Informe o nome.';
    if (!(valores.salario >= 0)) return 'Informe o salário.';
    return '';
  },
  aoSalvar(valores, funcionario) {
    if (funcionario) Object.assign(funcionario, valores);
    else dados.funcionarios.push({ id: novoId('f'), ...valores });
    salvar(funcionario ? 'Funcionário atualizado.' : 'Funcionário cadastrado.');
  },
});

// ---------- Eventos ----------
$('[data-month-select]').addEventListener('change', (event) => {
  estado.mes = event.target.value;
  estado.filtroMes = estado.mes; // a lista de projetos acompanha o mês de referência
  renderFiltros();
  renderTudo();
});
$('[data-filter-month]').addEventListener('change', (event) => { estado.filtroMes = event.target.value; renderProjetos(); });
$('[data-filter-stage]').addEventListener('change', (event) => { estado.filtroEtapa = event.target.value; renderProjetos(); });
$('[data-filter-search]').addEventListener('input', (event) => { estado.busca = event.target.value; renderProjetos(); });

$('[data-new-project]').addEventListener('click', (event) => dialogoProjeto.abrir(null, event.currentTarget, 'Novo projeto'));
$('[data-new-employee]').addEventListener('click', (event) => dialogoFuncionario.abrir(null, event.currentTarget, 'Novo funcionário'));

$('[data-projects-body]').addEventListener('click', (event) => {
  const editar = event.target.closest('[data-edit-project]');
  const excluir = event.target.closest('[data-delete-project]');
  if (editar) {
    const projeto = dados.projetos.find((p) => p.id === editar.dataset.editProject);
    if (projeto) dialogoProjeto.abrir(projeto, editar, `Editar projeto — ${projeto.cliente}`);
  } else if (excluir) {
    const projeto = dados.projetos.find((p) => p.id === excluir.dataset.deleteProject);
    if (projeto && window.confirm(`Excluir o projeto de ${projeto.cliente}?`)) {
      dados.projetos = dados.projetos.filter((p) => p !== projeto);
      salvar('Projeto excluído.');
      $('[data-new-project]').focus();
    }
  }
});

$('[data-employees-body]').addEventListener('click', (event) => {
  const editar = event.target.closest('[data-edit-employee]');
  const excluir = event.target.closest('[data-delete-employee]');
  if (editar) {
    const funcionario = funcionarioPorId(editar.dataset.editEmployee);
    if (funcionario) dialogoFuncionario.abrir(funcionario, editar, `Editar — ${funcionario.nome}`);
  } else if (excluir) {
    const funcionario = funcionarioPorId(excluir.dataset.deleteEmployee);
    if (!funcionario) return;
    const vinculados = dados.projetos.filter((p) => p.responsavelId === funcionario.id).length;
    const aviso = vinculados ? ` ${vinculados} ${vinculados === 1 ? 'projeto ficará' : 'projetos ficarão'} sem responsável.` : '';
    if (window.confirm(`Excluir ${funcionario.nome}?${aviso}`)) {
      dados.funcionarios = dados.funcionarios.filter((f) => f !== funcionario);
      dados.projetos.forEach((p) => { if (p.responsavelId === funcionario.id) p.responsavelId = null; });
      salvar('Funcionário excluído.');
      $('[data-new-employee]').focus();
    }
  }
});

$('[data-reset-data]').addEventListener('click', () => {
  if (!window.confirm('Restaurar os dados de exemplo? As alterações feitas neste navegador serão perdidas.')) return;
  limparDadosSalvos();
  dados = dadosExemplo();
  salvar('Dados de exemplo restaurados.');
});

// Aba ativa conforme a seção visível.
const abas = [...document.querySelectorAll('[data-admin-tab]')];
if ('IntersectionObserver' in window) {
  const observador = new IntersectionObserver((entradas) => {
    entradas.filter((entrada) => entrada.isIntersecting).forEach((entrada) => {
      abas.forEach((aba) => {
        if (aba.hash === `#${entrada.target.id}`) aba.setAttribute('aria-current', 'true');
        else aba.removeAttribute('aria-current');
      });
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  abas.forEach((aba) => { const alvo = document.querySelector(aba.hash); if (alvo) observador.observe(alvo); });
}

renderFiltros();
renderTudo();
