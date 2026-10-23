/**
 * Serviços ("Marcenaria pensada para a sua rotina"):
 *
 * 1. Carrossel de cards: faixa horizontal com scroll-snap (arraste nativo no toque e no trackpad)
 *    e setas que avançam um card por vez. Sem JavaScript, a faixa continua rolável.
 * 2. Carrossel de fotos em cada card: troca a cada 3 s com transição suave, setas pequenas e
 *    indicadores. Pausa com o mouse sobre o card, com foco dentro dele, com a aba oculta, com o
 *    carrossel fora da tela ou pelo botão "Pausar fotos" (WCAG 2.2.2). Com movimento reduzido,
 *    não há troca automática (as setas continuam funcionando).
 *
 * Um único temporizador atende todos os carrosséis e só roda com a seção visível.
 * Para adicionar uma foto: inclua outro <figure data-photo-slide> no card (ver README).
 */
import { prefersReducedMotion } from './gsap-config.js';

const INTERVAL = 3000; // ms entre fotos
const TICK = 250; // ms entre verificações
const STAGGER = 750; // ms de defasagem entre cards, para não trocarem todos juntos

export function initServicesCarousel(section = document.querySelector('[data-services]')) {
  if (!section) return null;

  const track = section.querySelector('[data-services-track]');
  const prev = section.querySelector('[data-services-prev]');
  const next = section.querySelector('[data-services-next]');
  const toggle = section.querySelector('[data-photos-toggle]');
  const autoplay = !prefersReducedMotion();
  let paused = false;

  // ---------- Carrossel de cards ----------
  function stepCards(direction) {
    const card = track.querySelector(':scope > li');
    if (!card) return;
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    track.scrollBy({ left: direction * (card.offsetWidth + gap), behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  }

  function updateArrows() {
    const max = track.scrollWidth - track.clientWidth;
    const scrollable = max > 2;
    [prev, next].forEach((button) => { if (button) button.hidden = !scrollable; });
    prev?.setAttribute('aria-disabled', String(track.scrollLeft <= 2));
    next?.setAttribute('aria-disabled', String(track.scrollLeft >= max - 2));
  }

  prev?.addEventListener('click', () => { if (prev.getAttribute('aria-disabled') !== 'true') stepCards(-1); });
  next?.addEventListener('click', () => { if (next.getAttribute('aria-disabled') !== 'true') stepCards(1); });
  let arrowFrame = 0;
  track.addEventListener('scroll', () => {
    if (!arrowFrame) arrowFrame = requestAnimationFrame(() => { arrowFrame = 0; updateArrows(); });
  }, { passive: true });
  new ResizeObserver(updateArrows).observe(track);
  updateArrows();

  // ---------- Carrossel de fotos em cada card ----------
  const carousels = [...section.querySelectorAll('[data-photo-carousel]')]
    .map((root, index) => createPhotoCarousel(root, index))
    .filter(Boolean);

  function canAdvance(carousel) {
    return autoplay && !paused && !document.hidden && carousel.visible && !carousel.hovered && !carousel.focused;
  }

  let timer = 0;
  function tick() {
    const now = performance.now();
    carousels.forEach((carousel) => {
      if (!canAdvance(carousel)) {
        carousel.nextAt = Math.max(carousel.nextAt, now + INTERVAL);
        return;
      }
      if (now >= carousel.nextAt) carousel.show(carousel.current + 1);
    });
  }

  if (autoplay && carousels.length) {
    // O temporizador só existe enquanto a seção está perto da tela.
    new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !timer) timer = window.setInterval(tick, TICK);
      if (!entry.isIntersecting && timer) {
        window.clearInterval(timer);
        timer = 0;
      }
    }, { rootMargin: '200px 0px' }).observe(section);
  }

  if (toggle) {
    toggle.hidden = !autoplay || !carousels.length;
    toggle.addEventListener('click', () => {
      paused = !paused;
      toggle.setAttribute('aria-pressed', String(paused));
      toggle.textContent = paused ? 'Retomar fotos' : 'Pausar fotos';
    });
  }

  return { stepCards, carousels };
}

function createPhotoCarousel(root, index) {
  const slides = [...root.querySelectorAll('[data-photo-slide]')];
  const prev = root.querySelector('[data-photo-prev]');
  const next = root.querySelector('[data-photo-next]');
  const dots = root.querySelector('[data-photo-dots]');
  const status = root.querySelector('[data-photo-status]');

  if (slides.length < 2) {
    [prev, next, dots].forEach((element) => { if (element) element.hidden = true; });
    return null;
  }

  const dotElements = slides.map(() => {
    const dot = document.createElement('span');
    dot.className = 'photo-carousel__dot';
    dots?.append(dot);
    return dot;
  });

  const carousel = {
    current: 0,
    nextAt: performance.now() + INTERVAL + index * STAGGER,
    visible: false,
    hovered: false,
    focused: false,
    show(target, { manual = false } = {}) {
      carousel.current = (target + slides.length) % slides.length;
      slides.forEach((slide, i) => {
        const active = i === carousel.current;
        slide.classList.toggle('is-active', active);
        slide.setAttribute('aria-hidden', String(!active));
      });
      dotElements.forEach((dot, i) => dot.classList.toggle('is-active', i === carousel.current));
      carousel.nextAt = performance.now() + INTERVAL;
      if (manual && status) {
        const alt = slides[carousel.current].querySelector('img')?.alt || '';
        status.textContent = `Foto ${carousel.current + 1} de ${slides.length}. ${alt}`;
      }
    },
  };

  prev?.addEventListener('click', () => carousel.show(carousel.current - 1, { manual: true }));
  next?.addEventListener('click', () => carousel.show(carousel.current + 1, { manual: true }));

  const card = root.closest('[data-service-card]') || root;
  card.addEventListener('pointerenter', (event) => { if (event.pointerType === 'mouse') carousel.hovered = true; });
  card.addEventListener('pointerleave', () => { carousel.hovered = false; });
  card.addEventListener('focusin', () => { carousel.focused = true; });
  card.addEventListener('focusout', (event) => { if (!card.contains(event.relatedTarget)) carousel.focused = false; });

  new IntersectionObserver(([entry]) => { carousel.visible = entry.isIntersecting; }, { threshold: 0.35 }).observe(root);

  carousel.show(0);
  return carousel;
}
