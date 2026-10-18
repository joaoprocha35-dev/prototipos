/**
 * Dados do painel administrativo (DEMONSTRAÇÃO).
 *
 * Tudo aqui é fictício: clientes, valores, funcionários e salários existem só para mostrar o
 * painel funcionando. Não há servidor nesta fase — as edições ficam salvas apenas no navegador
 * de quem usa (localStorage). "Restaurar dados de exemplo" volta ao conjunto inicial.
 *
 * Projeto:     { id, cliente, ambiente, valor, data (AAAA-MM-DD, fechamento), etapa, responsavelId }
 * Funcionário: { id, nome, funcao, status, admissao (AAAA-MM-DD), salario }
 */

const STORAGE_KEY = 'pinson-admin-demo-v1';

/** Ambientes = serviços documentados no site público. */
export const AMBIENTES = {
  cozinha: { nome: 'Cozinha planejada', cor: '#a4703f' },
  quarto: { nome: 'Quarto e closet', cor: '#e8802f' },
  sala: { nome: 'Sala e painel de TV', cor: '#5f4330' },
  'home-office': { nome: 'Home office', cor: '#cdb79a' },
};

/** Etapas = as mesmas da seção "Como funciona", mais "Concluído". */
export const ETAPAS = {
  medicao: { nome: 'Conversa e medição', cor: '#cdb79a' },
  projeto: { nome: 'Projeto e aprovação', cor: '#e8802f' },
  fabricacao: { nome: 'Fabricação', cor: '#a4703f' },
  instalacao: { nome: 'Instalação', cor: '#5f4330' },
  concluido: { nome: 'Concluído', cor: '#1a7f45' },
};

export const STATUS_FUNCIONARIO = {
  ativo: 'Ativo',
  ferias: 'Férias',
  afastado: 'Afastado',
};

export const FUNCOES = ['Marceneiro', 'Montador', 'Projetista', 'Auxiliar de produção', 'Administrativo'];

// ---------- Conjunto de exemplo (determinístico: sempre os mesmos números) ----------
const FUNCIONARIOS_EXEMPLO = [
  { id: 'f1', nome: 'Carlos Menezes', funcao: 'Marceneiro', status: 'ativo', admissao: '2015-03-02', salario: 4800 },
  { id: 'f2', nome: 'Rafael Souza', funcao: 'Marceneiro', status: 'ativo', admissao: '2019-08-12', salario: 4200 },
  { id: 'f3', nome: 'Juliana Prado', funcao: 'Projetista', status: 'ativo', admissao: '2021-02-01', salario: 5200 },
  { id: 'f4', nome: 'Diego Almeida', funcao: 'Montador', status: 'ativo', admissao: '2020-05-18', salario: 3600 },
  { id: 'f5', nome: 'Marcos Vieira', funcao: 'Montador', status: 'ferias', admissao: '2022-09-05', salario: 3400 },
  { id: 'f6', nome: 'Thiago Ramos', funcao: 'Auxiliar de produção', status: 'ativo', admissao: '2024-01-15', salario: 2400 },
  { id: 'f7', nome: 'Patrícia Lopes', funcao: 'Administrativo', status: 'ativo', admissao: '2018-06-11', salario: 3900 },
  { id: 'f8', nome: 'André Castro', funcao: 'Marceneiro', status: 'afastado', admissao: '2017-11-20', salario: 4300 },
];

const CLIENTES = [
  'Ana P.', 'Bruno M.', 'Carla S.', 'Daniel R.', 'Elisa T.', 'Fábio L.', 'Gabriela N.', 'Henrique C.',
  'Isabela F.', 'João V.', 'Karina D.', 'Lucas A.', 'Mariana G.', 'Natália B.', 'Otávio P.', 'Paula E.',
  'Renata O.', 'Sérgio H.', 'Tatiane M.', 'Vinícius Q.', 'Yasmin R.', 'Wagner S.', 'Beatriz K.', 'Caio J.',
];

const FAIXA_VALOR = { cozinha: [18000, 46000], quarto: [12000, 34000], sala: [8000, 22000], 'home-office': [6000, 15000] };
/** Quantidade de projetos fechados por mês (nov/2025 → out/2026). */
const PROJETOS_POR_MES = [5, 6, 4, 5, 6, 7, 6, 8, 7, 8, 9, 11];
const RESPONSAVEIS = ['f1', 'f2', 'f3', 'f4', 'f5', 'f8'];

function seededRandom(seed) {
  let value = seed;
  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296;
    return value / 4294967296;
  };
}

function projetosExemplo() {
  const random = seededRandom(1982);
  const ambientes = Object.keys(AMBIENTES);
  const projetos = [];
  let n = 0;
  PROJETOS_POR_MES.forEach((quantidade, mesIndex) => {
    const ano = mesIndex < 2 ? 2025 : 2026;
    const mes = ((10 + mesIndex) % 12) + 1; // 11, 12, 1, 2 … 10
    const ultimoDia = mesIndex === PROJETOS_POR_MES.length - 1 ? 17 : 28; // outubro/2026 vai até hoje
    for (let i = 0; i < quantidade; i += 1) {
      const ambiente = ambientes[Math.floor(random() * ambientes.length)];
      const [min, max] = FAIXA_VALOR[ambiente];
      const valor = Math.round((min + random() * (max - min)) / 100) * 100;
      const dia = 1 + Math.floor(random() * ultimoDia);
      const idadeMeses = PROJETOS_POR_MES.length - 1 - mesIndex;
      projetos.push({
        id: `p${(n += 1)}`,
        cliente: CLIENTES[(mesIndex * 5 + i * 7) % CLIENTES.length],
        ambiente,
        valor,
        data: `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`,
        etapa: etapaPorIdade(idadeMeses, random()),
        responsavelId: RESPONSAVEIS[Math.floor(random() * RESPONSAVEIS.length)],
      });
    }
  });
  return projetos;
}

/** Projetos mais antigos já foram concluídos; os do mês atual ainda estão no começo. */
function etapaPorIdade(idadeMeses, sorte) {
  if (idadeMeses >= 3) return 'concluido';
  if (idadeMeses === 2) return sorte < 0.6 ? 'concluido' : 'instalacao';
  if (idadeMeses === 1) return sorte < 0.5 ? 'fabricacao' : 'instalacao';
  return sorte < 0.45 ? 'medicao' : sorte < 0.85 ? 'projeto' : 'fabricacao';
}

export function dadosExemplo() {
  return {
    projetos: projetosExemplo(),
    funcionarios: FUNCIONARIOS_EXEMPLO.map((funcionario) => ({ ...funcionario })),
  };
}

// ---------- Armazenamento local (pode falhar em janela privada: o painel segue em memória) ----------
export function carregarDados() {
  try {
    const salvo = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (salvo && Array.isArray(salvo.projetos) && Array.isArray(salvo.funcionarios)) return salvo;
  } catch { /* sem acesso ao armazenamento: usa o conjunto de exemplo */ }
  return dadosExemplo();
}

export function salvarDados(dados) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dados));
    return true;
  } catch {
    return false;
  }
}

export function limparDadosSalvos() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch { /* nada a limpar */ }
}

export function novoId(prefixo) {
  const aleatorio = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefixo}-${aleatorio}`;
}
