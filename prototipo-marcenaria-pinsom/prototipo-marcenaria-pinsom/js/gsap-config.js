/**
 * Configuração compartilhada do GSAP: registro de plugins, curvas nomeadas e tokens de movimento.
 *
 * O GSAP 3.13.0 e os plugins são carregados por <script defer> (CDN) antes de main.js.
 * Se o CDN falhar, getMotionTools() retorna null e cada módulo segue com o comportamento
 * nativo (conteúdo visível, âncoras e rolagem do navegador).
 *
 * Para ajustar o "ritmo" do site, altere apenas MOTION e EASE_CURVES.
 */

export const MOTION = {
  duration: {
    reveal: 0.85, // imagens e cards
    accent: 0.6, // revisita de uma seção pelo menu
    menuItems: 0.4,
    menuIcon: 0.35,
    navMin: 0.6, // navegação pelo menu: duração proporcional à distância
    navMax: 1.2,
  },
  distance: {
    media: 48, // px, deslocamento horizontal das imagens (direita → esquerda)
    card: 32,
  },
  scale: {
    media: 1.04,
  },
  stagger: {
    cards: 0.1,
    text: 0.08,
    menuItems: 0.05,
  },
  ease: {
    reveal: 'pinsonReveal',
    transition: 'pinsonTransition',
  },
  reveal: {
    start: 'top 82%', // posição do ScrollTrigger que dispara a entrada de cada bloco
  },
  // Revelação de textos com máscara (js/text-reveal.js)
  text: {
    yPercent: 110, // linhas sobem de baixo da máscara
    duration: 0.8,
    stagger: 0.1,
    ease: 'power3.out',
    heroDelay: 0.15, // início da sequência da Hero
    heroGap: 0.14, // intervalo entre os itens da Hero
  },
  // Abertura da Hero (js/hero-intro.js). O tamanho do quadrado fica no CSS (--hero-intro-size).
  intro: {
    hold: 0.25, // s em que o quadrado pequeno fica perceptível antes de crescer
    duration: 1.8, // s de expansão
    ease: 'pinsonIntro',
    maxWait: 2.5, // s máximos aguardando o primeiro frame do vídeo
  },
  // Saída das legendas da Hero (js/hero-captions.js); a entrada usa MOTION.text.
  captions: {
    exitDuration: 0.5,
    exitStagger: 0.05,
  },
  // Rolagem suave da roda do mouse (js/navigation.js): cada giro leva a página até o destino com
  // desaceleração, e ela "desliza" um pouco além do salto seco do navegador. Só com mouse/trackpad
  // (pointer: fine) e sem movimento reduzido; toque e teclado continuam nativos.
  wheel: {
    duration: 1.05, // s até parar
    ease: 'power3.out',
    multiplier: 1.15, // distância por giro em relação à do navegador
  },
  // Narrativa do guarda-roupa (js/etapas-narrativa.js)
  narrative: {
    scrub: 0.6,
    // A trilha tem duas partes: até modelEnd o 3D conta a história (progresso do modelo 0–1);
    // depois, o 3D some e a foto do ambiente finalizado cobre a seção (final.from → final.to).
    modelEnd: 0.84,
    final: { from: 0.86, to: 0.97 },
    // Faixas de cada etapa e a "pose-chave" usada ao clicar no card, em progresso do MODELO.
    steps: [
      { from: 0, to: 0.25, key: 0.18 },
      { from: 0.25, to: 0.5, key: 0.46 },
      { from: 0.5, to: 0.75, key: 0.68 },
      { from: 0.75, to: 1, key: 0.95 },
    ],
  },
  // Transição entre seções (js/section-transitions.js). Valores por faixa de tela.
  sections: {
    desktop: { scale: 0.94, y: 80, exitY: 56, radius: 28 },
    mobile: { scale: 0.97, y: 40, exitY: 28, radius: 16 },
    scrub: 0.6, // suavização do vínculo com a rolagem (s)
    enter: { start: 'top bottom', end: 'top 30%' },
    exit: { start: 'bottom bottom', end: 'bottom top' },
  },
};

/** Curvas cúbicas (x1,y1,x2,y2): desaceleração suave, sem elástico nem rebote. */
const EASE_CURVES = {
  pinsonReveal: '0.22,1,0.36,1',
  pinsonTransition: '0.65,0,0.35,1',
  pinsonIntro: '0.7,0,0.2,1', // aceleração contida e chegada longa e suave
};

/** Equivalentes nativos do GSAP, usados se o CustomEase não carregar. */
const FALLBACK_EASES = {
  pinsonReveal: 'power3.out',
  pinsonTransition: 'power2.inOut',
  pinsonIntro: 'power3.inOut',
};

const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

export function prefersReducedMotion() {
  return reducedMotionQuery.matches;
}

let motionTools; // undefined = ainda não inicializado; null = GSAP indisponível

/**
 * Registra os plugins disponíveis uma única vez e devolve as referências usadas pelos módulos.
 * Registro único: os demais módulos nunca chamam gsap.registerPlugin.
 * @returns {{gsap: object, ScrollTrigger: object|null, hasScrollTo: boolean, hasMorphSVG: boolean, SplitText: object|null} | null}
 */
export function getMotionTools() {
  if (motionTools !== undefined) return motionTools;

  const { gsap, ScrollTrigger, ScrollToPlugin, CustomEase, MorphSVGPlugin, SplitText } = window;

  if (!gsap) {
    console.warn('[Pinson] GSAP não carregou: animações desativadas; navegação e conteúdo seguem nativos.');
    motionTools = null;
    return motionTools;
  }

  const plugins = { ScrollTrigger, ScrollToPlugin, CustomEase, MorphSVGPlugin, SplitText };
  const missing = Object.keys(plugins).filter((name) => !plugins[name]);
  if (missing.length) {
    console.warn(`[Pinson] Plugins GSAP indisponíveis: ${missing.join(', ')}. Usando alternativas.`);
  }
  gsap.registerPlugin(...Object.values(plugins).filter(Boolean));

  if (CustomEase) {
    Object.entries(EASE_CURVES).forEach(([name, curve]) => CustomEase.create(name, curve));
  } else {
    MOTION.ease.reveal = FALLBACK_EASES.pinsonReveal;
    MOTION.ease.transition = FALLBACK_EASES.pinsonTransition;
    MOTION.intro.ease = FALLBACK_EASES.pinsonIntro;
  }

  motionTools = {
    gsap,
    ScrollTrigger: ScrollTrigger || null,
    hasScrollTo: Boolean(ScrollToPlugin),
    hasMorphSVG: Boolean(MorphSVGPlugin),
    SplitText: SplitText || null,
  };
  return motionTools;
}
