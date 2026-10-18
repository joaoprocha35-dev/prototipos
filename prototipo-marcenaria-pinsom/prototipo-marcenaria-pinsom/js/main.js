/**
 * Ponto de entrada: inicializa cada módulo uma única vez, isolando falhas para que um
 * recurso com problema (ex.: CDN do GSAP) não impeça menu, conteúdo e contatos.
 */
import { initMobileMenu } from './menu-mobile.js';
import { initNavigation } from './navigation.js';
import { initHeroVideo } from './hero-video.js';
import { initHeroIntro } from './hero-intro.js';
import { initHeroCaptions } from './hero-captions.js';
import { initBeforeAfter } from './antes-depois.js';
import { initSectionTransitions } from './section-transitions.js';
import { initTextReveals } from './text-reveal.js';
import { initAnimations, playSectionArrival } from './animations.js';
import { initEtapasNarrativa } from './etapas-narrativa.js';
import { initServicesCarousel } from './servicos-carrossel.js';
import { initMarquees } from './marquee.js';

function safeInit(name, init) {
  try {
    return init();
  } catch (error) {
    console.error(`[Pinson] Falha ao iniciar "${name}":`, error);
    return null;
  }
}

function initSite() {
  if (document.documentElement.dataset.siteReady) return; // proteção contra inicialização dupla
  document.documentElement.dataset.siteReady = 'true';

  const menu = safeInit('menu mobile', initMobileMenu);
  safeInit('navegação', () => initNavigation({
    beforeNavigate: () => menu?.close(),
    onArrive: playSectionArrival,
  }));
  safeInit('vídeo da hero', initHeroVideo);
  safeInit('abertura da hero', initHeroIntro); // depois do vídeo: precisa do <video> com fonte
  safeInit('legendas da hero', initHeroCaptions);
  safeInit('comparadores antes/depois', () => document.querySelectorAll('[data-compare]').forEach((root) => initBeforeAfter(root)));
  safeInit('carrossel de serviços', initServicesCarousel);
  safeInit('faixa de parceiros', initMarquees);
  // A narrativa muda a altura da trilha das etapas: vem antes dos demais gatilhos de rolagem.
  safeInit('etapas e guarda-roupa 3D', initEtapasNarrativa);
  // Ordem: transições de seção (painéis) → textos → imagens/cards.
  safeInit('transições entre seções', initSectionTransitions);
  safeInit('revelação de textos', initTextReveals);
  safeInit('animações', initAnimations);
}

initSite();
