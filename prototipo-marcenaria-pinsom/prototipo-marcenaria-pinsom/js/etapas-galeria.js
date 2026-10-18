/**
 * Galeria estática das referências do guarda-roupa (public/imagens/etapas-marcenaria/).
 * Nesta entrega é o conteúdo da seção "Como funciona"; na entrega 2 passa a ser a
 * alternativa exibida quando o WebGL/Three.js não estiver disponível.
 */
export function initEtapasGaleria(root = document.querySelector('[data-wardrobe-gallery]')) {
  if (!root) return null;

  const slides = [...root.querySelectorAll('[data-gallery-slide]')];
  const status = root.querySelector('[data-gallery-status]');
  const prev = root.querySelector('[data-gallery-prev]');
  const next = root.querySelector('[data-gallery-next]');
  if (slides.length < 2) return null;

  let current = Math.max(0, slides.findIndex((slide) => !slide.hidden));

  function show(index) {
    current = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => {
      slide.hidden = i !== current;
      slide.classList.toggle('is-active', i === current);
    });
    const caption = slides[current].querySelector('figcaption')?.textContent.trim() ?? '';
    if (status) status.textContent = `${current + 1} de ${slides.length} · ${caption}`;
  }

  prev?.addEventListener('click', () => show(current - 1));
  next?.addEventListener('click', () => show(current + 1));

  // Setas do teclado quando o foco está nos controles da galeria.
  root.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') show(current - 1);
    else if (event.key === 'ArrowRight') show(current + 1);
  });

  show(current);
  return { show };
}
