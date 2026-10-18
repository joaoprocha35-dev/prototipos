/**
 * Inspeção de materiais do guarda-roupa 3D.
 *
 * - Desktop: hover destaca a peça de leve e mostra o cursor de clique.
 * - Clique ou toque: seleciona a peça (Raycaster em guarda-roupa-3d.js) e abre o painel com
 *   componente, material, amostra e descrição (textos de js/guarda-roupa-materiais.js).
 * - Toque x rolagem: só conta como seleção um toque curto e quase parado; arrastar ou rolar
 *   (pointercancel) não seleciona nada. O canvas usa touch-action: pan-y.
 * - Botões "Madeira", "Vidro" e "Ferragens" usam o mesmo sistema (teclado e toque, sem precisar
 *   acertar a peça no canvas); cada clique percorre as peças de exemplo daquela categoria.
 * - Fechar: botão visível ou tecla Escape (o foco volta ao botão que abriu o painel).
 */
import { AVISO_PROTOTIPO, MATERIAIS } from './guarda-roupa-materiais.js';

const TAP_DISTANCE = 8; // px
const TAP_TIME = 700; // ms

export function initWardrobeInspection({ controller, wardrobe, status }) {
  const tools = wardrobe?.querySelector('[data-material-tools]');
  if (!controller || !tools) return null;

  const panel = tools.querySelector('[data-material-panel]');
  const swatch = panel.querySelector('[data-material-swatch]');
  const fields = {
    component: panel.querySelector('[data-material-component]'),
    name: panel.querySelector('[data-material-name]'),
    finish: panel.querySelector('[data-material-finish]'),
    description: panel.querySelector('[data-material-desc]'),
    note: panel.querySelector('[data-material-note]'),
  };
  const closeButton = panel.querySelector('[data-material-close]');
  const chips = [...tools.querySelectorAll('[data-material-category]')];
  const canvas = controller.canvas;
  const cycle = {};
  let selectedKey = null;
  let hoverKey = null;
  let trigger = null;

  tools.hidden = false;

  function open(key, opener = null) {
    const info = controller.getComponentInfo(key);
    const material = info && MATERIAIS[info.materialId];
    if (!material) return;
    trigger = opener;
    selectedKey = key;
    controller.setSelected(key);

    fields.component.textContent = info.nome;
    fields.name.textContent = material.nome;
    fields.finish.textContent = material.acabamento;
    fields.description.textContent = material.descricao;
    fields.note.textContent = AVISO_PROTOTIPO;
    const texture = controller.swatchFor(info.materialId);
    swatch.style.background = texture ? `center / cover url("${texture}")` : material.visual.cor;
    panel.hidden = false;
    chips.forEach((chip) => chip.setAttribute('aria-pressed', String(chip.dataset.materialCategory === material.categoria)));
    if (status) status.textContent = `Selecionado: ${info.nome} — ${material.nome}. ${material.acabamento}.`;
  }

  function close({ restoreFocus = false } = {}) {
    if (panel.hidden) return;
    panel.hidden = true;
    selectedKey = null;
    controller.setSelected(null);
    chips.forEach((chip) => chip.setAttribute('aria-pressed', 'false'));
    if (restoreFocus && trigger?.isConnected) trigger.focus();
    trigger = null;
  }

  // ---------- Hover (somente mouse) ----------
  let hoverFrame = 0;
  let lastMove = null;
  function updateHover() {
    hoverFrame = 0;
    if (!lastMove) return;
    const key = controller.pickAt(lastMove.clientX, lastMove.clientY);
    if (key !== hoverKey) {
      hoverKey = key;
      controller.setHover(key);
    }
    canvas.style.cursor = key ? 'pointer' : '';
  }
  canvas.addEventListener('pointermove', (event) => {
    if (event.pointerType !== 'mouse') return;
    lastMove = event;
    if (!hoverFrame) hoverFrame = requestAnimationFrame(updateHover);
  });
  canvas.addEventListener('pointerleave', () => {
    lastMove = null;
    hoverKey = null;
    controller.setHover(null);
    canvas.style.cursor = '';
  });

  // ---------- Clique / toque (distingue de arraste e rolagem) ----------
  let press = null;
  canvas.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    press = { id: event.pointerId, x: event.clientX, y: event.clientY, time: performance.now() };
  });
  canvas.addEventListener('pointercancel', () => { press = null; });
  canvas.addEventListener('pointerup', (event) => {
    if (!press || event.pointerId !== press.id) return;
    const moved = Math.hypot(event.clientX - press.x, event.clientY - press.y);
    const quick = performance.now() - press.time < TAP_TIME;
    press = null;
    if (moved > TAP_DISTANCE || !quick) return;
    const key = controller.pickAt(event.clientX, event.clientY);
    if (key) open(key);
    else close();
  });

  // ---------- Botões acessíveis por categoria ----------
  chips.forEach((chip) => chip.addEventListener('click', () => {
    const category = chip.dataset.materialCategory;
    const keys = controller.componentsByCategory(category);
    if (!keys.length) return;
    cycle[category] = ((cycle[category] ?? -1) + 1) % keys.length;
    open(keys[cycle[category]], chip);
  }));

  closeButton.addEventListener('click', () => close({ restoreFocus: true }));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !panel.hidden) close({ restoreFocus: true });
  });

  return { open, close, getSelected: () => selectedKey };
}
