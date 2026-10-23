/**
 * Menu mobile: abertura/fechamento acessível, ícone com MorphSVG e entrada dos links.
 *
 * O CSS (responsive.css) controla a visibilidade do painel por [data-state]; o GSAP só
 * acrescenta o morph do ícone e a cascata dos links. Sem GSAP, o menu funciona igual.
 */
import { MOTION, getMotionTools, prefersReducedMotion } from './gsap-config.js';

const DESKTOP_QUERY = '(min-width: 1080px)';

/**
 * @returns {{close: () => void, isOpen: () => boolean} | null}
 */
export function initMobileMenu() {
  const toggle = document.querySelector('[data-menu-toggle]');
  const panel = toggle && document.getElementById(toggle.getAttribute('aria-controls'));
  if (!toggle || !panel) {
    console.warn('[Pinson] Menu mobile não encontrado no HTML.');
    return null;
  }

  const header = toggle.closest('[data-site-header]');
  const iconPath = toggle.querySelector('[data-menu-icon]');
  const items = panel.querySelectorAll('.site-nav__list li, .site-nav__cta');
  const desktopQuery = window.matchMedia(DESKTOP_QUERY);
  let open = false;

  function setOpen(nextOpen, { returnFocus = false } = {}) {
    if (nextOpen === open) return;
    open = nextOpen;

    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    panel.dataset.state = open ? 'open' : 'closed';
    header?.classList.toggle('is-menu-open', open);

    animateIcon(iconPath, open);
    animateItems(items, open);

    if (returnFocus) toggle.focus();
  }

  toggle.addEventListener('click', () => setOpen(!open));

  document.addEventListener('keydown', (event) => {
    if (open && event.key === 'Escape') setOpen(false, { returnFocus: true });
  });

  // Clique fora do painel fecha o menu.
  document.addEventListener('click', (event) => {
    if (open && !panel.contains(event.target) && !toggle.contains(event.target)) setOpen(false);
  });

  // Ao passar para o layout desktop, o painel deixa de existir: garante estado fechado.
  desktopQuery.addEventListener('change', (event) => {
    if (event.matches) setOpen(false);
  });

  return {
    close: () => setOpen(false),
    isOpen: () => open,
  };
}

/** Troca o ícone entre hambúrguer e "X". overwrite evita desalinhamento em cliques rápidos. */
function animateIcon(path, open) {
  if (!path) return;
  const shape = open ? path.dataset.shapeOpen : path.dataset.shapeClosed;
  const tools = getMotionTools();

  if (!tools?.hasMorphSVG || prefersReducedMotion()) {
    tools?.gsap.killTweensOf(path);
    path.setAttribute('d', shape);
    return;
  }

  tools.gsap.to(path, {
    morphSVG: shape,
    duration: MOTION.duration.menuIcon,
    ease: MOTION.ease.transition,
    overwrite: true,
  });
}

/** Cascata curta dos links ao abrir. Ao fechar, limpa estilos para nunca deixar itens invisíveis. */
function animateItems(items, open) {
  const tools = getMotionTools();
  if (!tools) return;
  const { gsap } = tools;

  gsap.killTweensOf(items);
  if (!open || prefersReducedMotion()) {
    gsap.set(items, { clearProps: 'opacity,visibility,transform' });
    return;
  }

  gsap.from(items, {
    y: 12,
    autoAlpha: 0,
    duration: MOTION.duration.menuItems,
    ease: MOTION.ease.reveal,
    stagger: MOTION.stagger.menuItems,
    clearProps: 'opacity,visibility,transform',
  });
}
