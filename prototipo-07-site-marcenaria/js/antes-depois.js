/**
 * Comparador antes/depois (um por ambiente: cozinha e escritório).
 *
 * --compare-pos é a posição do divisor (0–100%, a partir da esquerda). A camada "Depois"
 * fica à direita do divisor: arrastar para a esquerda revela mais da cozinha planejada.
 * As imagens nunca são redimensionadas — só o clip-path da camada muda.
 *
 * O texto falado pelo leitor de tela usa data-compare-subject (ex.: "da cozinha planejada").
 *
 * Pontos de material ([data-hotspot], só no lado "Depois"): cada ponto aparece apenas quando a
 * camada "Depois" o descobre (data-x > posição do divisor). Clique/toque abre o cartão com o
 * nome e o material; no mouse o hover também mostra. Escape ou clique fora fecham. Um ponto
 * coberto pelo divisor fica com visibility: hidden (some também da ordem de Tab).
 *
 * Entradas: ponteiro (mouse/toque/caneta) no quadro e input range (teclado/leitores de tela).
 * No toque, o arraste só começa com gesto horizontal; o vertical continua rolando a página.
 */

const DRAG_THRESHOLD = 6; // px antes de decidir entre arraste horizontal e rolagem
const LABEL_EDGE = 14; // % a partir da borda em que o rótulo daquele lado some
const HOTSPOT_MARGIN = 1.5; // % — o ponto some um pouco antes de o divisor encostar nele

export function initBeforeAfter(root = document.querySelector('[data-compare]')) {
  if (!root) return;

  const range = root.querySelector('[data-compare-range]');
  const labelBefore = root.querySelector('[data-compare-label="before"]');
  const labelAfter = root.querySelector('[data-compare-label="after"]');
  const subject = root.dataset.compareSubject || 'do ambiente planejado';
  const hotspots = [...root.querySelectorAll('[data-hotspot]')].map((element) => ({
    element,
    x: Number(element.dataset.x),
    button: element.querySelector('button'),
    open: false,
  }));
  let position = Number(range?.value ?? 75);
  let frameRequest = 0;
  let gesture = null; // { id, startX, startY, dragging }

  function render() {
    frameRequest = 0;
    root.style.setProperty('--compare-pos', `${position}%`);
    labelBefore?.classList.toggle('is-hidden', position < LABEL_EDGE);
    labelAfter?.classList.toggle('is-hidden', position > 100 - LABEL_EDGE);
    if (range) {
      range.value = String(Math.round(position));
      range.setAttribute('aria-valuetext', `${Math.round(100 - position)}% ${subject} visível`);
    }
    hotspots.forEach((spot) => {
      const covered = spot.x < position + HOTSPOT_MARGIN;
      spot.element.classList.toggle('is-hidden', covered);
      if (covered && spot.open) setOpen(spot, false);
    });
  }

  function setOpen(spot, open) {
    spot.open = open;
    spot.element.classList.toggle('is-open', open);
    spot.button.setAttribute('aria-expanded', String(open));
  }

  function setPosition(value) {
    position = Math.min(100, Math.max(0, value));
    if (!frameRequest) frameRequest = requestAnimationFrame(render);
  }

  function positionFromPointer(clientX) {
    const rect = root.getBoundingClientRect();
    return ((clientX - rect.left) / rect.width) * 100;
  }

  function startDrag(event) {
    gesture.dragging = true;
    root.classList.add('is-dragging');
    root.setPointerCapture(event.pointerId);
    setPosition(positionFromPointer(event.clientX));
  }

  function endGesture() {
    gesture = null;
    root.classList.remove('is-dragging');
  }

  root.addEventListener('pointerdown', (event) => {
    // Pontos de material são botões: não iniciam arraste nem movem o divisor.
    if (event.button !== 0 || event.target.closest('[data-hotspot]')) return;
    gesture = { id: event.pointerId, startX: event.clientX, startY: event.clientY, dragging: false };
    // Mouse arrasta imediatamente; toque e caneta aguardam a direção do gesto.
    if (event.pointerType === 'mouse') {
      event.preventDefault();
      startDrag(event);
    }
  });

  root.addEventListener('pointermove', (event) => {
    if (!gesture || event.pointerId !== gesture.id) return;
    if (gesture.dragging) {
      setPosition(positionFromPointer(event.clientX));
      return;
    }
    const dx = Math.abs(event.clientX - gesture.startX);
    const dy = Math.abs(event.clientY - gesture.startY);
    if (dx > DRAG_THRESHOLD && dx > dy) startDrag(event);
  });

  root.addEventListener('pointerup', (event) => {
    if (!gesture || event.pointerId !== gesture.id) return;
    // Toque simples (sem deslocamento) também posiciona o divisor; um gesto vertical não.
    const moved = Math.hypot(event.clientX - gesture.startX, event.clientY - gesture.startY);
    if (!gesture.dragging && moved <= DRAG_THRESHOLD) setPosition(positionFromPointer(event.clientX));
    endGesture();
  });

  // Rolagem vertical assumida pelo navegador gera pointercancel: apenas encerra o gesto.
  // (Não usar lostpointercapture: no toque, setPointerCapture sobre a captura implícita o dispara.)
  root.addEventListener('pointercancel', endGesture);

  range?.addEventListener('input', () => setPosition(Number(range.value)));

  hotspots.forEach((spot) => spot.button.addEventListener('click', () => {
    const next = !spot.open;
    hotspots.forEach((other) => { if (other !== spot && other.open) setOpen(other, false); });
    setOpen(spot, next);
  }));
  if (hotspots.length) {
    // Clique fora (inclusive num ponto do outro comparador) fecha o cartão aberto deste.
    document.addEventListener('click', (event) => {
      hotspots.forEach((spot) => { if (spot.open && !spot.element.contains(event.target)) setOpen(spot, false); });
    });
    root.addEventListener('keydown', (event) => {
      const open = hotspots.find((spot) => spot.open);
      if (event.key !== 'Escape' || !open) return;
      setOpen(open, false);
      open.button.focus();
    });
  }

  render();
}
