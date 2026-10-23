(() => {
  'use strict';
  const config = window.PORTFOLIO_CONFIG || {};
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const compactNavigation = window.matchMedia('(max-width: 800px)');
  const gsap = window.gsap;
  const canScrollTo = Boolean(gsap && window.ScrollToPlugin);
  const ScrollTrigger = gsap && window.ScrollTrigger;
  if (canScrollTo) gsap.registerPlugin(window.ScrollToPlugin);
  if (ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
  const navigation = document.getElementById('site-navigation');
  const menuToggle = document.getElementById('menu-toggle');
  const navLinks = document.getElementById('nav-links');
  const sections = [...document.querySelectorAll('main section[id]')];
  const title = document.getElementById('hero-title');
  const heroTexts = [...document.querySelectorAll('#hero-title, .hero-topline > span, .hero-quote .eyebrow, .hero-quote p, .hero-bottom > span, .hero-scroll')];
  const seenHeadings = new WeakSet();
  const headingTriggers = [];
  let introFinished = false;
  let introStage = 'title';
  let scrollFrame = 0;
  let activeSection = '';
  let activeVideoTrigger;
  let introTimer;
  let introTimeline;
  let arrowTween;
  let arrowTrigger;
  let layoutTimer;
  let scrollTween;
  let scrollKind = '';
  let wheelTarget = 0;
  let wheelDirection = 0;
  const introDuration = Math.max(0.1, Number(config.hero?.duration) || 1.2);
  const scrollSettings = {
    duration: Math.max(.3, Number(config.scroll?.duration) || 1.1),
    maxDuration: Math.max(.3, Number(config.scroll?.maxDuration) || 1.9),
    wheelDuration: Math.max(.2, Number(config.scroll?.wheelDuration) || .95),
    offset: Math.max(0, Number(config.scroll?.offset ?? 120)),
  };
  document.documentElement.classList.add('js');
  document.body.classList.add('js-enabled');

  function clearEntry(element) {
    element.removeAttribute('data-motion-pending');
    element.classList.remove('animate__animated', 'animate__fadeInDown');
    element.style.removeProperty('animation-delay');
  }
  function animateEntry(element, duration = introDuration, delay = 0) {
    if (!element) return;
    clearEntry(element);
    if (motionPreference.matches || !element.getClientRects().length) return;
    element.style.setProperty('--animate-duration', `${duration}s`);
    element.style.animationDelay = `${delay}s`;
    element.classList.add('animate__animated', 'animate__fadeInDown');
    element.addEventListener('animationend', () => clearEntry(element), { once: true });
  }
  function finishIntro() {
    if (introFinished) return;
    introFinished = true;
    introStage = 'complete';
    clearTimeout(introTimer);
    introTimeline?.kill();
    heroTexts.forEach(clearEntry);
  }
  function startIntro() {
    if (!title || !gsap || motionPreference.matches || (location.hash && location.hash !== '#inicio')) return finishIntro();
    heroTexts.forEach(element => { if (element.getClientRects().length) element.dataset.motionPending = 'true'; });
    introTimeline = gsap.timeline();
    introTimeline.call(() => animateEntry(title), null, 0)
      .call(() => document.querySelectorAll('.hero-topline > span').forEach((element, i) => animateEntry(element, introDuration, i * .09)), null, .15)
      .call(animateNavigation, null, .25)
      .call(() => {
        introStage = 'texts';
        document.querySelectorAll('.hero-quote .eyebrow, .hero-quote p').forEach((element, i) => animateEntry(element, introDuration, i * .12));
      }, null, .45)
      .call(() => document.querySelectorAll('.hero-bottom > span, .hero-scroll').forEach((element, i) => animateEntry(element, introDuration, i * .09)), null, .65)
      .call(finishIntro, null, Math.max(introDuration + .9, 1.6));
    introTimer = setTimeout(finishIntro, (introDuration + 1.5) * 1000);
  }
  function animateNavigation() {
    if (motionPreference.matches) return;
    navLinks?.querySelectorAll('a').forEach((link, index) => {
      animateEntry(link, .65, index * .09);
    });
  }
  function animateHeading(heading) {
    if (seenHeadings.has(heading) || motionPreference.matches) return clearEntry(heading);
    seenHeadings.add(heading);
    animateEntry(heading, compactNavigation.matches ? .85 : introDuration);
  }
  function setupHeadingMotion() {
    headingTriggers.splice(0).forEach(trigger => trigger.kill());
    document.querySelectorAll('h2, h3').forEach(heading => {
      if (motionPreference.matches || !ScrollTrigger || seenHeadings.has(heading) || heading.closest('dialog, [hidden], .testimonial-carousel')) return clearEntry(heading);
      heading.dataset.motionPending = 'true';
      headingTriggers.push(ScrollTrigger.create({
        trigger: heading.parentElement, start: 'top 92%', once: true,
        onEnter: () => animateHeading(heading),
      }));
    });
    if (ScrollTrigger && !motionPreference.matches) {
      const viewport = document.querySelector('.testimonial-viewport');
      if (viewport) {
        const showVisibleTitle = () => {
          const heading = viewport.querySelector('[data-testimonial]:not([hidden]) h3');
          if (heading) animateHeading(heading);
        };
        headingTriggers.push(ScrollTrigger.create({
          trigger: viewport, start: 'top 92%',
          onEnter: showVisibleTitle, onEnterBack: showVisibleTitle,
        }));
      }
    }
  }
  function setupScrollCue() {
    arrowTween?.kill();
    arrowTrigger?.kill();
    const arrow = document.querySelector('.scroll-arrow');
    if (!arrow || !gsap) return;
    gsap.set(arrow, { clearProps: 'transform' });
    if (motionPreference.matches) return;
    arrowTween = gsap.to(arrow, { y: 9, duration: .85, ease: 'sine.inOut', repeat: -1, yoyo: true });
    if (ScrollTrigger) {
      arrowTrigger = ScrollTrigger.create({
        trigger: '#inicio', start: 'top bottom', end: 'bottom top',
        onToggle: self => self.isActive ? arrowTween.resume() : arrowTween.pause(),
      });
      arrowTween.paused(!arrowTrigger.isActive);
    }
  }
  function scheduleRefresh() {
    if (!scrollFrame) scrollFrame = requestAnimationFrame(updateActiveSection);
  }
  function refreshLayout() {
    scheduleRefresh();
    clearTimeout(layoutTimer);
    if (ScrollTrigger) layoutTimer = setTimeout(() => ScrollTrigger.refresh(), 120);
  }

  function closeMenu(returnFocus = false) {
    const hidesFocus = compactNavigation.matches && navLinks?.contains(document.activeElement);
    navigation?.classList.remove('is-open');
    menuToggle?.setAttribute('aria-expanded', 'false');
    if ((returnFocus || hidesFocus) && compactNavigation.matches) menuToggle?.focus();
  }

  menuToggle?.addEventListener('click', () => {
    finishIntro();
    const isOpen = navigation?.classList.toggle('is-open');
    menuToggle.setAttribute('aria-expanded', String(Boolean(isOpen)));
    if (isOpen) animateNavigation();
  });

  document.addEventListener('pointerdown', event => {
    finishIntro();
    stopScroll();
    if (!navigation?.contains(event.target)) closeMenu();
  }, { passive: true });
  document.addEventListener('keydown', event => {
    if (event.key === 'Tab') finishIntro();
    if (event.key === 'Escape' && navigation?.classList.contains('is-open')) {
      closeMenu(true);
    }
  });
  compactNavigation.addEventListener('change', () => closeMenu());
  navigation?.addEventListener('focusout', () => {
    requestAnimationFrame(() => {
      if (compactNavigation.matches && navigation.classList.contains('is-open') && !navigation.contains(document.activeElement)) closeMenu();
    });
  });

  function sectionForHash(hash) {
    try {
      return hash && document.getElementById(decodeURIComponent(hash.slice(1)));
    } catch {
      return null;
    }
  }

  function stopScroll() {
    scrollTween?.kill();
    scrollKind = '';
    wheelTarget = window.scrollY;
  }
  function glideTo(top, duration, ease, kind) {
    scrollTween?.kill();
    scrollKind = kind;
    scrollTween = gsap.to(window, {
      duration, ease, overwrite: 'auto',
      scrollTo: { y: top, autoKill: true, onAutoKill: stopScroll },
      onComplete: () => { scrollKind = ''; wheelTarget = window.scrollY; },
    });
  }
  function scrollToSection(target, behavior = 'smooth') {
    const top = Math.max(0, Math.min(document.documentElement.scrollHeight - innerHeight, window.scrollY + target.getBoundingClientRect().top - scrollSettings.offset));
    stopScroll();
    if (canScrollTo && !motionPreference.matches && behavior !== 'auto') {
      const duration = Math.min(scrollSettings.maxDuration, scrollSettings.duration + Math.abs(top - window.scrollY) / (innerHeight * 5));
      glideTo(top, duration, 'power2.inOut', 'navigation');
    } else window.scrollTo({ top, behavior: 'auto' });
    target.focus({ preventScroll: true });
  }

  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', event => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = sectionForHash(link.getAttribute('href'));
      if (!target) return;
      event.preventDefault();
      closeMenu();
      const hash = `#${encodeURIComponent(target.id)}`;
      if (location.hash !== hash) history.pushState(null, '', hash);
      scrollToSection(target);
    });
  });

  function updateActiveSection() {
    scrollFrame = 0;
    if (!sections.length) return;
    const marker = window.innerHeight * 0.34;
    let current = sections[0];
    sections.forEach(section => {
      if (section.getBoundingClientRect().top <= marker) current = section;
    });
    if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4) current = sections[sections.length - 1];
    if (activeSection === current.id) return;
    activeSection = current.id;
    document.querySelectorAll('a[href^="#"]').forEach(link => {
      if (link.getAttribute('href') === `#${current.id}`) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }

  window.addEventListener('scroll', scheduleRefresh, { passive: true });
  // Mouse wheel glides briefly; touch, trackpads, nested scrollers and reduced
  // motion retain their native behavior. No sections are pinned or transformed.
  window.addEventListener('wheel', event => {
    if (!canScrollTo || motionPreference.matches || !matchMedia('(hover: hover) and (pointer: fine)').matches || event.ctrlKey || event.shiftKey || event.deltaX || document.querySelector('dialog[open]')) return stopScroll();
    if (event.deltaMode === 0 && (Math.abs(event.deltaY) < 50 || !Number.isInteger(event.deltaY))) return stopScroll();
    let element = event.target instanceof Element ? event.target : null;
    while (element && element !== document.body) {
      if (/(auto|scroll)/.test(getComputedStyle(element).overflowY) && element.scrollHeight > element.clientHeight) return stopScroll();
      element = element.parentElement;
    }
    event.preventDefault();
    const direction = Math.sign(event.deltaY);
    if (scrollKind !== 'wheel' || !scrollTween?.isActive() || direction !== wheelDirection) wheelTarget = window.scrollY;
    wheelDirection = direction;
    const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1);
    wheelTarget = Math.max(0, Math.min(document.documentElement.scrollHeight - innerHeight, wheelTarget + delta));
    glideTo(wheelTarget, scrollSettings.wheelDuration, 'power3.out', 'wheel');
  }, { passive: false });
  document.addEventListener('keydown', event => {
    if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' ', 'Escape'].includes(event.key)) stopScroll();
  });
  window.addEventListener('touchstart', stopScroll, { passive: true });

  // Autoplay pauses independently for hover, press, focus, manual pause,
  // reduced motion and background tabs. Restart always gives a full 3 seconds.
  const carousel = document.querySelector('.testimonial-carousel');
  if (carousel) {
    const viewport = carousel.querySelector('.testimonial-viewport');
    const cards = [...carousel.querySelectorAll('[data-testimonial]')];
    const pauseButton = carousel.querySelector('[data-carousel-pause]');
    const pauses = new Set();
    let current = 0;
    let timer;
    function schedule() {
      clearTimeout(timer);
      if (!pauses.size && !motionPreference.matches && !document.hidden) timer = setTimeout(() => show(current + 1), 3000);
    }
    function show(index) {
      current = (index + cards.length) % cards.length;
      cards.forEach((card, i) => { card.hidden = i !== current; });
      carousel.dataset.index = String(current);
      const heading = cards[current].querySelector('h3');
      if (heading && viewport.getBoundingClientRect().top < innerHeight && viewport.getBoundingClientRect().bottom > 0) animateHeading(heading);
      carousel.querySelector('[data-carousel-count]').textContent = `${current + 1} / ${cards.length}`;
      schedule();
    }
    function pause(reason, enabled) { enabled ? pauses.add(reason) : pauses.delete(reason); schedule(); }
    carousel.addEventListener('pointerenter', e => { if (e.pointerType !== 'touch') pause('hover', true); });
    carousel.addEventListener('pointerleave', () => pause('hover', false));
    viewport.addEventListener('pointerdown', e => { pause('press', true); viewport.setPointerCapture?.(e.pointerId); });
    viewport.addEventListener('pointerup', () => pause('press', false));
    viewport.addEventListener('pointercancel', () => pause('press', false));
    viewport.addEventListener('lostpointercapture', () => pause('press', false));
    // Keyboard users can read without the card changing under focus.
    carousel.addEventListener('focusin', e => { if (e.target.matches(':focus-visible')) pause('focus', true); });
    carousel.addEventListener('focusout', () => requestAnimationFrame(() => { if (!carousel.contains(document.activeElement)) pause('focus', false); }));
    carousel.querySelector('[data-carousel-prev]').addEventListener('click', () => show(current - 1));
    carousel.querySelector('[data-carousel-next]').addEventListener('click', () => show(current + 1));
    viewport.addEventListener('keydown', e => { if (['ArrowLeft', 'ArrowRight'].includes(e.key)) { e.preventDefault(); show(current + (e.key === 'ArrowRight' ? 1 : -1)); } });
    pauseButton.addEventListener('click', () => {
      const paused = !pauses.has('manual'); pause('manual', paused);
      pauseButton.setAttribute('aria-pressed', String(paused)); pauseButton.textContent = paused ? 'Retomar' : 'Pausar';
    });
    document.addEventListener('visibilitychange', schedule);
    motionPreference.addEventListener('change', schedule);
    show(0);
  }

  // Endereços vazios continuam vazios. Nada é substituído por um canal fictício.
  function contactHref(kind, value) {
    if (typeof value !== 'string' || !value.trim()) return '';
    const candidate = value.trim();
    if (kind === 'email') {
      const address = candidate.replace(/^mailto:/i, '');
      return /^[^\s@<>?]+@[^\s@<>?]+\.[^\s@<>?]+$/.test(address) ? `mailto:${address}` : '';
    }
    try {
      const url = new URL(candidate);
      if (url.protocol !== 'https:' || url.username || url.password) return '';
      const host = url.hostname.toLowerCase().replace(/^www\./, '');
      if (kind === 'instagram' && host === 'instagram.com' && url.pathname !== '/') return url.href;
      if (kind === 'whatsapp' && ['wa.me', 'api.whatsapp.com', 'web.whatsapp.com', 'whatsapp.com'].includes(host)) return url.href;
    } catch {
      return '';
    }
    return '';
  }

  document.querySelectorAll('[data-contact]').forEach(link => {
    const kind = link.dataset.contact;
    const href = contactHref(kind, config.contacts?.[kind]);
    if (!href) {
      link.removeAttribute('href');
      link.setAttribute('aria-disabled', 'true');
      link.setAttribute('tabindex', '-1');
      return;
    }
    link.href = href;
    link.removeAttribute('aria-disabled');
    link.removeAttribute('tabindex');
    if (kind !== 'email') {
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
    }
    document.querySelectorAll(`[data-contact-status="${kind}"]`).forEach(status => { status.textContent = 'Disponível'; });
    link.querySelectorAll('[data-contact-status]').forEach(status => { status.textContent = 'Disponível'; });
  });

  const videoDialog = document.getElementById('video-dialog');
  const videoPlayer = document.getElementById('video-player');
  const videoTitle = document.getElementById('video-title');
  const videoPlaceholder = document.getElementById('video-placeholder');
  const videoError = document.getElementById('video-error');

  function videoSource(value) {
    if (typeof value !== 'string' || !value.trim()) return '';
    const candidate = value.trim();
    if (candidate.startsWith('#')) return '';
    try {
      const url = new URL(candidate, document.baseURI);
      const relativeLocalFile = location.protocol === 'file:' && !/^[a-z][a-z\d+.-]*:/i.test(candidate) && !candidate.startsWith('//');
      if (url.username || url.password) return '';
      if (['https:', 'http:'].includes(url.protocol) || (url.protocol === 'file:' && relativeLocalFile)) return url.href;
    } catch {
      return '';
    }
    return '';
  }

  function cleanVideo() {
    if (!videoPlayer) return;
    videoPlayer.pause();
    videoPlayer.removeAttribute('src');
    videoPlayer.load();
  }

  function closeVideo() {
    if (!videoDialog) return;
    if (typeof videoDialog.close === 'function') videoDialog.close();
    else videoDialog.removeAttribute('open');
    cleanVideo();
    activeVideoTrigger?.focus({ preventScroll: true });
  }

  document.querySelectorAll('[data-video]').forEach(button => {
    if (videoSource(config.videos?.[button.dataset.video])) {
      button.setAttribute('aria-label', `Abrir ${button.dataset.title || 'vídeo do portfólio'}`);
      document.querySelectorAll(`[data-video-status="${button.dataset.video}"]`).forEach(status => { status.textContent = 'ASSISTIR'; });
    }
    button.addEventListener('click', () => {
      finishIntro();
      stopScroll();
      if (!videoDialog || !videoPlayer) return;
      activeVideoTrigger = button;
      const source = videoSource(config.videos?.[button.dataset.video]);
      if (videoTitle) videoTitle.textContent = button.dataset.title || 'Vídeo do portfólio';
      if (videoError) { videoError.textContent = ''; videoError.hidden = true; }
      videoPlayer.hidden = !source;
      if (videoPlaceholder) videoPlaceholder.hidden = Boolean(source);
      if (source) {
        videoPlayer.src = source;
        videoPlayer.load();
      }
      if (typeof videoDialog.showModal === 'function') videoDialog.showModal();
      else videoDialog.setAttribute('open', '');
      videoDialog.querySelectorAll('h2, h3').forEach(animateHeading);
    });
  });

  videoDialog?.querySelectorAll('[data-dialog-close]').forEach(button => button.addEventListener('click', closeVideo));
  videoDialog?.addEventListener('cancel', event => { event.preventDefault(); closeVideo(); });
  videoDialog?.addEventListener('close', () => {
    cleanVideo();
    activeVideoTrigger?.focus({ preventScroll: true });
  });
  videoDialog?.addEventListener('click', event => {
    if (event.target !== videoDialog) return;
    const rect = videoDialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeVideo();
  });
  videoPlayer?.addEventListener('error', () => {
    if (!videoPlayer.getAttribute('src') || !videoError) return;
    videoError.textContent = 'Não foi possível carregar este vídeo. Tente novamente mais tarde.';
    videoError.hidden = false;
  });

  document.querySelectorAll('[data-year]').forEach(node => { node.textContent = String(new Date().getFullYear()); });
  document.querySelectorAll('details').forEach(detail => detail.addEventListener('toggle', refreshLayout));
  document.querySelectorAll('img').forEach(image => {
    if (!image.complete) {
      image.addEventListener('load', refreshLayout, { once: true });
      image.addEventListener('error', refreshLayout, { once: true });
    }
  });
  if (document.fonts) {
    document.fonts.ready.then(refreshLayout);
    document.fonts.addEventListener?.('loadingdone', refreshLayout);
  }
  if ('ResizeObserver' in window) {
    const sizes = new WeakMap();
    const observer = new ResizeObserver(entries => {
      let changed = false;
      entries.forEach(({ target, contentRect }) => {
        const signature = `${Math.round(contentRect.width)}:${Math.round(contentRect.height)}`;
        if (sizes.get(target) !== signature) {
          sizes.set(target, signature);
          changed = true;
        }
      });
      if (changed) refreshLayout();
    });
    sections.forEach(section => observer.observe(section.querySelector('.section-inner') || section.querySelector('.section-surface') || section));
  }

  motionPreference.addEventListener('change', () => {
    stopScroll();
    if (motionPreference.matches) {
      finishIntro();
      document.querySelectorAll('.animate__animated, [data-motion-pending]').forEach(clearEntry);
    }
    setupHeadingMotion();
    setupScrollCue();
    refreshLayout();
  });
  window.addEventListener('resize', () => { stopScroll(); refreshLayout(); }, { passive: true });
  window.addEventListener('load', () => {
    refreshLayout();
    const target = sectionForHash(location.hash);
    if (target && location.hash !== '#inicio') requestAnimationFrame(() => scrollToSection(target, 'auto'));
  }, { once: true });
  window.addEventListener('popstate', () => {
    const target = sectionForHash(location.hash || '#inicio');
    if (target) scrollToSection(target, 'auto');
  });

  startIntro();
  setupHeadingMotion();
  setupScrollCue();
  updateActiveSection();
  scheduleRefresh();

  // Estado pequeno e legível para conferir a sequência durante os testes.
  window.PORTFOLIO_APP = Object.freeze({
    finishIntro,
    refresh: refreshLayout,
    get intro() { return { stage: introStage, finished: introFinished, duration: introDuration }; },
  });
})();
