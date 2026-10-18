/**
 * Hero Intro Reveal (abertura expansiva): fundo azul ocupando a tela e uma pequena janela
 * quadrada central com o vídeo da Hero, que cresce automaticamente até a Hero preencher a tela.
 *
 * Funcionamento:
 * - O estado inicial (quadrado) é aplicado ANTES da primeira pintura pelo script no <head>
 *   (classe html.hero-intro-pending + CSS). Sem JavaScript não há abertura.
 * - A expansão começa quando o primeiro frame do vídeo está disponível (readyState >= 2 ou
 *   evento loadeddata — cobre mídia já em cache), quando a alternativa visual é ativada
 *   (autoplay bloqueado/erro) ou, no máximo, após MOTION.intro.maxWait.
 * - Anima apenas o clip-path de [data-hero-intro-frame]; o mesmo <video> continua tocando.
 *   A transição entre seções escreve só o transform do painel pai — elementos distintos.
 * - Roda uma vez por carregamento. Não depende de rolagem ou clique e não repete a cada loop.
 * - Recuperação: se GSAP faltar, a classe é removida na hora; se tudo falhar, o script do
 *   <head> remove a classe após 6 s.
 *
 * Causa da falha relatada (etapa 3): a abertura nunca havia sido implementada — não existia
 * código, CSS nem estado inicial para ela; o vídeo apenas tocava em tela cheia.
 */
import { MOTION, getMotionTools } from './gsap-config.js';

const PENDING_CLASS = 'hero-intro-pending';
let resolveDone;
const done = new Promise((resolve) => { resolveDone = resolve; });

/** Resolve quando a Hero está expandida (ou quando não há abertura nesta visita). */
export function whenHeroIntroDone() {
  return done;
}

export function initHeroIntro(hero = document.querySelector('[data-hero]')) {
  const root = document.documentElement;
  const frame = hero?.querySelector('[data-hero-intro-frame]');
  const video = hero?.querySelector('[data-hero-video]');

  if (!frame || !root.classList.contains(PENDING_CLASS)) {
    resolveDone();
    return;
  }

  const tools = getMotionTools();
  if (!tools) {
    root.classList.remove(PENDING_CLASS);
    resolveDone();
    return;
  }

  let started = false;
  const timeout = window.setTimeout(() => {
    // Vídeo lento: mostra a imagem alternativa por trás enquanto ele termina de carregar.
    if (video && video.readyState < 2) hero.classList.add('has-poster');
    start();
  }, MOTION.intro.maxWait * 1000);

  function start() {
    if (started) return;
    started = true;
    window.clearTimeout(timeout);

    // O temporizador de segurança do <head> já liberou a página: não volta ao quadrado.
    if (!root.classList.contains(PENDING_CLASS)) {
      resolveDone();
      return;
    }
    expand(tools, frame, root);
  }

  if (video && video.readyState >= 2) start();
  video?.addEventListener('loadeddata', start, { once: true });
  hero.addEventListener('hero:fallback', start, { once: true });
  if (hero.classList.contains('has-fallback')) start();
}

function expand({ gsap }, frame, root) {
  const { width, height } = frame.getBoundingClientRect();
  const size = parseFloat(getComputedStyle(root).getPropertyValue('--hero-intro-size')) || 200;
  const radius = parseFloat(getComputedStyle(root).getPropertyValue('--hero-intro-radius')) || 14;
  const insetY = Math.max(0, (height - size) / 2);
  const insetX = Math.max(0, (width - size) / 2);

  // Interpola números e monta a string completa a cada frame: o navegador normaliza
  // "inset(a b a b round r)" para a forma curta, e tweenar a string direto desalinharia os valores.
  const clip = { y: insetY, x: insetX, r: radius };
  const applyClip = () => {
    frame.style.clipPath = `inset(${clip.y}px ${clip.x}px ${clip.y}px ${clip.x}px round ${clip.r}px)`;
  };
  applyClip(); // mesmo quadrado do CSS, agora inline: a classe pode sair sem salto visual
  root.classList.remove(PENDING_CLASS);

  gsap.to(clip, {
    y: 0,
    x: 0,
    r: 0,
    onUpdate: applyClip,
    delay: MOTION.intro.hold,
    duration: MOTION.intro.duration,
    ease: MOTION.intro.ease,
    onComplete: () => {
      gsap.set(frame, { clearProps: 'clipPath' });
      frame.dataset.introState = 'done'; // facilita a inspeção no DevTools
      // clip-path não altera o layout: não é preciso recalcular os ScrollTriggers aqui.
      resolveDone();
    },
  });
  frame.dataset.introState = 'expanding';
}
