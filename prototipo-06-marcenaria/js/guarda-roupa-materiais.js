/**
 * Materiais do guarda-roupa 3D — metadados centralizados e editáveis.
 *
 * As malhas do modelo guardam apenas o ID do material (mesh.userData.materialId); nome,
 * acabamento, descrição e amostra são lidos daqui pelo painel de inspeção.
 *
 * IMPORTANTE: o projeto ainda não tem especificação confirmada (espécie ou padrão da madeira,
 * linha de MDF, fornecedor, tipo de vidro ou ferragens). Os textos abaixo são rótulos honestos
 * de protótipo e devem ser substituídos quando houver especificação real.
 *
 * "visual" orienta a renderização: madeiras usam textura procedural (base/escuro/claro/seed);
 * os demais usam uma cor de amostra.
 */

export const CATEGORIAS = {
  madeira: 'Madeira',
  vidro: 'Vidro',
  ferragens: 'Ferragens',
  mdf: 'MDF',
};

export const AVISO_PROTOTIPO = 'Acabamento ilustrativo do protótipo — especificação a confirmar no projeto.';

export const MATERIAIS = {
  'madeira-natural': {
    categoria: 'madeira',
    nome: 'Madeira natural',
    acabamento: 'Tom natural quente, veio discreto',
    descricao: 'Estrutura externa (laterais, topo e base) e portas de madeira. Valoriza o volume do móvel e conversa com o interior bege.',
    visual: { base: '#b08d69', escuro: '#7f6046', claro: '#c8aa87', seed: 3 },
  },
  'madeira-clara': {
    categoria: 'madeira',
    nome: 'Madeira clara',
    acabamento: 'Tom claro, veio suave',
    descricao: 'Divisórias e prateleiras. O tom mais claro deixa o interior iluminado e fácil de organizar.',
    visual: { base: '#cbb497', escuro: '#a98f71', claro: '#ddcab0', seed: 11 },
  },
  'madeira-frentes': {
    categoria: 'madeira',
    nome: 'Madeira natural — frentes',
    acabamento: 'Tom natural, veio na horizontal',
    descricao: 'Frentes das gavetas, com o veio acompanhando a largura de cada frente.',
    visual: { base: '#b9966f', escuro: '#8a6a4d', claro: '#cfb18f', seed: 7 },
  },
  'mdf-taupe': {
    categoria: 'mdf',
    nome: 'MDF bege/taupe',
    acabamento: 'Fosco liso',
    descricao: 'Fundo do móvel e caixas internas das gavetas, em tom neutro que deixa a madeira em evidência.',
    visual: { cor: '#d8c9b3' },
  },
  'vidro-fume': {
    categoria: 'vidro',
    nome: 'Vidro fumê',
    acabamento: 'Transparente com tom fumê e reflexo suave',
    descricao: 'Painéis das duas portas centrais. Deixam o interior aparecer de leve e refletem a luz do ambiente.',
    visual: { cor: 'linear-gradient(135deg, #5f5953 0%, #8c857c 45%, #c9c3ba 52%, #6d665f 60%, #4f4a45 100%)' },
  },
  aluminio: {
    categoria: 'ferragens',
    nome: 'Perfis e trilhos metálicos',
    acabamento: 'Metal acetinado claro',
    descricao: 'Perfis-puxadores das portas de correr, trilhos superior e inferior, cabideiros e puxadores das gavetas.',
    visual: { cor: 'linear-gradient(135deg, #9da0a3 0%, #e4e6e8 45%, #b9bcbf 60%, #8e9194 100%)' },
  },
};
