/**
 * Modelo procedural do guarda-roupa (Three.js), baseado nas referências de
 * public/imagens/etapas-marcenaria/:
 *  - 4 módulos com portas DE CORRER em dois trilhos e perfis metálicos que funcionam como puxadores;
 *  - módulo 1: prateleira alta, cabideiro, prateleira e 4 gavetas; módulos 2 e 3: prateleira alta
 *    e cabideiro com vão longo; módulo 4: prateleiras e 4 gavetas.
 *
 * Acabamentos (decisão do cliente, etapa 4): portas externas em madeira, portas centrais em vidro
 * fumê; estrutura, divisórias, prateleiras e frentes em madeira; fundo e caixas em MDF bege/taupe.
 * Metadados de cada material ficam em js/guarda-roupa-materiais.js; aqui cada malha recebe só o ID.
 *
 * Medidas em metros (ilustrativas, proporcionais às imagens; não são medidas de projeto).
 * Grupos nomeados (inspecionáveis): Estrutura (Laterais, Base, Topo, Fundo), Divisórias,
 * Prateleiras, Cabideiros, Gavetas, Trilhos e Portas. Cada peça pertence a um "componente"
 * lógico (ex.: "Frente da gaveta", "Porta de correr 2 — vidro"), usado na seleção por clique.
 *
 * applyProgress(p) é uma função pura do progresso (0–1): o mesmo p sempre gera a mesma pose e os
 * mesmos materiais, o que garante o estado correto em rolagem reversa, saltos e redimensionamento.
 */
import { MATERIAIS } from './guarda-roupa-materiais.js';

const W = 3.0; // largura total
const H = 2.6; // altura total
const D = 0.6; // profundidade da caixa
const T = 0.018; // espessura do painel
const PLINTH = 0.07; // rodapé
const BACK = 0.006; // fundo
const BAYS = 4;
const BAY_W = (W - 2 * T - (BAYS - 1) * T) / BAYS;
const INNER_BOTTOM = PLINTH + T;
const INNER_TOP = H - T;
const DOOR_H = H - PLINTH - 0.12;
const DOOR_T = 0.022;
const DOOR_W = (W - 2 * T) / BAYS + 0.02; // sobreposição entre portas vizinhas
const GLASS_T = 0.006; // vidro de 6 mm dentro do perfil
const RAIL_BACK_Z = D / 2 + 0.025;
const RAIL_FRONT_Z = D / 2 + 0.055;
const DRAWER_ZONE_TOP = 0.8;

// Escala do veio em metros por repetição da textura (largura × comprimento do veio).
const WOOD_TILE_U = 0.6;
const WOOD_TILE_V = 1.2;
const HIGHLIGHT_COLOR = 0xe8802f;

export const MODEL_SIZE = { width: W, height: H, depth: D };

/** Interpola 0→1 entre a e b, com suavização (smoothstep). */
function phase(p, a, b) {
  const x = Math.min(1, Math.max(0, (p - a) / (b - a)));
  return x * x * (3 - 2 * x);
}

const lerp = (a, b, t) => a + (b - a) * t;

/** Gerador pseudoaleatório determinístico (a mesma semente gera sempre o mesmo resultado). */
function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hexToRgb(hex) {
  const value = parseInt(hex.replace('#', ''), 16);
  return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 };
}

/**
 * Textura procedural de madeira (512 × 1024, repetível nas duas direções): anéis finos e
 * irregulares ao longo do eixo V, faixas claras entre eles e ruído leve de poros.
 * Todas as frequências são inteiras, por isso a emenda da repetição não aparece.
 */
function createWoodCanvas({ base, escuro, claro, seed }) {
  const width = 512;
  const height = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  const image = context.createImageData(width, height);
  const B = hexToRgb(base);
  const E = hexToRgb(escuro);
  const C = hexToRgb(claro);
  const random = seededRandom(seed * 7919);
  const p = Array.from({ length: 6 }, () => random() * Math.PI * 2);
  const TAU = Math.PI * 2;

  for (let y = 0; y < height; y += 1) {
    const fy = y / height;
    // Ondulação leve (o veio de madeira de marcenaria é quase reto).
    const warp = 0.008 * Math.sin(TAU * fy + p[0]) + 0.003 * Math.sin(TAU * 3 * fy + p[1]);
    for (let x = 0; x < width; x += 1) {
      const fx = x / width + warp;
      // Linhas finas (~1,5 cm na escala real) com espaçamento irregular e variação suave entre "réguas".
      const ring = 0.5 + 0.5 * Math.sin(TAU * 40 * fx + 1.2 * Math.sin(TAU * 3 * fx + p[3]) + 0.35 * Math.sin(TAU * 4 * fy + p[4]));
      const fine = 0.5 + 0.5 * Math.sin(TAU * 131 * fx + 0.6 * Math.sin(TAU * 9 * fy + p[5]));
      const band = 0.5 + 0.5 * Math.sin(TAU * 2 * fx + p[2]);
      const dark = 0.24 * ring ** 6 + 0.07 * fine ** 4 + 0.06 * band;
      const light = 0.1 * (1 - ring) ** 2;
      const noise = (random() - 0.5) * 6;
      const index = (y * width + x) * 4;
      image.data[index] = B.r + (E.r - B.r) * dark + (C.r - B.r) * light + noise;
      image.data[index + 1] = B.g + (E.g - B.g) * dark + (C.g - B.g) * light + noise;
      image.data[index + 2] = B.b + (E.b - B.b) * dark + (C.b - B.b) * light + noise;
      image.data[index + 3] = 255;
    }
  }
  context.putImageData(image, 0, 0);

  // Amostra pequena para o painel de informações.
  const sample = document.createElement('canvas');
  sample.width = 96;
  sample.height = 96;
  sample.getContext('2d').drawImage(canvas, 0, 0, 256, 256, 0, 0, 96, 96);
  return { canvas, swatch: sample.toDataURL('image/png') };
}

/**
 * UVs em escala real para caixas de madeira: o veio (eixo V da textura) segue o eixo pedido
 * (vertical em laterais e portas, horizontal em prateleiras e frentes) e cada peça recebe um
 * deslocamento próprio, para que a textura não se repita igual em todos os componentes.
 */
function applyWoodUVs(geometry, grainAxis, random) {
  const position = geometry.attributes.position;
  const uv = geometry.attributes.uv;
  const grain = { x: 0, y: 1, z: 2 }[grainAxis];
  const offsetU = random();
  const offsetV = random();
  const coord = [0, 0, 0];
  for (let i = 0; i < position.count; i += 1) {
    const normalAxis = Math.floor(Math.floor(i / 4) / 2); // faces do BoxGeometry: ±x, ±y, ±z
    const planeAxes = [0, 1, 2].filter((axis) => axis !== normalAxis);
    const vAxis = planeAxes.includes(grain) ? grain : planeAxes[1];
    const uAxis = planeAxes.find((axis) => axis !== vAxis);
    coord[0] = position.getX(i);
    coord[1] = position.getY(i);
    coord[2] = position.getZ(i);
    uv.setXY(i, coord[uAxis] / WOOD_TILE_U + offsetU, coord[vAxis] / WOOD_TILE_V + offsetV);
  }
  uv.needsUpdate = true;
}

/** Aparece/some sem trocar o material: opacidade, transparência e escrita de profundidade. */
function setFade(material, amount) {
  const transparent = amount < 0.999;
  if (material.transparent !== transparent) {
    material.transparent = transparent;
    material.needsUpdate = true;
  }
  material.opacity = amount;
  material.depthWrite = amount > 0.5;
  material.visible = amount > 0.001;
}

export function buildWardrobe(THREE, { anisotropy = 4 } = {}) {
  const disposables = [];
  const track = (item) => { disposables.push(item); return item; };
  const random = seededRandom(20261017);

  // ---------- Materiais (um por ID do catálogo) ----------
  const materials = {};
  const swatches = {};
  Object.entries(MATERIAIS).forEach(([id, meta]) => {
    let material;
    if (meta.categoria === 'madeira') {
      const { canvas, swatch } = createWoodCanvas(meta.visual);
      const texture = track(new THREE.CanvasTexture(canvas));
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.anisotropy = anisotropy;
      material = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.62, metalness: 0 });
      swatches[id] = swatch;
    } else if (meta.categoria === 'vidro') {
      // Vidro físico: opacidade sempre 1; aparência por transmissão, espessura, IOR e atenuação.
      material = new THREE.MeshPhysicalMaterial({
        color: 0xf2f0ec,
        metalness: 0,
        roughness: 0.04,
        transmission: 1,
        thickness: 0.012,
        ior: 1.5,
        attenuationColor: new THREE.Color(0x56524d), // fumê acinzentado
        attenuationDistance: 0.014,
        specularIntensity: 1,
        envMapIntensity: 1.6,
      });
    } else if (meta.categoria === 'ferragens') {
      material = new THREE.MeshStandardMaterial({ color: 0xc8cacc, metalness: 0.85, roughness: 0.3 });
    } else {
      material = new THREE.MeshStandardMaterial({ color: meta.visual.cor, roughness: 0.82 });
    }
    material.name = id;
    materials[id] = track(material);
  });
  const glassMaterial = materials['vidro-fume'];
  const fadeMaterials = Object.values(materials).filter((material) => material !== glassMaterial);

  // "Desenho técnico": arestas em azul profundo (cor estrutural do site).
  const lineMaterial = track(new THREE.LineBasicMaterial({ color: 0x2b211a, transparent: true }));

  const root = new THREE.Group();
  root.name = 'Guarda-roupa';
  const parts = []; // { object, base, explode, order }
  const edges = []; // { lines, count, order }
  const components = new Map(); // chave → { key, nome, materialId, meshes }
  const selectable = [];

  function component(key, nome, materialId) {
    if (!components.has(key)) components.set(key, { key, nome, materialId, meshes: [] });
    return components.get(key);
  }

  function addEdges(mesh, geometry) {
    const edgeGeometry = track(new THREE.EdgesGeometry(geometry));
    const lines = new THREE.LineSegments(edgeGeometry, lineMaterial);
    lines.name = `${mesh.name} (contorno)`;
    lines.raycast = () => {}; // contornos não participam da seleção
    mesh.add(lines);
    edges.push({ lines, count: edgeGeometry.attributes.position.count, order: 0 });
  }

  function register(mesh, materialId, comp) {
    mesh.userData.materialId = materialId;
    mesh.userData.baseMaterial = materials[materialId];
    mesh.userData.componentKey = comp.key;
    comp.meshes.push(mesh);
    selectable.push(mesh);
  }

  /** Caixa com material do catálogo; madeira recebe UV em escala real com o veio no eixo indicado. */
  function box(name, size, position, materialId, parent, comp, grain = 'y') {
    const geometry = track(new THREE.BoxGeometry(size[0], size[1], size[2]));
    if (MATERIAIS[materialId].categoria === 'madeira') applyWoodUVs(geometry, grain, random);
    const mesh = new THREE.Mesh(geometry, materials[materialId]);
    mesh.name = name;
    mesh.position.set(position[0], position[1], position[2]);
    parent.add(mesh);
    register(mesh, materialId, comp);
    addEdges(mesh, geometry);
    return mesh;
  }

  function cylinder(name, radius, length, position, materialId, parent, comp) {
    const geometry = track(new THREE.CylinderGeometry(radius, radius, length, 16));
    const mesh = new THREE.Mesh(geometry, materials[materialId]);
    mesh.name = name;
    mesh.rotation.z = Math.PI / 2;
    mesh.position.set(position[0], position[1], position[2]);
    parent.add(mesh);
    register(mesh, materialId, comp);
    return mesh;
  }

  function group(name, parent = root) {
    const g = new THREE.Group();
    g.name = name;
    parent.add(g);
    return g;
  }

  /** Registra um objeto que se desloca na vista explodida. order define a sequência. */
  function explodable(object, offset, order) {
    parts.push({ object, base: object.position.clone(), explode: new THREE.Vector3(...offset), order });
  }

  const bayCenter = (i) => -W / 2 + T + BAY_W / 2 + i * (BAY_W + T);
  const shelfDepth = D - BACK - 0.03;
  const shelfZ = -D / 2 + BACK + shelfDepth / 2 + 0.005;

  // ---------- Estrutura ----------
  const estrutura = group('Estrutura');
  const laterais = group('Laterais', estrutura);
  const left = box('Lateral esquerda', [T, H, D], [-W / 2 + T / 2, H / 2, 0], 'madeira-natural', laterais,
    component('lateral-esquerda', 'Lateral esquerda', 'madeira-natural'), 'y');
  const right = box('Lateral direita', [T, H, D], [W / 2 - T / 2, H / 2, 0], 'madeira-natural', laterais,
    component('lateral-direita', 'Lateral direita', 'madeira-natural'), 'y');
  explodable(left, [-0.55, 0, 0], 3);
  explodable(right, [0.55, 0, 0], 3);

  const base = group('Base', estrutura);
  box('Base', [W - 2 * T, T, D], [0, PLINTH + T / 2, 0], 'madeira-natural', base,
    component('base', 'Base', 'madeira-natural'), 'x');
  box('Rodapé', [W - 2 * T, PLINTH, T], [0, PLINTH / 2, D / 2 - 0.05], 'madeira-natural', base,
    component('rodape', 'Rodapé', 'madeira-natural'), 'x');
  explodable(base, [0, 0, 0.32], 3);

  const topo = group('Topo', estrutura);
  box('Topo', [W - 2 * T, T, D], [0, H - T / 2, 0], 'madeira-natural', topo,
    component('topo', 'Topo', 'madeira-natural'), 'x');
  box('Sanca frontal', [W - 2 * T, 0.09, T], [0, H - 0.045, D / 2 + 0.07], 'madeira-natural', topo,
    component('sanca', 'Sanca frontal', 'madeira-natural'), 'x');
  explodable(topo, [0, 0.5, 0], 3);

  const fundo = group('Fundo', estrutura);
  box('Fundo', [W - 2 * T, H - PLINTH - 2 * T, BACK], [0, (H + PLINTH) / 2, -D / 2 + BACK / 2], 'mdf-taupe', fundo,
    component('fundo', 'Fundo', 'mdf-taupe'));
  explodable(fundo, [0, 0, -0.5], 3);

  // ---------- Divisórias ----------
  const divisorias = group('Divisórias');
  for (let i = 1; i < BAYS; i += 1) {
    const x = -W / 2 + T + i * BAY_W + (i - 0.5) * T;
    const divider = box(`Divisória ${i}`, [T, INNER_TOP - INNER_BOTTOM, shelfDepth],
      [x, (INNER_TOP + INNER_BOTTOM) / 2, shelfZ], 'madeira-clara', divisorias,
      component(`divisoria-${i}`, `Divisória ${i}`, 'madeira-clara'), 'y');
    explodable(divider, [0, 0, 0.22], 2);
  }

  // ---------- Prateleiras ----------
  const prateleiras = group('Prateleiras');
  const shelvesByBay = [
    [2.14, DRAWER_ZONE_TOP + T / 2],
    [2.1],
    [2.1],
    [DRAWER_ZONE_TOP + T / 2, 1.1, 1.4, 1.7, 2.0, 2.28],
  ];
  shelvesByBay.forEach((heights, bay) => heights.forEach((y, n) => {
    const shelf = box(`Prateleira m${bay + 1}-${n + 1}`, [BAY_W - 0.002, T, shelfDepth],
      [bayCenter(bay), y, shelfZ], 'madeira-clara', prateleiras,
      component(`prateleira-m${bay + 1}-${n + 1}`, `Prateleira (módulo ${bay + 1})`, 'madeira-clara'), 'x');
    explodable(shelf, [0, 0, 0.42], 1);
  }));

  // ---------- Cabideiros ----------
  const cabideiros = group('Cabideiros');
  [0, 1, 2].forEach((bay) => {
    const rod = cylinder(`Cabideiro m${bay + 1}`, 0.012, BAY_W - 0.01,
      [bayCenter(bay), bay === 0 ? 2.03 : 1.99, shelfZ + 0.02], 'aluminio', cabideiros,
      component(`cabideiro-m${bay + 1}`, `Cabideiro (módulo ${bay + 1})`, 'aluminio'));
    explodable(rod, [0, 0.12, 0.34], 1);
  });

  // ---------- Gavetas (conjuntos completos: frente, caixa e puxador) ----------
  const gavetas = group('Gavetas');
  const drawerSlot = (DRAWER_ZONE_TOP - INNER_BOTTOM) / 4;
  [0, 3].forEach((bay) => {
    for (let n = 0; n < 4; n += 1) {
      const id = `gaveta-m${bay + 1}-${n + 1}`;
      const label = `gaveta ${n + 1} (módulo ${bay + 1})`;
      const drawer = group(`Gaveta m${bay + 1}-${n + 1}`, gavetas);
      drawer.position.set(bayCenter(bay), INNER_BOTTOM + drawerSlot * (n + 0.5), 0);
      const frontH = drawerSlot - 0.014;
      const frontW = BAY_W - 0.012;
      const boxDepth = shelfDepth - 0.06;
      const boxH = frontH - 0.05;
      const frontZ = D / 2 - 0.035;
      const caixa = component(`${id}-caixa`, `Caixa da ${label}`, 'mdf-taupe');
      box('Frente', [frontW, frontH, T], [0, 0, frontZ], 'madeira-frentes', drawer,
        component(`${id}-frente`, `Frente da ${label}`, 'madeira-frentes'), 'x');
      box('Lateral', [0.012, boxH, boxDepth], [-frontW / 2 + 0.03, -0.015, frontZ - boxDepth / 2], 'mdf-taupe', drawer, caixa);
      box('Lateral', [0.012, boxH, boxDepth], [frontW / 2 - 0.03, -0.015, frontZ - boxDepth / 2], 'mdf-taupe', drawer, caixa);
      box('Traseira', [frontW - 0.06, boxH, 0.012], [0, -0.015, frontZ - boxDepth], 'mdf-taupe', drawer, caixa);
      box('Fundo da gaveta', [frontW - 0.06, 0.006, boxDepth], [0, -0.015 - boxH / 2, frontZ - boxDepth / 2], 'mdf-taupe', drawer, caixa);
      box('Puxador', [0.22, 0.012, 0.014], [0, frontH / 2 - 0.018, frontZ + T / 2 + 0.007], 'aluminio', drawer,
        component(`${id}-puxador`, `Puxador da ${label}`, 'aluminio'));
      explodable(drawer, [0, 0, 0.62 + n * 0.04], 1);
    }
  });

  // ---------- Trilhos ----------
  const trilhos = group('Trilhos');
  const topRail = box('Trilho superior', [W - 2 * T, 0.05, 0.09], [0, H - 0.1, D / 2 + 0.04], 'aluminio', trilhos,
    component('trilho-superior', 'Trilho superior das portas de correr', 'aluminio'));
  const bottomRail = box('Trilho inferior', [W - 2 * T, 0.02, 0.09], [0, PLINTH + 0.01, D / 2 + 0.04], 'aluminio', trilhos,
    component('trilho-inferior', 'Trilho inferior das portas de correr', 'aluminio'));
  explodable(topRail, [0, 0.42, 0.3], 0);
  explodable(bottomRail, [0, 0, 0.5], 0);

  // ---------- Portas de correr: madeira (externas) e vidro fumê (centrais) ----------
  const portas = group('Portas');
  const glassPanes = [];
  const doors = [0, 1, 2, 3].map((i) => {
    const isGlass = i === 1 || i === 2;
    const number = i + 1;
    const door = group(`Porta ${number} (${isGlass ? 'vidro fumê' : 'madeira'})`, portas);
    const onBackRail = i % 2 === 0;
    door.position.set(-W / 2 + T + ((W - 2 * T) / BAYS) * (i + 0.5), PLINTH + 0.03 + DOOR_H / 2, onBackRail ? RAIL_BACK_Z : RAIL_FRONT_Z);

    if (isGlass) {
      const pane = box('Vidro', [DOOR_W - 0.034, DOOR_H - 0.034, GLASS_T], [0, 0, 0], 'vidro-fume', door,
        component(`porta-${number}-vidro`, `Porta de correr ${number} — vidro`, 'vidro-fume'));
      glassPanes.push(pane);
    } else {
      box('Painel', [DOOR_W - 0.03, DOOR_H - 0.03, DOOR_T * 0.6], [0, 0, 0], 'madeira-natural', door,
        component(`porta-${number}-painel`, `Porta de correr ${number} — painel de madeira`, 'madeira-natural'), 'y');
    }
    const perfis = component(`porta-${number}-perfis`, `Perfis-puxadores da porta ${number}`, 'aluminio');
    box('Perfil-puxador', [0.022, DOOR_H, DOOR_T], [-DOOR_W / 2 + 0.011, 0, 0], 'aluminio', door, perfis);
    box('Perfil-puxador', [0.022, DOOR_H, DOOR_T], [DOOR_W / 2 - 0.011, 0, 0], 'aluminio', door, perfis);
    box('Perfil superior', [DOOR_W, 0.016, DOOR_T], [0, DOOR_H / 2 - 0.008, 0], 'aluminio', door, perfis);
    box('Perfil inferior', [DOOR_W, 0.016, DOOR_T], [0, -DOOR_H / 2 + 0.008, 0], 'aluminio', door, perfis);
    const spread = (i - 1.5) * 0.28;
    explodable(door, [spread, 0.05, 1.05 + (onBackRail ? 0 : 0.18)], 0);
    return { object: door };
  });

  // Ordem dos contornos para o "desenho" progressivo: estrutura primeiro, portas por último.
  const orderByGroup = { Estrutura: 0, 'Divisórias': 1, Prateleiras: 2, Cabideiros: 2, Gavetas: 3, Trilhos: 4, Portas: 5 };
  edges.forEach((edge) => {
    let object = edge.lines.parent;
    while (object && object.parent !== root) object = object.parent;
    edge.order = orderByGroup[object?.name] ?? 2;
  });

  // ---------- Ambiente (parede marrom e piso claro, como nas referências) ----------
  const room = new THREE.Group();
  room.name = 'Ambiente';
  const wallMaterial = track(new THREE.MeshStandardMaterial({ color: 0x8c7260, roughness: 0.92 }));
  const floorMaterial = track(new THREE.MeshStandardMaterial({ color: 0xe9e0d3, roughness: 0.5 }));
  // Parede e piso largos: no computador o canvas cobre a tela inteira (sem bordas aparentes).
  // (vista inclinada da etapa 03 incluída: as bordas ficam fora do quadro.)
  const wall = new THREE.Mesh(track(new THREE.PlaneGeometry(200, 30)), wallMaterial);
  wall.position.set(0, 15, -D / 2 - 0.04);
  const floor = new THREE.Mesh(track(new THREE.PlaneGeometry(200, 60)), floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, -0.002, -D / 2 + 30);
  room.add(wall, floor);

  // ---------- Destaque de seleção (variantes com brilho laranja, sem trocar o material base) ----------
  const variants = new Map(); // material base → { hover, selected }
  const highlighted = new Set();
  let hoverKey = null;
  let selectedKey = null;

  function syncVariant(baseMaterial, variant) {
    if (variant.transparent !== baseMaterial.transparent) {
      variant.transparent = baseMaterial.transparent;
      variant.needsUpdate = true;
    }
    variant.opacity = baseMaterial.opacity;
    variant.depthWrite = baseMaterial.depthWrite;
    variant.visible = baseMaterial.visible;
  }

  function variantFor(baseMaterial, level) {
    if (!variants.has(baseMaterial)) variants.set(baseMaterial, {});
    const entry = variants.get(baseMaterial);
    if (!entry[level]) {
      const variant = track(baseMaterial.clone());
      variant.emissive = new THREE.Color(HIGHLIGHT_COLOR);
      variant.emissiveIntensity = level === 'selected' ? 0.32 : 0.16;
      entry[level] = variant;
    }
    syncVariant(baseMaterial, entry[level]);
    return entry[level];
  }

  function paint(key) {
    const comp = components.get(key);
    if (!comp) return;
    const level = key === selectedKey ? 'selected' : key === hoverKey ? 'hover' : null;
    comp.meshes.forEach((mesh) => {
      mesh.material = level ? variantFor(mesh.userData.baseMaterial, level) : mesh.userData.baseMaterial;
    });
    if (level) highlighted.add(key);
    else highlighted.delete(key);
  }

  function setHighlight({ hover = hoverKey, selected = selectedKey } = {}) {
    const affected = new Set([hoverKey, selectedKey, hover, selected]);
    hoverKey = hover;
    selectedKey = selected;
    affected.forEach((key) => key && paint(key));
  }

  /** Pose e materiais do modelo para o progresso p da narrativa. */
  function applyProgress(p) {
    // 0–25%: desenho técnico — contornos desenhados em sequência.
    const draw = 0.12 + 0.88 * phase(p, 0.01, 0.22);
    const lineOpacity = 1 - phase(p, 0.3, 0.5);
    lineMaterial.opacity = lineOpacity;
    edges.forEach((edge) => {
      const start = edge.order / 6;
      const local = Math.min(1, Math.max(0, (draw - start * 0.8) / 0.35));
      const visible = Math.floor((edge.count * local) / 2) * 2;
      edge.lines.geometry.setDrawRange(0, visible);
      edge.lines.visible = lineOpacity > 0.01 && visible > 0;
    });

    // 25–50%: volume, madeira e ambiente aparecem (madeira já nítida no fim da etapa 02).
    const surface = phase(p, 0.25, 0.4);
    fadeMaterials.forEach((material) => setFade(material, surface));
    const roomAmount = phase(p, 0.27, 0.42);
    setFade(wallMaterial, roomAmount);
    setFade(floorMaterial, roomAmount);
    room.visible = roomAmount > 0.001;

    // Fim do projeto: portas deslizam nos trilhos mostrando o interior (mecanismo de correr).
    const slide = phase(p, 0.36, 0.45) * (1 - phase(p, 0.49, 0.56));
    // 50–75%: vista explodida em sequência; 75–90%: montagem na ordem inversa.
    const explodeAt = (order) => {
      const out = phase(p, 0.5 + order * 0.035, 0.62 + order * 0.035);
      const back = phase(p, 0.76 + (3 - order) * 0.03, 0.82 + (3 - order) * 0.03);
      return out * (1 - back);
    };
    parts.forEach(({ object, base: origin, explode, order }) => {
      const amount = explodeAt(order);
      object.position.set(origin.x + explode.x * amount, origin.y + explode.y * amount, origin.z + explode.z * amount);
    });
    doors.forEach(({ object }, i) => {
      if (i === 0) object.position.x += slide * DOOR_W * 0.94; // porta 1 corre por trás da 2
      if (i === 3) object.position.x -= slide * DOOR_W * 0.94; // porta 4 corre pela frente da 3
    });

    // Instalação: os vidros entram nos perfis das portas centrais (opacidade sempre 1).
    glassPanes.forEach((pane, k) => {
      const install = phase(p, 0.82 + k * 0.03, 0.9 + k * 0.03);
      pane.visible = p >= 0.8;
      pane.position.set(0, (1 - install) * 0.12, (1 - install) * 0.5);
    });

    highlighted.forEach((key) => components.get(key).meshes.forEach((mesh) => {
      if (mesh.material !== mesh.userData.baseMaterial) syncVariant(mesh.userData.baseMaterial, mesh.material);
    }));

    return { surface, lineOpacity, roomAmount };
  }

  /** Peças de exemplo de cada categoria, na ordem em que os botões "Madeira/Vidro/Ferragens" percorrem. */
  const FEATURED = {
    madeira: ['lateral-esquerda', 'divisoria-2', 'prateleira-m4-3', 'gaveta-m1-2-frente', 'porta-1-painel'],
    vidro: ['porta-2-vidro', 'porta-3-vidro'],
    ferragens: ['porta-2-perfis', 'trilho-superior', 'cabideiro-m2', 'gaveta-m4-1-puxador'],
    mdf: ['fundo', 'gaveta-m1-1-caixa'],
  };

  function dispose() {
    disposables.forEach((item) => item.dispose());
  }

  return {
    root,
    room,
    applyProgress,
    dispose,
    selectable,
    swatches,
    setHighlight,
    getComponent(key) {
      const comp = components.get(key);
      return comp ? { key: comp.key, nome: comp.nome, materialId: comp.materialId } : null;
    },
    componentsByCategory(categoria) {
      return (FEATURED[categoria] || []).filter((key) => components.has(key));
    },
    groups: { estrutura, divisorias, prateleiras, cabideiros, gavetas, trilhos, portas },
    counts: { doors: doors.length, glass: glassPanes.length, components: components.size, edges: edges.length },
  };
}

/** Pose de câmera (ângulo horizontal, elevação, fator de distância) por progresso. */
const CAMERA_KEYS = [
  { p: 0, theta: 0, phi: 0.03, dist: 1.0 },
  { p: 0.22, theta: 0, phi: 0.03, dist: 1.0 },
  { p: 0.45, theta: 0.52, phi: 0.1, dist: 1.0 },
  { p: 0.6, theta: 0.8, phi: 0.2, dist: 1.28 },
  { p: 0.72, theta: 0.8, phi: 0.2, dist: 1.28 },
  { p: 0.9, theta: 0.38, phi: 0.08, dist: 1.0 },
  { p: 1, theta: 0.32, phi: 0.07, dist: 0.98 },
];

export function cameraPoseAt(p) {
  for (let i = 1; i < CAMERA_KEYS.length; i += 1) {
    const a = CAMERA_KEYS[i - 1];
    const b = CAMERA_KEYS[i];
    if (p <= b.p) {
      const t = phase(p, a.p, b.p);
      return { theta: lerp(a.theta, b.theta, t), phi: lerp(a.phi, b.phi, t), dist: lerp(a.dist, b.dist, t) };
    }
  }
  const last = CAMERA_KEYS[CAMERA_KEYS.length - 1];
  return { theta: last.theta, phi: last.phi, dist: last.dist };
}

/** Opacidade da grade de "prancheta" e da sombra de contato por progresso. */
export function stagingAt(p) {
  return {
    grid: 0.5 * (1 - phase(p, 0.25, 0.45)),
    shadow: 0.5 * phase(p, 0.28, 0.45),
  };
}
