/**
 * Marquee contínuo (faixa de parceiros no fim da seção Sobre).
 *
 * - A lista original continua no HTML e é a única lida por leitores de tela; as cópias que
 *   fecham o loop são decorativas (aria-hidden + inert).
 * - O movimento é uma animação CSS (transform) de exatamente uma lista de largura, por isso a
 *   emenda não aparece. Há cópias suficientes para cobrir telas largas.
 * - Pausa com mouse sobre a faixa, com foco dentro dela ou pelo botão (WCAG 2.2.2).
 * - Com movimento reduzido ou sem JavaScript, a faixa fica estática (itens quebram em linhas).
 */
import { prefersReducedMotion } from './gsap-config.js';

const SPEED = 55; // px por segundo

export function initMarquees(root = document) {
  return [...root.querySelectorAll('[data-marquee]')].map(setupMarquee);
}

function setupMarquee(marquee) {
  const track = marquee.querySelector('[data-marquee-track]');
  const list = marquee.querySelector('[data-marquee-list]');
  const toggle = marquee.querySelector('[data-marquee-toggle]');
  if (!track || !list) return null;

  if (prefersReducedMotion()) {
    if (toggle) toggle.hidden = true;
    return null;
  }

  function build() {
    track.querySelectorAll('[data-marquee-clone]').forEach((clone) => clone.remove());
    const listWidth = list.getBoundingClientRect().width;
    if (!listWidth) return;
    const copies = Math.max(1, Math.ceil(marquee.clientWidth / listWidth));
    for (let i = 0; i < copies; i += 1) {
      const clone = list.cloneNode(true);
      clone.removeAttribute('data-marquee-list');
      clone.setAttribute('data-marquee-clone', '');
      clone.setAttribute('aria-hidden', 'true');
      clone.inert = true;
      track.append(clone);
    }
    track.style.setProperty('--marquee-shift', `${listWidth}px`);
    track.style.setProperty('--marquee-duration', `${(listWidth / SPEED).toFixed(2)}s`);
  }

  build();
  marquee.classList.add('is-running');
  let lastWidth = marquee.clientWidth;
  new ResizeObserver(() => {
    if (Math.abs(marquee.clientWidth - lastWidth) < 2) return;
    lastWidth = marquee.clientWidth;
    build();
  }).observe(marquee);
  document.fonts?.ready.then(build);

  toggle?.addEventListener('click', () => {
    const paused = marquee.classList.toggle('is-paused');
    toggle.setAttribute('aria-pressed', String(paused));
    toggle.setAttribute('aria-label', paused ? 'Retomar a faixa de parceiros' : 'Pausar a faixa de parceiros');
  });
  return marquee;
}
