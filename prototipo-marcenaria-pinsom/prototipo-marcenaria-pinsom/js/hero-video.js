/**
 * Vídeo da Hero: escolhe a versão 16:9 (>= 768px) ou 9:16 (< 768px), reproduz sem som em
 * loop infinito e oferece apenas pausar/retomar.
 *
 * Só uma versão é baixada por vez: o HTML usa preload="none" e a fonte é definida aqui.
 * Quando o vídeo não pode tocar (autoplay bloqueado, erro ou movimento reduzido), a classe
 * .has-fallback exibe uma imagem existente como fundo e o evento "hero:fallback" avisa a
 * abertura (hero-intro.js) para concluir a expansão com essa imagem.
 */

const DESKTOP_QUERY = '(min-width: 768px)';

const BUTTON_STATES = {
  playing: 'Pausar vídeo',
  paused: 'Reproduzir vídeo',
};

export function initHeroVideo(root = document.querySelector('[data-hero]')) {
  const video = root?.querySelector('[data-hero-video]');
  if (!video) return null;

  const button = root.querySelector('[data-hero-video-toggle]');
  const desktopQuery = window.matchMedia(DESKTOP_QUERY);
  const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const sources = { desktop: video.dataset.srcDesktop, mobile: video.dataset.srcMobile };

  // Garante as condições de autoplay mesmo que os atributos sejam alterados.
  video.muted = true;
  video.playsInline = true;
  video.loop = true;
  // A seleção passa a ser feita por JS (e acompanha o redimensionamento).
  video.querySelectorAll('source').forEach((source) => source.remove());

  const getWantedSource = () => (desktopQuery.matches ? sources.desktop : sources.mobile);

  /** Troca a fonte somente quando necessário, preservando o ponto do vídeo (mesma duração). */
  function applySource() {
    const src = getWantedSource();
    if (video.getAttribute('src') === src) return false;

    const time = video.currentTime;
    const wasPlaying = !video.paused;
    video.setAttribute('src', src);
    if (time > 0) {
      video.addEventListener('loadedmetadata', () => {
        video.currentTime = Math.min(time, video.duration || time);
      }, { once: true });
    }
    return wasPlaying;
  }

  function showFallback() {
    root.classList.add('has-fallback');
    root.dispatchEvent(new CustomEvent('hero:fallback'));
  }
  const hideFallback = () => root.classList.remove('has-fallback');

  async function play() {
    try {
      video.preload = 'auto';
      await video.play();
      hideFallback();
    } catch (error) {
      // AbortError: a fonte foi trocada durante o play() — a nova chamada resolve.
      if (error.name === 'AbortError') return;
      if (error.name !== 'NotAllowedError') {
        console.warn('[Pinson] Vídeo da Hero não pôde ser reproduzido:', error.message);
      }
      showFallback();
      updateButton();
    }
  }

  function updateButton() {
    if (!button) return;
    const state = video.paused ? 'paused' : 'playing';
    button.dataset.state = state;
    button.setAttribute('aria-label', BUTTON_STATES[state]);
  }

  video.addEventListener('play', updateButton);
  video.addEventListener('pause', updateButton);
  video.addEventListener('error', () => {
    console.warn('[Pinson] Falha ao carregar o vídeo da Hero:', video.getAttribute('src'));
    showFallback();
    if (button) button.hidden = true;
  });

  button?.addEventListener('click', () => {
    if (video.paused) play();
    else video.pause();
  });

  desktopQuery.addEventListener('change', () => {
    const wasPlaying = applySource();
    if (wasPlaying) play();
  });

  applySource();
  if (reducedQuery.matches) {
    // Movimento reduzido: nada começa sozinho; o visitante pode iniciar pelo botão.
    showFallback();
    updateButton();
  } else {
    play();
  }
  return video;
}
