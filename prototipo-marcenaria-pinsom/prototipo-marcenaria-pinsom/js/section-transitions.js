/**
 * Transição entre seções, aplicada a TODAS as seções principais por [data-section-panel].
 *
 * - Entrada: o painel da seção que chega sobe (y → 0) e se aproxima (scale ~0.94 → 1),
 *   arredondando as bordas enquanto ainda está menor.
 * - Saída: o painel da seção que sai sobe um pouco mais rápido que a rolagem.
 * Os dois tweens são "scrub" (ligados à rolagem), então se invertem naturalmente ao subir.
 *
 * Decisões:
 * - Só o painel interno é transformado; a <section> fica intacta para a navegação medir
 *   posições reais e para alturas, âncoras e rolagem por toque continuarem naturais. Não há pin.
 * - Entrada usa y/scale; saída usa yPercent. São componentes de transform distintos no GSAP,
 *   então os dois tweens nunca disputam a mesma propriedade, mesmo em seções curtas.
 * - Narrativas com pin dentro de uma seção (ex.: guarda-roupa 3D, entrega 2) devem usar
 *   pinReparent: true no próprio ScrollTrigger, porque um ancestral transformado quebra
 *   position: fixed. As animações internas atuam em elementos filhos, nunca no painel.
 */
import { MOTION, getMotionTools } from './gsap-config.js';

const MOTION_OK = '(prefers-reduced-motion: no-preference)';
const QUERIES = {
  desktop: `${MOTION_OK} and (min-width: 768px)`,
  mobile: `${MOTION_OK} and (max-width: 767px)`,
};

let mediaContext = null;

export function initSectionTransitions() {
  const tools = getMotionTools();
  if (!tools?.ScrollTrigger) return;

  const panels = [...document.querySelectorAll('[data-section-panel]')];
  if (!panels.length) return;

  mediaContext?.revert(); // reinicialização sem duplicar triggers
  mediaContext = tools.gsap.matchMedia();
  Object.entries(QUERIES).forEach(([size, query]) => {
    mediaContext.add(query, () => panels.forEach((panel, index) => {
      createPanelTransition(tools, panel, MOTION.sections[size], index === 0);
    }));
  });
}

function createPanelTransition({ gsap }, panel, intensity, isFirst) {
  const section = panel.closest('section') || panel;
  const { scrub, enter, exit } = MOTION.sections;

  // A primeira seção (Hero) já está na tela ao carregar: só tem a saída.
  if (!isFirst) {
    gsap.fromTo(panel,
      { y: intensity.y, scale: intensity.scale, borderRadius: intensity.radius },
      {
        y: 0,
        scale: 1,
        borderRadius: 0,
        ease: 'none',
        scrollTrigger: { trigger: section, start: enter.start, end: enter.end, scrub },
      });
  }

  gsap.fromTo(panel,
    { yPercent: 0 },
    {
      // Deslocamento em px convertido para % da altura, recalculado a cada refresh.
      yPercent: () => -(intensity.exitY / Math.max(panel.offsetHeight, 1)) * 100,
      ease: 'none',
      immediateRender: false,
      scrollTrigger: {
        trigger: section,
        start: exit.start,
        end: exit.end,
        scrub,
        invalidateOnRefresh: true,
      },
    });
}
