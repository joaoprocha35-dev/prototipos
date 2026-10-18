/**
 * Animações de entrada com GSAP + ScrollTrigger.
 *
 * Linguagem reutilizável, declarada no HTML (textos ficam em js/text-reveal.js):
 *   [data-reveal-block]      bloco com um único gatilho de rolagem (uma timeline por bloco)
 *   [data-reveal="media"]    imagem: da direita para a esquerda + opacidade + escala 1.04 → 1
 *   [data-reveal="card"]     card: sobe com opacidade, em cascata dentro do bloco
 *   [data-accent]            imagem que recebe o "acento" curto ao revisitar a seção pelo menu
 *
 * Nada fica escondido pelo CSS: os estados iniciais são aplicados pelo GSAP só depois que
 * ele carrega, e cada timeline toca uma única vez até o fim (once). Com movimento reduzido,
 * gsap.matchMedia não cria nenhuma animação de entrada.
 *
 * Coordenação com a navegação: as entradas animam os elementos [data-reveal]; o acento de
 * revisita anima apenas a escala das <img data-accent> internas — propriedades e elementos
 * distintos, sem dois tweens disputando a mesma propriedade.
 */
import { MOTION, getMotionTools, prefersReducedMotion } from './gsap-config.js';

const CLEARED_PROPS = 'opacity,visibility,transform';

/** timeline de entrada por bloco; usada para coordenar a chegada pela navegação. */
const revealTimelines = new Map();
let mediaContext = null;

export function initAnimations() {
  const tools = getMotionTools();
  if (!tools?.ScrollTrigger) return; // sem ScrollTrigger, o conteúdo permanece estático e visível

  mediaContext?.revert(); // evita duplicar animações numa reinicialização
  mediaContext = tools.gsap.matchMedia();
  mediaContext.add('(prefers-reduced-motion: no-preference)', () => {
    createRevealBlocks(tools);
    createEndOfPageSafety(tools);
    return () => revealTimelines.clear(); // matchMedia reverte tweens e triggers automaticamente
  });
}

function createRevealBlocks({ gsap, ScrollTrigger }) {
  document.querySelectorAll('[data-reveal-block]').forEach((block) => {
    const pick = (type) => [
      ...(block.dataset.reveal === type ? [block] : []),
      ...block.querySelectorAll(`[data-reveal="${type}"]`),
    ];
    const media = pick('media');
    const cards = pick('card');
    if (!media.length && !cards.length) return;

    const timeline = gsap.timeline({
      paused: true,
      defaults: { ease: MOTION.ease.reveal },
      onComplete: () => gsap.set([...media, ...cards], { clearProps: CLEARED_PROPS }),
    });

    if (media.length) {
      timeline.from(media, {
        x: MOTION.distance.media,
        scale: MOTION.scale.media,
        autoAlpha: 0,
        duration: MOTION.duration.reveal,
        stagger: MOTION.stagger.cards,
      });
    }
    if (cards.length) {
      timeline.from(cards, {
        y: MOTION.distance.card,
        autoAlpha: 0,
        duration: MOTION.duration.reveal,
        stagger: MOTION.stagger.cards,
      }, media.length ? '<0.1' : 0);
    }

    revealTimelines.set(block, timeline);
    ScrollTrigger.create({
      trigger: block,
      start: MOTION.reveal.start,
      once: true,
      onEnter: () => timeline.play(),
    });
  });
}

/**
 * Blocos muito próximos do fim da página podem nunca cruzar o ponto de disparo.
 * Ao alcançar o fim da rolagem, todas as entradas pendentes são concluídas.
 */
function createEndOfPageSafety({ ScrollTrigger }) {
  ScrollTrigger.create({
    trigger: document.documentElement,
    start: () => ScrollTrigger.maxScroll(window) - 4,
    once: true,
    onEnter: () => revealTimelines.forEach((timeline) => timeline.play()),
  });
}

/**
 * Chamada pela navegação quando a rolagem chega à seção.
 * - Blocos ainda não revelados: inicia a entrada.
 * - Seção já vista: acento curto nas imagens (escala 1.04 → 1), sem esconder nada.
 */
export function playSectionArrival(section) {
  const tools = getMotionTools();
  if (!tools || prefersReducedMotion() || !section) return;

  let alreadyRevealed = true;
  revealTimelines.forEach((timeline, block) => {
    if (!section.contains(block)) return;
    if (timeline.progress() < 1) {
      alreadyRevealed = false;
      timeline.play();
    }
  });
  if (!alreadyRevealed) return;

  const images = section.querySelectorAll('img[data-accent]');
  if (!images.length) return;
  // A transição CSS de hover (projetos) suavizaria cada frame do tween; fica suspensa durante o acento.
  tools.gsap.set(images, { transition: 'none' });
  tools.gsap.fromTo(images,
    { scale: MOTION.scale.media },
    {
      scale: 1,
      duration: MOTION.duration.accent,
      ease: MOTION.ease.reveal,
      stagger: MOTION.stagger.text,
      overwrite: 'auto',
      clearProps: 'transform,transition',
    });
}
