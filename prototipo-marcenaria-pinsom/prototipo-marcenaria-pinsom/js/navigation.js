/**
 * Navegação interna: rolagem animada até as seções, histórico (hash), foco,
 * item ativo do menu e estado visual do header.
 *
 * Um único controlador de rolagem por navegação:
 *  - movimento reduzido → deslocamento imediato;
 *  - GSAP + ScrollToPlugin → tween em window (cancelável);
 *  - sem GSAP → scrollTo nativo com behavior "smooth".
 *
 * Rolagem suave da roda do mouse (initSmoothWheel): o mesmo tween em window, redirecionado a
 * cada giro. A rolagem continua NATIVA (window.scrollY) — por isso não usamos o ScrollSmoother,
 * que move o conteúdo com transform e quebraria o palco sticky das etapas e a foto final.
 * Toque, teclado e barra de rolagem não são alterados.
 */
import { MOTION, getMotionTools, prefersReducedMotion } from './gsap-config.js';

/** Interações manuais que interrompem uma rolagem programática em andamento. */
const INTERRUPT_EVENTS = ['wheel', 'touchstart', 'keydown'];

let header = null;
let activeTween = null;
let wheelTween = null;
let wheelTarget = 0;
let pendingScrollEnd = null;
let hooks = { beforeNavigate: () => {}, onArrive: () => {} };

/**
 * @param {{beforeNavigate?: Function, onArrive?: (section: HTMLElement) => void}} options
 */
export function initNavigation(options = {}) {
  header = document.querySelector('[data-site-header]');
  hooks = { ...hooks, ...options };

  // O histórico é tratado em handlePopState; a restauração automática disputaria a rolagem.
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  document.addEventListener('click', handleAnchorClick);
  window.addEventListener('popstate', handlePopState);
  INTERRUPT_EVENTS.forEach((type) => window.addEventListener(type, cancelNavigation, { passive: true }));

  initActiveSection();
  initHeaderState();
  initSmoothWheel();
}

/** Intercepta apenas links internos válidos com clique primário, sem teclas modificadoras. */
function handleAnchorClick(event) {
  if (event.defaultPrevented || event.button !== 0) return;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

  const link = event.target.closest('a[href^="#"]');
  if (!link) return;

  const target = getSectionFromHash(link.hash);
  if (!target) return;

  event.preventDefault();
  navigateTo(target, { updateHistory: true });
}

function handlePopState() {
  const target = getSectionFromHash(location.hash) || document.getElementById('inicio');
  if (target) navigateTo(target, { updateHistory: false });
}

function getSectionFromHash(hash) {
  const id = decodeURIComponent((hash || '').slice(1));
  return id ? document.getElementById(id) : null;
}

/**
 * Rola até a seção considerando a altura atual do header.
 * @param {HTMLElement} target
 * @param {{updateHistory?: boolean, focus?: boolean}} options
 */
export function navigateTo(target, { updateHistory = true, focus = true } = {}) {
  hooks.beforeNavigate();
  cancelNavigation();

  if (updateHistory && location.hash !== `#${target.id}`) {
    history.pushState(null, '', `#${target.id}`);
  }

  scrollToY(getTargetY(target), () => {
    if (focus) focusTarget(target);
    hooks.onArrive(target);
  });
}

/**
 * Controlador único de rolagem programática do site (menu, âncoras e cards das etapas).
 * Cancela a rolagem anterior, respeita movimento reduzido e é interrompido por interação manual.
 * @param {number} y posição de destino (px)
 * @param {Function} [onComplete] chamado ao chegar (não é chamado se interrompido)
 */
export function scrollToY(y, onComplete = () => {}) {
  cancelNavigation();
  stopSmoothWheel();
  const finish = () => {
    activeTween = null;
    onComplete();
  };

  const tools = getMotionTools();
  const distance = Math.abs(window.scrollY - y);

  if (prefersReducedMotion() || distance < 2) {
    window.scrollTo(0, y);
    finish();
    return;
  }

  if (tools?.hasScrollTo) {
    const { navMin, navMax } = MOTION.duration;
    const duration = Math.min(navMax, navMin + distance / 5000);
    activeTween = tools.gsap.to(window, {
      duration,
      ease: MOTION.ease.transition,
      // onAutoKill pertence ao objeto scrollTo; no nível do tween seria lido como valor de propriedade.
      scrollTo: { y, autoKill: true, onAutoKill: () => { activeTween = null; } },
      onComplete: finish,
    });
    return;
  }

  // Sem GSAP: rolagem suave nativa via JavaScript (o CSS não usa scroll-behavior: smooth).
  window.scrollTo({ top: y, behavior: 'smooth' });
  if ('onscrollend' in window) {
    pendingScrollEnd = finish;
    window.addEventListener('scrollend', handleNativeScrollEnd, { once: true });
  } else {
    finish();
  }
}

function handleNativeScrollEnd() {
  const callback = pendingScrollEnd;
  pendingScrollEnd = null;
  callback?.();
}

/** Interrompe a navegação atual, mantendo a página onde estiver (estado sempre válido). */
export function cancelNavigation() {
  if (activeTween) {
    activeTween.kill();
    activeTween = null;
  }
  if (pendingScrollEnd) {
    window.removeEventListener('scrollend', handleNativeScrollEnd);
    pendingScrollEnd = null;
  }
}

// ---------- Rolagem suave da roda do mouse ----------
const WHEEL_QUERY = '(pointer: fine) and (prefers-reduced-motion: no-preference)';
const LINE_HEIGHT = 40; // px por "linha" (Firefox informa a roda em linhas)

function initSmoothWheel() {
  const tools = getMotionTools();
  if (!tools?.hasScrollTo) return; // sem GSAP: rolagem nativa
  const query = window.matchMedia(WHEEL_QUERY);
  const { duration, ease, multiplier } = MOTION.wheel;

  window.addEventListener('wheel', (event) => {
    if (!query.matches || event.defaultPrevented || event.ctrlKey) return; // ctrl + roda = zoom
    if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return; // gesto lateral (carrosséis)
    const delta = normalizeWheel(event);
    if (!delta || scrollsInside(event.target, delta)) return; // listas e painéis com rolagem própria

    event.preventDefault();
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    if (!wheelTween) wheelTarget = window.scrollY; // retoma de onde a página está
    wheelTarget = Math.max(0, Math.min(maxScroll, wheelTarget + delta * multiplier));
    wheelTween = tools.gsap.to(window, {
      duration,
      ease,
      overwrite: true,
      // autoKill: barra de rolagem, teclado ou toque assumem a rolagem no meio do caminho.
      scrollTo: { y: wheelTarget, autoKill: true, onAutoKill: () => { wheelTween = null; } },
      onComplete: () => { wheelTween = null; },
    });
  }, { passive: false });
}

function stopSmoothWheel() {
  if (!wheelTween) return;
  wheelTween.kill();
  wheelTween = null;
}

function normalizeWheel(event) {
  const limit = window.innerHeight;
  let delta = event.deltaY;
  if (event.deltaMode === 1) delta *= LINE_HEIGHT;
  else if (event.deltaMode === 2) delta *= limit;
  return Math.max(-limit, Math.min(limit, delta));
}

/** true se algum ancestral do alvo ainda pode rolar nessa direção (ele recebe a roda nativa). */
function scrollsInside(target, delta) {
  for (let node = target instanceof Element ? target : null; node && node !== document.body; node = node.parentElement) {
    const { overflowY } = getComputedStyle(node);
    if (!/(auto|scroll)/.test(overflowY) || node.scrollHeight <= node.clientHeight) continue;
    if (delta > 0 ? node.scrollTop + node.clientHeight < node.scrollHeight - 1 : node.scrollTop > 0) return true;
  }
  return false;
}

function getTargetY(target) {
  if (target.id === 'inicio') return 0;
  const headerHeight = header ? header.offsetHeight : 0;
  const y = target.getBoundingClientRect().top + window.scrollY - headerHeight;
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  return Math.max(0, Math.min(Math.round(y), maxScroll));
}

/** Move o foco para a seção de destino sem provocar nova rolagem. */
function focusTarget(target) {
  if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
  target.focus({ preventScroll: true });
}

/** Marca o link da seção visível (classe visual + aria-current para leitores de tela). */
function initActiveSection() {
  const links = [...document.querySelectorAll('[data-nav-link]')];
  const linkById = new Map(links.map((link) => [link.hash.slice(1), link]));
  const sections = [...linkById.keys()].map((id) => document.getElementById(id)).filter(Boolean);
  if (!sections.length || !('IntersectionObserver' in window)) return;

  const setActive = (id) => {
    links.forEach((link) => {
      const isActive = link.hash.slice(1) === id;
      link.classList.toggle('is-active', isActive);
      if (isActive) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
  };

  // Faixa estreita no meio da tela: a seção que a cruza é a atual.
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) setActive(entry.target.id);
      else if (linkById.get(entry.target.id)?.classList.contains('is-active')) setActive(null);
    });
  }, { rootMargin: '-45% 0px -50% 0px' });

  sections.forEach((section) => observer.observe(section));
}

/** Header transparente sobre a Hero e sólido após o início da rolagem. */
function initHeaderState() {
  if (!header) return;
  let ticking = false;
  const update = () => {
    ticking = false;
    header.classList.toggle('is-solid', window.scrollY > 24);
  };
  window.addEventListener('scroll', () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }, { passive: true });
  update();
}
