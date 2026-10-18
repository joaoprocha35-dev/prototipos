/**
 * Narrativa "Como funciona": um único progresso (0–1) controla o modelo 3D, a câmera, o card
 * ativo e o texto anunciado. É o único controlador da história.
 *
 *   0–25%  Conversa e medição    → desenho técnico e contornos
 *   25–50% Projeto e aprovação   → volume, materiais, perspectiva e portas correndo
 *   50–75% Fabricação            → vista explodida controlada
 *   75–90% Montagem e instalação → peças voltam às posições
 *   90–100%                      → móvel montado
 * Esses percentuais são do MODELO, que ocupa a trilha até MOTION.narrative.modelEnd. Depois, o
 * 3D some e a foto do ambiente finalizado (.process-final) cobre a seção; os cards continuam.
 *
 * Modos (gsap.matchMedia):
 * - Narrativa (movimento permitido e altura >= 560px): .process recebe .is-narrative (trilha
 *   alta + palco sticky abaixo do header) e um ScrollTrigger com scrub liga a rolagem ao
 *   progresso. Sem pin do ScrollTrigger: nenhum ancestral é reparentado nem disputado com a
 *   transição da seção (que só anima o painel e já terminou quando o palco fixa).
 * - Tela baixa: sem trilha; clicar no card anima o modelo até a pose da etapa.
 * - Movimento reduzido ou falha de WebGL/CDN: galeria de imagens, cards clicáveis e estáticos.
 * Clique no card com narrativa ativa → rola até a pose-chave da etapa usando o controlador
 * de rolagem do site (navigation.js), interrompível pelo visitante.
 */
import { MOTION, getMotionTools, prefersReducedMotion } from './gsap-config.js';
import { scrollToY } from './navigation.js';
import { initEtapasGaleria } from './etapas-galeria.js';
import { initWardrobeInspection } from './guarda-roupa-inspecao.js';

const NARRATIVE_QUERY = '(prefers-reduced-motion: no-preference) and (min-height: 560px)';
const SHORT_QUERY = '(prefers-reduced-motion: no-preference) and (max-height: 559px)';
/** Computador: com a narrativa, o 3D cobre o palco inteiro (CSS) e o móvel fica à direita dos cards. */
const FULL_BLEED_QUERY = '(min-width: 901px)';
const FRAMING_GAP = 32; // px entre os cards e a área do móvel
/** Imagem mostrada pela galeria (fallback) em cada etapa; a instalação mostra o ambiente finalizado. */
const GALLERY_FOR_STEP = [0, 2, 3, 5];

export function initEtapasNarrativa(section = document.getElementById('como-funciona')) {
  const process = section?.querySelector('[data-process]');
  if (!process) return null;

  const steps = [...process.querySelectorAll('[data-step]')];
  const stepsList = process.querySelector('.process__steps');
  const fullBleed = window.matchMedia(FULL_BLEED_QUERY);
  const buttons = steps.map((step) => step.querySelector('[data-step-button]'));
  const wardrobe = process.querySelector('[data-wardrobe]');
  const canvasHost = process.querySelector('[data-wardrobe-canvas]');
  const status = process.querySelector('[data-wardrobe-status]');
  const gallery = initEtapasGaleria(process.querySelector('[data-wardrobe-gallery]'));
  const tools = getMotionTools();
  const ranges = MOTION.narrative.steps;
  const { modelEnd, final } = MOTION.narrative;

  const state = { progress: 1, step: -1, trigger: null, model: null, inspection: null, finalShown: false };
  canvasHost?.setAttribute('aria-hidden', 'true');

  function setStep(index) {
    if (index === state.step) return;
    state.step = index;
    steps.forEach((step, i) => step.classList.toggle('is-active', i === index));
    buttons.forEach((button, i) => {
      if (i === index) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
    });
    const title = buttons[index]?.textContent.trim();
    if (status && title) status.textContent = `Etapa ${index + 1} de ${steps.length}: ${title}`;
    if (!state.model) gallery?.show(GALLERY_FOR_STEP[index]);
  }

  /** value = progresso da trilha (0–1). O modelo usa a parte até modelEnd; o restante é a foto final. */
  function setProgress(value) {
    state.progress = value;
    const modelProgress = state.trigger ? Math.min(1, value / modelEnd) : value;
    state.model?.setProgress(modelProgress);
    const index = ranges.findIndex((range, i) => modelProgress < range.to || i === ranges.length - 1);
    setStep(index);
    setFinal(state.trigger ? clamp01((value - final.from) / (final.to - final.from)) : 0);
  }

  /** Informa à câmera a área livre à direita dos cards quando o 3D cobre o palco (computador). */
  function updateFraming() {
    if (!state.model?.setFraming) return;
    if (!fullBleed.matches || !state.trigger || !wardrobe.classList.contains('is-3d')) {
      state.model.setFraming(null);
      return;
    }
    const canvasRect = canvasHost.getBoundingClientRect();
    if (!canvasRect.width) return;
    const left = stepsList.getBoundingClientRect().right + FRAMING_GAP - canvasRect.left;
    const right = process.getBoundingClientRect().right - canvasRect.left; // borda do conteúdo
    state.model.setFraming({ center: (left + right) / 2 / canvasRect.width, width: (right - left) / canvasRect.width });
  }

  if ('ResizeObserver' in window) new ResizeObserver(() => updateFraming()).observe(process);
  fullBleed.addEventListener?.('change', () => requestAnimationFrame(updateFraming));

  /** Foto do ambiente finalizado (0 = 3D visível; 1 = foto cobrindo a seção, 3D oculto). */
  function setFinal(amount) {
    section.style.setProperty('--process-final', amount.toFixed(3));
    section.classList.toggle('is-final-fading', amount > 0.02);
    section.classList.toggle('is-final', amount >= 0.98);
    const shown = amount >= 0.5;
    if (shown === state.finalShown) return;
    state.finalShown = shown;
    if (shown) {
      state.inspection?.close();
      if (status) status.textContent = 'Instalação concluída: ambiente finalizado.';
    }
  }

  // Estado inicial: sem narrativa, o móvel aparece montado e a etapa 1 fica destacada.
  setStep(0);

  buttons.forEach((button, index) => button.addEventListener('click', () => goToStep(index)));

  function goToStep(index) {
    const key = ranges[index].key;
    const trigger = state.trigger;
    if (trigger) {
      // Narrativa ativa: leva a rolagem até a pose-chave da etapa (mesmo controlador do menu).
      scrollToY(trigger.start + (trigger.end - trigger.start) * key * modelEnd);
      return;
    }
    if (state.model && tools && !prefersReducedMotion()) {
      const proxy = { p: state.progress };
      tools.gsap.to(proxy, {
        p: key,
        duration: 0.9,
        ease: MOTION.ease.transition,
        overwrite: true,
        onUpdate: () => setProgress(proxy.p),
      });
      return;
    }
    setStep(index);
    state.model?.setProgress(key);
  }

  if (tools?.ScrollTrigger) {
    const media = tools.gsap.matchMedia();
    media.add(NARRATIVE_QUERY, () => createNarrative(tools));
    media.add(SHORT_QUERY, () => setProgress(1));
  }

  function createNarrative({ gsap, ScrollTrigger }) {
    process.classList.add('is-narrative');
    const header = document.querySelector('[data-site-header]');
    const proxy = { p: 0 };

    // Posições calculadas pelo layout (offsetTop), imunes aos transforms da transição de seção.
    const trackTop = () => documentOffsetTop(process);
    const tween = gsap.to(proxy, {
      p: 1,
      ease: 'none',
      onUpdate: () => setProgress(proxy.p),
      scrollTrigger: {
        trigger: process,
        start: () => trackTop() - (header?.offsetHeight || 0),
        end: () => trackTop() + process.offsetHeight - window.innerHeight,
        scrub: MOTION.narrative.scrub,
        invalidateOnRefresh: true,
      },
    });
    state.trigger = tween.scrollTrigger;
    setProgress(tween.scrollTrigger.progress);
    requestAnimationFrame(updateFraming);
    // A trilha mudou a altura da página: recalcula todos os gatilhos uma única vez.
    ScrollTrigger.refresh();

    return () => {
      state.trigger = null;
      process.classList.remove('is-narrative');
      setProgress(1); // sem trilha: modelo montado e sem foto final
      updateFraming();
      ScrollTrigger.refresh();
    };
  }

  // ---------- Carregamento sob demanda do 3D ----------
  if (canvasHost && !prefersReducedMotion() && 'IntersectionObserver' in window) {
    const loader = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      loader.disconnect();
      load3D();
    }, { rootMargin: '1200px 0px' });
    loader.observe(section);
  }

  async function load3D() {
    try {
      const { createWardrobe3D } = await import('./guarda-roupa-3d.js');
      state.model = await createWardrobe3D(canvasHost, {
        onFirstFrame: () => {
          // Só troca a galeria pelo canvas depois do primeiro frame válido.
          wardrobe.classList.add('is-3d');
          canvasHost.removeAttribute('aria-hidden');
          requestAnimationFrame(updateFraming); // o canvas acabou de ganhar o tamanho final
        },
      });
      setProgress(state.progress); // aplica o mapeamento trilha → modelo
      // Clique/toque nas peças e botões Madeira/Vidro/Ferragens (só existe com o 3D ativo).
      state.inspection = initWardrobeInspection({ controller: state.model, wardrobe, status });
    } catch (error) {
      console.warn('[Pinson] Guarda-roupa 3D indisponível; exibindo a galeria de referências.', error);
      state.model = null;
    }
  }

  return { goToStep, getState: () => ({ ...state }) };
}

function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}

function documentOffsetTop(element) {
  let top = 0;
  for (let node = element; node; node = node.offsetParent) top += node.offsetTop;
  return top;
}
