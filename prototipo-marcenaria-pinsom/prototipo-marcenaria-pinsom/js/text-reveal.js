/**
 * Revelação de textos com máscara em todo o site (SplitText 3.13 + ScrollTrigger).
 *
 * - Títulos, subtítulos, parágrafos e descrições de cards: divididos em linhas, cada linha
 *   dentro de uma máscara (overflow: clip) e animada de yPercent 110 → 0 com stagger.
 * - Rótulos (eyebrow), botões, links de texto e números das etapas: o elemento inteiro sobe
 *   dentro de uma máscara por clip-path, sem alterar o DOM (foco e cliques preservados).
 * - Cada texto revela uma única vez ao entrar na tela e permanece legível depois.
 *
 * autoSplit refaz a divisão quando as fontes carregam ou a largura muda, revertendo os
 * wrappers anteriores (sem duplicação) e transferindo o progresso da animação.
 * SplitText aplica aria-label no elemento e aria-hidden nas linhas: leitores de tela leem a frase inteira.
 * Com movimento reduzido ou sem GSAP/SplitText, nada é dividido e o texto fica como no HTML.
 */
import { MOTION, getMotionTools, prefersReducedMotion } from './gsap-config.js';
import { whenHeroIntroDone } from './hero-intro.js';

/** O que recebe cada tratamento. Altere aqui para incluir/excluir elementos. */
export const TEXT_REVEAL_TARGETS = {
  lines: 'main h1, main h2, main h3, main p',
  // data-reveal-element: itens que devem entrar inteiros (ex.: títulos com botão dentro,
  // destaques do Sobre, nomes de parceiros).
  elements: 'main .eyebrow, main .button, main .text-link, main .process-step__number, main [data-reveal-element]',
  // aria-live (status da galeria) muda de texto em tempo real; data-no-split permite exceções
  // (as legendas da Hero são controladas por js/hero-captions.js).
  exclude: '.eyebrow, [aria-live], [data-no-split], [data-no-split] *, [data-reveal-element] *',
};

const ELEMENT_MASK_FROM = { yPercent: 100, clipPath: 'inset(0% 0% 100% 0%)' };
const ELEMENT_MASK_TO = { yPercent: 0, clipPath: 'inset(0% 0% 0% 0%)' };

const splitByElement = new WeakMap();
const heroTweens = new Map(); // elemento → tween atual (pausado até o fim da abertura)
let mediaContext = null;

export function initTextReveals() {
  const tools = getMotionTools();
  if (!tools?.SplitText || !tools.ScrollTrigger) return;

  mediaContext?.revert();
  mediaContext = tools.gsap.matchMedia();
  mediaContext.add('(prefers-reduced-motion: no-preference)', () => {
    const hero = document.querySelector('[data-hero]');
    const heroItems = hero ? collectTargets(hero) : [];

    collectTargets(document).forEach((item) => {
      const heroIndex = heroItems.findIndex((heroItem) => heroItem.el === item.el);
      // Hero: sequência que só começa quando a abertura expansiva termina.
      const timing = heroIndex >= 0
        ? { delay: MOTION.text.heroDelay + heroIndex * MOTION.text.heroGap, paused: true, heroEl: item.el }
        : { scrollTrigger: { trigger: item.el, start: MOTION.reveal.start, once: true } };

      if (item.type === 'lines') createLineReveal(tools, item.el, timing);
      else createElementReveal(tools, item.el, timing);
    });

    whenHeroIntroDone().then(() => heroTweens.forEach((tween) => tween.play()));

    // matchMedia reverte os tweens; as divisões são desfeitas aqui (ex.: ao ativar movimento reduzido).
    return () => document.querySelectorAll(TEXT_REVEAL_TARGETS.lines).forEach(revertSplit);
  });
}

/** Alvos em ordem do documento, cada um com seu tratamento. */
function collectTargets(root) {
  const { lines, elements, exclude } = TEXT_REVEAL_TARGETS;
  const scope = root === document ? document : root;
  const matches = [...scope.querySelectorAll(`${lines}, ${elements}`)];
  return matches
    .filter((el) => el.matches(elements) || !el.matches(exclude))
    .map((el) => ({ el, type: el.matches(elements) ? 'element' : 'lines' }));
}

function createLineReveal({ gsap, SplitText }, el, { heroEl, ...timing }) {
  revertSplit(el);
  const split = SplitText.create(el, {
    type: 'lines',
    mask: 'lines',
    linesClass: 'split-line',
    autoSplit: true,
    // Retornar a animação permite ao SplitText recriá-la no mesmo ponto após um novo split.
    onSplit: (self) => trackHero(heroEl, gsap.from(self.lines, {
      yPercent: MOTION.text.yPercent,
      duration: MOTION.text.duration,
      stagger: MOTION.text.stagger,
      ease: MOTION.text.ease,
      ...timing,
    })),
  });
  splitByElement.set(el, split);
}

/** Guarda o tween atual de um item da Hero (o SplitText pode recriá-lo após um novo split). */
function trackHero(heroEl, tween) {
  if (heroEl) heroTweens.set(heroEl, tween);
  return tween;
}

function createElementReveal({ gsap }, el, { heroEl, ...timing }) {
  trackHero(heroEl, gsap.fromTo(el, ELEMENT_MASK_FROM, {
    ...ELEMENT_MASK_TO,
    duration: MOTION.text.duration,
    ease: MOTION.text.ease,
    clearProps: 'transform,clipPath', // sem resíduos que afetem foco, sombra ou hover
    ...timing,
  }));
}

function revertSplit(el) {
  splitByElement.get(el)?.revert();
  splitByElement.delete(el);
}

/**
 * Reproduz a mesma revelação sob demanda (ex.: legendas da Hero sincronizadas com
 * video.currentTime). Pode ser chamada a cada repetição; reinicia do começo sem duplicar wrappers.
 * @param {HTMLElement} el
 * @returns {object|null} a animação criada (ou null com movimento reduzido/sem dependências)
 */
export function playLineReveal(el) {
  const tools = getMotionTools();
  if (!el || !tools?.SplitText || prefersReducedMotion()) return null;
  revertSplit(el);
  const split = tools.SplitText.create(el, { type: 'lines', mask: 'lines', linesClass: 'split-line' });
  splitByElement.set(el, split);
  return tools.gsap.from(split.lines, {
    yPercent: MOTION.text.yPercent,
    duration: MOTION.text.duration,
    stagger: MOTION.text.stagger,
    ease: MOTION.text.ease,
  });
}
