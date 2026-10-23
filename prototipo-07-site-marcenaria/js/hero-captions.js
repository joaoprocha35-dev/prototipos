/**
 * Legendas da Hero sincronizadas com video.currentTime (sem temporizadores independentes).
 *
 * Agenda (data-caption-start/end no HTML, em segundos do vídeo de 18 s):
 *   0–4 s   h1 "Marcenaria planejada para transformar o seu ambiente."
 *   4–6 s   nenhuma legenda (o título sai para valorizar a imagem)
 *   6–12 s  "Acabamentos que valorizam cada detalhe."
 *   12–18 s "Funcionalidade e beleza, sob medida para você."
 *
 * A legenda ativa é recalculada a partir do tempo do vídeo a cada frame apresentado
 * (requestVideoFrameCallback) ou em timeupdate/seeked. Por isso acompanha pausa, busca,
 * troca de versão (desktop/celular) e repete sozinha a cada loop (o tempo volta a 0).
 *
 * Linguagem visual: Masked Line Reveal (SplitText, yPercent 110 → 0, 0,8 s, stagger 0,1 s,
 * power3.out); a saída sobe as linhas para fora da máscara. Com movimento reduzido ou sem
 * SplitText, a troca é imediata. O h1 nunca sai da árvore de acessibilidade (usa opacity).
 */
import { MOTION, getMotionTools, prefersReducedMotion } from './gsap-config.js';

export function initHeroCaptions(hero = document.querySelector('[data-hero]')) {
  const container = hero?.querySelector('[data-hero-captions]');
  const video = hero?.querySelector('[data-hero-video]');
  if (!container || !video) return;

  const captions = [...container.querySelectorAll('[data-caption-start]')].map((el) => ({
    el,
    start: Number(el.dataset.captionStart),
    end: Number(el.dataset.captionEnd),
    lines: null,
    split: null,
  }));
  if (!captions.length) return;

  const tools = getMotionTools();
  const animate = () => Boolean(tools?.SplitText) && !prefersReducedMotion();
  let active = -1;

  container.classList.add('is-ready');

  if (tools?.SplitText) {
    captions.forEach((caption, index) => {
      caption.split = tools.SplitText.create(caption.el, {
        type: 'lines',
        mask: 'lines',
        linesClass: 'split-line',
        autoSplit: true, // refaz as linhas após fontes/resize, sem duplicar wrappers
        onSplit: (self) => {
          caption.lines = self.lines;
          // Mantém o estado coerente após um novo split.
          tools.gsap.set(self.lines, { yPercent: index === active ? 0 : MOTION.text.yPercent });
        },
      });
    });
  }

  function indexAt(time) {
    return captions.findIndex(({ start, end }) => time >= start && time < end);
  }

  function enter(index) {
    const caption = captions[index];
    if (!caption) return;
    caption.el.classList.add('is-active');
    if (!animate() || !caption.lines) return;
    tools.gsap.fromTo(caption.lines,
      { yPercent: MOTION.text.yPercent },
      {
        yPercent: 0,
        duration: MOTION.text.duration,
        stagger: MOTION.text.stagger,
        ease: MOTION.text.ease,
        overwrite: true,
      });
  }

  function exit(index) {
    const caption = captions[index];
    if (!caption) return;
    if (!animate() || !caption.lines) {
      caption.el.classList.remove('is-active');
      return;
    }
    tools.gsap.to(caption.lines, {
      yPercent: -MOTION.text.yPercent,
      duration: MOTION.captions.exitDuration,
      stagger: MOTION.captions.exitStagger,
      ease: 'power2.in',
      overwrite: true,
      onComplete: () => {
        // Só esconde se ela não tiver voltado a ser a ativa nesse meio-tempo.
        if (captions.indexOf(caption) !== active) caption.el.classList.remove('is-active');
      },
    });
  }

  function sync() {
    const next = indexAt(video.currentTime || 0);
    if (next === active) return;
    const previous = active;
    active = next;
    exit(previous);
    enter(next);
  }

  // Precisão de frame enquanto o vídeo toca; o callback só roda com frames reais do vídeo.
  if ('requestVideoFrameCallback' in HTMLVideoElement.prototype) {
    let frameRequested = false;
    const requestFrame = () => {
      if (frameRequested) return;
      frameRequested = true;
      video.requestVideoFrameCallback(onFrame);
    };
    const onFrame = () => {
      frameRequested = false;
      sync();
      requestFrame();
    };
    requestFrame();
    video.addEventListener('play', requestFrame);
  }
  ['timeupdate', 'seeked', 'loadedmetadata', 'play', 'emptied'].forEach((type) => {
    video.addEventListener(type, sync);
  });

  sync();
}
