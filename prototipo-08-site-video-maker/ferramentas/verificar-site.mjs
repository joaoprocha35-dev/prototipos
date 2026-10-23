import { chromium } from '@playwright/test';
import { mkdir, writeFile, access } from 'node:fs/promises';
import { constants } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// Execute com o servidor aberto: npm run dev (em outro terminal).
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = resolve(root, 'docs/verificacao');
const baseURL = process.env.SITE_URL || 'http://127.0.0.1:8088';
const chromePath = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const heroOnly = process.argv.includes('--hero-only');
const liveFonts = process.argv.includes('--live-font-network');
const reportName = heroOnly ? 'relatorio-hero.json' : 'relatorio.json';
const markdownName = heroOnly ? 'verificacao-hero.md' : 'verificacao.md';
const expectedNav = [
  ['Início', '#inicio'], ['Portfólio', '#portfolio'], ['Sobre mim', '#sobre-mim'],
  ['Serviços', '#servicos'], ['Como trabalho', '#como-trabalho'],
  ['Depoimentos', '#depoimentos'], ['Dúvidas', '#duvidas'], ['Vamos conversar', '#vamos-conversar'],
];
const report = { generatedAt: new Date().toISOString(), baseURL, browser: '', fontNetwork: liveFonts ? 'live-google-css' : 'google-css-intercepted-empty-local-font', cases: [], checks: [], screenshots: [], errors: [], ignoredExternalErrors: [] };
let currentCase = '';

function check(name, passed, detail = undefined) {
  const entry = { case: currentCase, name, passed: Boolean(passed), ...(detail === undefined ? {} : { detail }) };
  report.checks.push(entry);
  console.log(`${passed ? 'OK' : 'FALHOU'} [${currentCase}] ${name}`);
}

async function testCase(name, work) {
  currentCase = name;
  const start = Date.now();
  try {
    await work();
  } catch (error) {
    check('Execução do cenário', false, error.message);
    report.errors.push({ case: name, message: error.stack || error.message });
  }
  report.cases.push({ name, durationMs: Date.now() - start });
}

function monitor(page) {
  const errors = [];
  const isLocal = url => { try { return new URL(url).origin === new URL(baseURL).origin; } catch { return false; } };
  const isGoogle = url => /https:\/\/fonts\.(googleapis|gstatic)\.com\//.test(url);
  page.on('pageerror', error => errors.push({ type: 'pageerror', message: error.message }));
  page.on('console', message => {
    if (message.type() !== 'error') return;
    const entry = { type: 'console', message: message.text(), url: message.location().url };
    if (isGoogle(entry.url)) report.ignoredExternalErrors.push(entry);
    else errors.push(entry);
  });
  page.on('response', response => {
    if (isLocal(response.url()) && response.status() >= 400) errors.push({ type: 'http', status: response.status(), url: response.url() });
  });
  page.on('requestfailed', request => {
    const entry = { type: 'requestfailed', url: request.url(), message: request.failure()?.errorText };
    if (isGoogle(entry.url)) report.ignoredExternalErrors.push(entry);
    else if (isLocal(entry.url)) errors.push(entry);
  });
  return errors;
}

async function screenshot(page, name, fullPage = false) {
  await page.screenshot({ path: resolve(output, name), fullPage, animations: 'disabled' });
  report.screenshots.push(name);
}

async function loadAllImages(page) {
  await page.evaluate(async () => {
    const images = [...document.images];
    // Solicita também imagens lazy que ficaram entre saltos de navegação.
    images.forEach(image => { image.loading = 'eager'; });
    await Promise.all(images.map(image => image.decode().catch(() => {})));
    if (document.fonts) await document.fonts.ready;
  });
}

async function checkPinyonEverywhere(page, state = 'página') {
  const fonts = await page.evaluate(() => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const mismatches = [];
    let textNodes = 0;
    while (walker.nextNode()) {
      const node = walker.currentNode;
      const parent = node.parentElement;
      if (!node.textContent.trim() || !parent || parent.closest('script,style,[hidden]') || !parent.getClientRects().length) continue;
      const style = getComputedStyle(parent);
      if (style.visibility === 'hidden' || style.display === 'none') continue;
      textNodes++;
      const primaryFont = style.fontFamily.split(',')[0].replace(/["']/g, '').trim();
      if (primaryFont !== 'Pinyon Script') mismatches.push({ text: node.textContent.trim().slice(0, 80), font: style.fontFamily, element: parent.tagName, class: parent.className });
    }
    return { textNodes, mismatches };
  });
  check(`Pinyon Script em todos os textos: ${state}`, fonts.textNodes > 0 && fonts.mismatches.length === 0, fonts);
}

async function checkTransparentNavigation(page, state) {
  const surfaces = await page.locator('#site-navigation, .nav-reveal, #nav-links, #nav-links a, .nav-brand, #menu-toggle').evaluateAll(nodes => nodes
    .filter(node => node.getClientRects().length && getComputedStyle(node).visibility !== 'hidden')
    .map(node => {
      const style = getComputedStyle(node);
      return {
        element: node.id || `${node.tagName}.${node.className}`,
        backgroundColor: style.backgroundColor,
        backgroundImage: style.backgroundImage,
        borders: [style.borderTopWidth, style.borderRightWidth, style.borderBottomWidth, style.borderLeftWidth],
        backdrop: style.backdropFilter || 'none',
        webkitBackdrop: style.webkitBackdropFilter || 'none',
        shadow: style.boxShadow,
      };
    }));
  const transparent = surface => (surface.backgroundColor === 'transparent' || /(?:,|\/)\s*0(?:\.0+)?\)$/.test(surface.backgroundColor))
    && surface.backgroundImage === 'none'
    && surface.borders.every(width => Number.parseFloat(width) === 0)
    && surface.backdrop === 'none' && surface.webkitBackdrop === 'none' && surface.shadow === 'none';
  check(`Navbar transparente sem borda ou vidro: ${state}`, surfaces.length > 0 && surfaces.every(transparent), surfaces);
}

async function checkAssets(page, width) {
  await loadAllImages(page);
  const images = await page.locator('img').evaluateAll(nodes => nodes.map(image => ({
    src: image.getAttribute('src'), current: new URL(image.currentSrc).pathname.slice(1),
    loaded: image.complete && image.naturalWidth > 0, alt: image.getAttribute('alt'),
  })));
  check('Todas as imagens carregam', images.every(image => image.loaded), images);
  const current = selector => page.locator(selector).evaluate(image => new URL(image.currentSrc).pathname.slice(1));
  const hero = { background: await current('.hero-background'), client: await current('.hero-portrait') };
  check('Hero usa os mesmos dois arquivos originais', hero.background === 'referencia-hero/fundo-hero.png' && hero.client === 'referencia-hero/imagem-cliente.png', hero);
  const large = width > 800;
  const variants = [
    ['.showreel-cover img', large ? 'capa-do-video-computador.png' : 'capa-do-video-computador-celular.png'],
    ['[data-video="eventos"] img', large ? 'card-de-destaque-eventos-computador.png' : 'card-de-destaque-eventos-celular.png'],
    ['[data-video="marcas"] img', large ? 'card-de-destauqe-marcas-computador.png' : 'card-de-destauqe-marcas-celular.png'],
    ['[data-video="redes"] img', large ? 'card-de-destaque-redes-sociais-computador.png' : 'card-videos-redes-sociais-computador-celular.png'],
    ['.about-visual img', large ? 'secao-sobre-mim-computador.png' : 'imagem-cliente.png'],
  ];
  for (const [selector, file] of variants) check(`Imagem responsiva: ${selector}`, (await current(selector)).endsWith(`/${file}`));
  check('Sem overflow horizontal', await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth })));
  const overflowingText = await page.evaluate(() => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const overflow = [];
    while (walker.nextNode()) {
      const node = walker.currentNode;
      const parent = node.parentElement;
      if (!node.textContent.trim() || !parent || parent.closest('script,style,.skip-link,[hidden]') || !parent.getClientRects().length) continue;
      const style = getComputedStyle(parent);
      if (style.visibility === 'hidden' || style.display === 'none') continue;
      const range = document.createRange();
      range.selectNodeContents(node);
      for (const rect of range.getClientRects()) {
        if (rect.width > 0 && (rect.left < -2 || rect.right > innerWidth + 2)) {
          overflow.push({ text: node.textContent.trim().slice(0, 90), left: rect.left, right: rect.right, viewport: innerWidth });
          break;
        }
      }
    }
    return overflow;
  });
  check('Textos permanecem dentro da largura visível', overflowingText.length === 0, overflowingText);
  check('Textos importantes em HTML e título único', await page.locator('h1').count() === 1 && (await page.locator('h1').innerText()) === 'PORTFÓLIO');
  check('Fonte Pinyon Script disponível', await page.evaluate(() => document.fonts.check('40px "Pinyon Script"') && getComputedStyle(document.querySelector('h1')).fontFamily.includes('Pinyon Script')));
  await checkPinyonEverywhere(page);
  check('Link Google original presente no head', await page.locator('head link[rel="stylesheet"]').evaluateAll(nodes => nodes.some(node => node.getAttribute('href') === 'https://fonts.googleapis.com/css2?family=Pinyon+Script&display=swap' && !node.hasAttribute('media') && !node.hasAttribute('onload'))));
  const titleBounds = await page.locator('#hero-title').evaluate(node => {
    const range = document.createRange();
    range.selectNodeContents(node);
    const rect = range.getBoundingClientRect();
    return { left: rect.left, right: rect.right, width: rect.width, viewport: innerWidth, fontSize: getComputedStyle(node).fontSize };
  });
  check('Título completo dentro da largura da hero', titleBounds.left >= -2 && titleBounds.right <= width + 2, titleBounds);
  if (width === 1440) {
    const portrait = await page.locator('.hero-portrait').boundingBox();
    const previousWidth = 979.2;
    check('Retrato desktop reduzido em 20%', Math.abs(portrait.width - previousWidth * 0.8) <= 1, { previousWidth, currentWidth: portrait.width, ratio: portrait.width / previousWidth });
  }
  await checkTransparentNavigation(page, 'inicial');
  check('Descrição SEO presente e sem meta keywords', Boolean(await page.locator('meta[name="description"]').getAttribute('content')) && await page.locator('meta[name="keywords"]').count() === 0);
  check('Imagens de conteúdo possuem descrição alternativa', images.every(image => image.src.includes('fundo-hero.png') || Boolean(image.alt?.trim())));
  check('Portfólio único reúne showreel e três categorias', await page.locator('section#portfolio').count() === 1 && await page.locator('#portfolio [data-video="showreel"]').count() === 2 && await page.locator('#portfolio .project-card').count() === 3);
}

async function scrollPanelProgress(page, id, progress) {
  const destination = await page.evaluate(({ id, progress }) => {
    const trigger = ScrollTrigger.getAll().find(trigger => trigger.pin?.id === id);
    if (!trigger) return null;
    const top = Math.max(0, trigger.start + (trigger.end - trigger.start) * progress);
    const maximum = document.documentElement.scrollHeight - innerHeight;
    if (top > maximum + 2) return { top, maximum, reachable: false };
    scrollTo({ top, behavior: 'instant' });
    return { top, maximum, reachable: true };
  }, { id, progress });
  if (!destination?.reachable) return destination;
  await page.waitForFunction(({ id, progress }) => {
    const trigger = ScrollTrigger.getAll().find(trigger => trigger.pin?.id === id);
    return trigger && Math.abs(trigger.progress - progress) < 0.015;
  }, { id, progress }, { timeout: 3000 });
  await page.waitForTimeout(100);
  return destination;
}

async function checkPanelMotion(page, name) {
  await page.waitForTimeout(300);
  const panels = await page.evaluate(() => ScrollTrigger.getAll().filter(trigger => trigger.pin).map(trigger => {
    const inner = trigger.pin.querySelector('.section-inner');
    const height = inner?.offsetHeight || 0;
    return {
      id: trigger.pin.id, height, viewport: innerHeight,
      fakeRatio: height > innerHeight ? (height - innerHeight) / height : 0,
      start: trigger.start, end: trigger.end,
    };
  }));
  for (const panel of panels) {
    check(`Painel ${panel.id} possui conteúdo interno mensurável`, panel.height > 0, panel);
    if (!panel.height) continue;
    const start = await scrollPanelProgress(page, panel.id, 0);
    check(`Início do painel ${panel.id} alcançável`, Boolean(start?.reachable), start);
    if (!start?.reachable) continue;
    if (panel.fakeRatio > 0.002) {
      await screenshot(page, `${name}-${panel.id}-conteudo-inicial.png`);
      const destination = await scrollPanelProgress(page, panel.id, panel.fakeRatio);
      check(`Fim do conteúdo longo ${panel.id} alcançável`, Boolean(destination?.reachable), destination);
      if (destination?.reachable) {
        const content = await page.locator(`#${panel.id}`).evaluate(node => {
          const inner = node.querySelector('.section-inner');
          const innerRect = inner.getBoundingClientRect();
          const candidates = [...inner.querySelectorAll('p,h1,h2,h3,summary,button,li,a,img')]
            .map(element => ({ element, rect: element.getBoundingClientRect() }))
            .filter(({ element, rect }) => rect.width > 0 && rect.height > 0 && getComputedStyle(element).visibility !== 'hidden')
            .sort((a, b) => b.rect.bottom - a.rect.bottom);
          const last = candidates[0];
          return {
            innerTop: innerRect.top, innerBottom: innerRect.bottom, viewport: innerHeight,
            opacity: Number(getComputedStyle(node).opacity), scale: Number(gsap.getProperty(node, 'scaleX')),
            last: last && { text: (last.element.textContent || last.element.getAttribute('alt') || '').trim().slice(0, 100), top: last.rect.top, bottom: last.rect.bottom },
          };
        });
        check(`Última parte de ${panel.id} visível antes da saída`, Boolean(content.last && content.last.top < content.viewport - 2 && content.last.bottom > 0 && content.last.bottom <= content.viewport + 6 && content.opacity > 0.94 && content.scale > 0.98), content);
        await screenshot(page, `${name}-${panel.id}-conteudo-final.png`);
      }
    }
    const scaleEnd = panel.fakeRatio + (1 - panel.fakeRatio) * 0.9;
    const scaleDestination = await scrollPanelProgress(page, panel.id, scaleEnd);
    check(`Transição de ${panel.id} alcançável`, Boolean(scaleDestination?.reachable), scaleDestination);
    if (scaleDestination?.reachable) {
      const values = await page.locator(`#${panel.id}`).evaluate(node => ({ scale: Number(gsap.getProperty(node, 'scaleX')), opacity: Number(getComputedStyle(node).opacity) }));
      check(`Painel ${panel.id} chega a escala 0.7 e opacidade 0.5`, Math.abs(values.scale - 0.7) < 0.025 && Math.abs(values.opacity - 0.5) < 0.08, values);
      if (panel.id === 'inicio' || panel.id === 'portfolio') await screenshot(page, `${name}-${panel.id}-transicao.png`);
    }
    const end = await scrollPanelProgress(page, panel.id, 0.999);
    check(`Final do painel ${panel.id} alcançável`, Boolean(end?.reachable), end);
    if (end?.reachable) {
      const opacity = await page.locator(`#${panel.id}`).evaluate(node => Number(getComputedStyle(node).opacity));
      check(`Painel ${panel.id} conclui a saída com opacidade zero`, opacity < 0.06, { opacity });
    }
  }
}

async function checkNavigation(page, mobile) {
  const actual = await page.locator('#nav-links a').evaluateAll(links => links.map(link => [
    [...link.childNodes].filter(node => node.nodeType === Node.TEXT_NODE).map(node => node.textContent).join('').trim(), link.getAttribute('href'),
  ]));
  check('Navegação possui todos os nomes e ordem exata', JSON.stringify(actual) === JSON.stringify(expectedNav), actual);
  if (mobile) {
    const toggle = page.locator('#menu-toggle');
    await toggle.focus();
    await page.keyboard.press('Enter');
    check('Menu abre por teclado', await toggle.getAttribute('aria-expanded') === 'true' && await page.locator('#nav-links').isVisible());
    await checkPinyonEverywhere(page, 'menu aberto');
    await checkTransparentNavigation(page, 'menu aberto');
    await page.keyboard.press('Tab');
    check('Primeiro link do menu recebe Tab', await page.locator('#nav-links a').first().evaluate(node => node === document.activeElement));
    await page.keyboard.press('Escape');
    check('Escape fecha menu e devolve foco', await toggle.getAttribute('aria-expanded') === 'false' && await toggle.evaluate(node => node === document.activeElement));
  }
  for (const [, href] of expectedNav) {
    if (mobile) await page.locator('#menu-toggle').click();
    const link = page.locator(`#nav-links a[href="${href}"]`);
    await link.focus();
    await page.keyboard.press('Enter');
    await page.waitForFunction(hash => location.hash === hash && document.activeElement?.id === hash.slice(1), href);
    // O navegador conclui o scroll suave antes da indicação de seção ativa.
    await page.waitForFunction(hash => {
      const target = document.getElementById(hash.slice(1));
      const pin = window.ScrollTrigger?.getAll().find(trigger => trigger.pin === target);
      if (pin) return Math.abs(scrollY - Math.max(0, pin.start)) <= 2;
      const top = target.getBoundingClientRect().top;
      const margin = Number.parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
      const atBottom = scrollY + innerHeight >= document.documentElement.scrollHeight - 3;
      return top >= -2 && (top <= margin + 3 || atBottom);
    }, href, { timeout: 5000 });
    await page.waitForFunction(hash => document.querySelector(`#nav-links a[href="${hash}"]`)?.getAttribute('aria-current') === 'location', href, { timeout: 5000 });
    const rect = await page.locator(href).boundingBox();
    check(`Link acessível chega a ${href}`, Boolean(rect && rect.y < page.viewportSize().height - 100 && rect.y > -3), rect);
    const pinDestination = await page.evaluate(hash => {
      const trigger = window.ScrollTrigger?.getAll().find(trigger => trigger.pin?.id === hash.slice(1));
      if (!trigger) return null;
      return { expected: Math.max(0, trigger.start), actual: scrollY };
    }, href);
    if (pinDestination) check(`Âncora ${href} usa o início real do painel`, Math.abs(pinDestination.expected - pinDestination.actual) <= 3, pinDestination);
    if (mobile) check(`Menu fecha após ${href}`, await page.locator('#menu-toggle').getAttribute('aria-expanded') === 'false');
  }
  if (mobile) await page.locator('#menu-toggle').click();
  await page.locator('#nav-links a').first().hover();
  await checkTransparentNavigation(page, 'hover e seção ativa');
  await page.locator('#nav-links a').first().focus();
  await checkTransparentNavigation(page, 'foco por teclado');
  if (mobile) await page.keyboard.press('Escape');
  await page.locator('.back-to-top').focus();
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => location.hash === '#inicio' && scrollY <= 2 && document.activeElement?.id === 'inicio');
  check('Voltar ao início retorna ao primeiro painel por teclado', await page.locator('#inicio').evaluate(node => Math.abs(node.getBoundingClientRect().top) <= 3));
}

async function checkVideoAndFAQ(page) {
  const buttons = page.locator('[data-video]');
  for (let i = 0; i < await buttons.count(); i++) {
    const button = buttons.nth(i);
    const kind = await button.getAttribute('data-video');
    await button.focus();
    await page.keyboard.press('Enter');
    const dialog = page.locator('#video-dialog');
    await dialog.waitFor({ state: 'visible' });
    if (i === 0) await checkPinyonEverywhere(page, 'diálogo de vídeo');
    check(`Vídeo pendente ${kind} abre sem mídia nem autoplay`, await page.locator('#video-placeholder').isVisible() && await page.locator('#video-player').getAttribute('src') === null && await page.locator('#video-player').getAttribute('autoplay') === null);
    await page.keyboard.press('Tab');
    check(`Foco permanece no diálogo ${kind}`, await dialog.evaluate(node => node.contains(document.activeElement)));
    await page.keyboard.press('Escape');
    check(`Escape fecha vídeo ${kind} e devolve foco`, !(await dialog.isVisible()) && await button.evaluate(node => node === document.activeElement));
  }
  const details = page.locator('.faq-list details').first();
  await details.locator('summary').focus();
  await page.keyboard.press('Enter');
  check('FAQ abre por Enter', await details.getAttribute('open') !== null);
  await page.keyboard.press('Space');
  check('FAQ fecha por Espaço', await details.getAttribute('open') === null);
  const contacts = await page.locator('[data-contact]').evaluateAll(nodes => nodes.map(node => ({ href: node.getAttribute('href'), disabled: node.getAttribute('aria-disabled'), tab: node.getAttribute('tabindex') })));
  check('Contatos pendentes sem endereços inventados', contacts.every(node => node.href === null && node.disabled === 'true' && node.tab === '-1'));
}

async function reachFooterAndCapture(page, name) {
  await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
  await page.mouse.wheel(0, 100000);
  await page.waitForFunction(() => scrollY + innerHeight >= document.documentElement.scrollHeight - 6);
  check('Rolagem nativa chega ao rodapé', await page.locator('.site-footer').evaluate(node => node.getBoundingClientRect().bottom <= innerHeight + 6));
  for (const id of expectedNav.map(([, href]) => href)) {
    await page.locator(id).evaluate(node => {
      const trigger = window.ScrollTrigger?.getAll().find(trigger => trigger.pin === node);
      scrollTo({ top: trigger ? Math.max(0, trigger.start) : scrollY + node.getBoundingClientRect().top, behavior: 'instant' });
    });
    await page.waitForTimeout(130);
  }
  await loadAllImages(page);
  await page.waitForTimeout(1100);
  await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
  await page.waitForTimeout(1300);
  const heroAlignment = await page.locator('#inicio').evaluate(node => ({ top: node.getBoundingClientRect().top, scrollY }));
  check('Retorno ao topo mantém a hero alinhada sem faixa vazia', Math.abs(heroAlignment.top) <= 2 && heroAlignment.scrollY === 0, heroAlignment);
  await screenshot(page, `${name}.png`);
  await screenshot(page, `${name}-pagina-completa.png`, true);
  if (page.viewportSize().width <= 800) {
    await page.locator('#menu-toggle').click();
    await page.waitForTimeout(250);
    await screenshot(page, `${name}-menu-aberto.png`);
    await page.keyboard.press('Escape');
  }
  await scrollPanelProgress(page, 'portfolio', 0);
  await page.waitForTimeout(900);
  await page.locator('#portfolio').screenshot({ path: resolve(output, `${name}-portfolio.png`), animations: 'disabled' });
  report.screenshots.push(`${name}-portfolio.png`);
}

await mkdir(output, { recursive: true });
let executablePath;
try { await access(chromePath, constants.R_OK); executablePath = chromePath; } catch { /* Usa Chromium do Playwright, se instalado. */ }
const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
report.browser = browser.version();

async function createContext(options) {
  const context = await browser.newContext(options);
  if (!liveFonts) {
    // Preserva o link real no HTML e verifica a cópia original local da fonte.
    // Só a resposta de rede externa é interceptada nesta sessão de testes.
    await context.route('https://fonts.googleapis.com/css2?family=Pinyon+Script&display=swap', route => route.fulfill({
      status: 200,
      contentType: 'text/css; charset=utf-8',
      body: '/* QA: Google CSS intercepted; Pinyon Script loads from local vendor. */',
    }));
  }
  return context;
}

try {
  const viewports = heroOnly ? [{ width: 1440, height: 900 }] : [{ width: 1440, height: 900 }, { width: 390, height: 844 }, { width: 360, height: 800 }];
  for (const viewport of viewports) {
    const mobile = viewport.width < 801;
    const name = `${mobile ? 'celular' : 'desktop'}-${viewport.width}x${viewport.height}`;
    await testCase(name, async () => {
      const context = await createContext({ viewport, isMobile: mobile, hasTouch: mobile, reducedMotion: 'no-preference' });
      try {
        const page = await context.newPage();
        const errors = monitor(page);
        await page.addInitScript(() => {
          window.__introEvents = [];
          for (const type of ['animationstart', 'animationend']) document.addEventListener(type, event => {
            if (!event.target.dataset?.intro) return;
            window.__introEvents.push({ type, target: event.target.dataset.intro, animation: event.animationName, time: performance.now(), elapsed: event.elapsedTime });
          }, true);
        });
        await page.goto(baseURL, { waitUntil: 'domcontentloaded' });
        await page.waitForFunction(() => document.querySelector('.hero-background').naturalWidth > 0);
        const timing = await page.evaluate(() => {
          const navigation = performance.getEntriesByType('navigation')[0];
          return { domContentLoadedMs: navigation.domContentLoadedEventEnd, backgroundLoadedByMs: performance.now() };
        });
        check('Fundo visível antes da sequência terminar', await page.locator('.hero-background').evaluate(node => getComputedStyle(node).visibility === 'visible' && getComputedStyle(node).opacity === '1'));
        await page.waitForFunction(() => window.PORTFOLIO_APP?.intro.finished, undefined, { timeout: 30000 });
        const events = await page.evaluate(() => window.__introEvents);
        const starts = events.filter(event => event.type === 'animationstart');
        const ends = events.filter(event => event.type === 'animationend');
        check('Sequência inicial única e na ordem correta', starts.map(event => event.target).join(',') === 'client,title,nav,quote', events);
        check('Cliente entra usando fadeInDown', starts.find(event => event.target === 'client')?.animation === 'fadeInDown');
        check('Todas as animações CSS terminam', ends.map(event => event.target).join(',') === 'client,title,nav,quote', events);
        const gaps = starts.slice(1).map((event, index) => {
          const previousEnd = ends.find(end => end.target === starts[index].target);
          return previousEnd ? (event.time - previousEnd.time) / 1000 : null;
        });
        check('Intervalos reais de 2s após o fim anterior', gaps.every(gap => gap !== null && gap >= 1.96 && gap <= 2.2), gaps);
        if (heroOnly) {
          check('Carregamento inicial medido', timing.domContentLoadedMs > 0 && timing.backgroundLoadedByMs > 0, { ...timing, fontNetwork: report.fontNetwork });
          check('Hero final sem elementos ocultos', await page.locator('[data-intro]').evaluateAll(nodes => nodes.every(node => getComputedStyle(node).visibility === 'visible' && Number(getComputedStyle(node).opacity) === 1)));
          check('Console e recursos locais sem erros', errors.length === 0, errors);
          return;
        }
        const triggers = await page.evaluate(() => ScrollTrigger.getAll().map(trigger => ({
          pin: trigger.pin?.id || null,
          start: trigger.start,
          end: trigger.end,
          scrub: trigger.vars.scrub || false,
          pinSpacing: trigger.vars.pinSpacing,
        })));
        const pins = triggers.filter(trigger => trigger.pin);
        const expectedPins = expectedNav.slice(0, -1).map(([, href]) => href.slice(1));
        check('Sete painéis anteriores ao contato usam pin em todos os formatos', JSON.stringify(pins.map(trigger => trigger.pin).sort()) === JSON.stringify(expectedPins.sort()), pins);
        check('Painéis usam scrub true e pinSpacing false', pins.length === 7 && pins.every(trigger => trigger.scrub === true && trigger.pinSpacing === false), pins);
        await checkAssets(page, viewport.width);
        await checkPanelMotion(page, name);
        await checkNavigation(page, mobile);
        await reachFooterAndCapture(page, name);
        check('Sequência não repete ao rolar', (await page.evaluate(() => window.__introEvents.filter(event => event.type === 'animationstart').length)) === 4);
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.waitForTimeout(300);
        check('Movimento reduzido remove pin e restaura fluxo natural', await page.evaluate(() => !document.body.classList.contains('panels-enabled') && !ScrollTrigger.getAll().some(trigger => trigger.pin)));
        await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
        await screenshot(page, `${name}-pagina-completa-reduzida.png`, true);
        await checkNavigation(page, mobile);
        await checkVideoAndFAQ(page);
        check('Console e recursos locais sem erros', errors.length === 0, errors);
      } finally { await context.close(); }
    });
  }

  if (!heroOnly) {
  await testCase('movimento-reduzido', async () => {
    const context = await createContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    try {
      const page = await context.newPage();
      const errors = monitor(page);
      await page.goto(baseURL, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => window.PORTFOLIO_APP?.intro.finished);
      check('Preferência elimina pinagem e elementos iniciais ocultos', await page.evaluate(() => !ScrollTrigger.getAll().some(trigger => trigger.pin) && [...document.querySelectorAll('[data-intro]')].every(node => getComputedStyle(node).visibility === 'visible' && Number(getComputedStyle(node).opacity) === 1)));
      await checkPinyonEverywhere(page, 'movimento reduzido');
      await checkTransparentNavigation(page, 'movimento reduzido');
      await checkNavigation(page, false);
      check('Console reduzido sem erros', errors.length === 0, errors);
    } finally { await context.close(); }
  });

  await testCase('celular-sem-javascript', async () => {
    const context = await createContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, javaScriptEnabled: false, reducedMotion: 'reduce' });
    try {
      const page = await context.newPage();
      await page.goto(baseURL, { waitUntil: 'domcontentloaded' });
      check('Menu sem JavaScript exibe os oito links', await page.locator('#nav-links a:visible').count() === 8 && !(await page.locator('#menu-toggle').isVisible()));
      check('Sem JavaScript mantém conteúdo no fluxo natural sem pin', await page.evaluate(() => !document.body.classList.contains('panels-enabled') && document.querySelectorAll('.pin-spacer').length === 0));
      await checkPinyonEverywhere(page, 'sem JavaScript');
      await checkTransparentNavigation(page, 'sem JavaScript');
      for (const [, href] of expectedNav) {
        await page.locator(`#nav-links a[href="${href}"]`).focus();
        await page.keyboard.press('Enter');
        await page.waitForURL(`**/${href}`);
        check(`Âncora nativa sem JavaScript: ${href}`, new URL(page.url()).hash === href);
      }
      await page.screenshot({ path: resolve(output, 'celular-sem-javascript.png'), fullPage: true });
      report.screenshots.push('celular-sem-javascript.png');
    } finally { await context.close(); }
  });

  await testCase('integracao-temporaria-sem-alterar-configuracao', async () => {
    const context = await createContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
    try {
      const page = await context.newPage();
      const errors = monitor(page);
      // Fixtures interceptadas apenas nesta página. Nenhum arquivo da cliente
      // é modificado e nenhum canal externo é acessado ou acionado.
      await page.route('**/js/config.js', route => route.fulfill({
        status: 200,
        contentType: 'text/javascript; charset=utf-8',
        body: `window.PORTFOLIO_CONFIG = ${JSON.stringify({
          hero: { duration: 0.1, gap: 0 },
          videos: { showreel: '/__qa_video__.mp4', eventos: 'javascript:void(0)', marcas: '', redes: '' },
          contacts: { email: 'qa@example.invalid', whatsapp: 'javascript:void(0)', instagram: 'https://example.invalid/perfil' },
        })};`,
      }));
      await page.route('**/__qa_video__.mp4', route => route.fulfill({ status: 200, contentType: 'video/mp4', body: Buffer.alloc(8) }));
      await page.goto(baseURL, { waitUntil: 'domcontentloaded' });
      await page.locator('.showreel-cover').click();
      await page.locator('#video-dialog').waitFor({ state: 'visible' });
      const source = await page.locator('#video-player').getAttribute('src');
      check('URL configurada entra no player sem autoplay', source === new URL('/__qa_video__.mp4', baseURL).href && !(await page.locator('#video-player').isHidden()) && await page.locator('#video-player').getAttribute('autoplay') === null);
      await page.locator('#video-error').waitFor({ state: 'visible' });
      check('Mídia inválida exibe mensagem acessível de erro', Boolean(await page.locator('#video-error').textContent()) && await page.locator('#video-error').getAttribute('role') === 'status');
      await page.keyboard.press('Escape');
      check('Fechar remove a fonte da mídia', await page.locator('#video-player').getAttribute('src') === null);
      await page.locator('[data-video="eventos"]').click();
      check('Fonte com protocolo inválido continua pendente', await page.locator('#video-placeholder').isVisible() && await page.locator('#video-player').getAttribute('src') === null);
      await page.keyboard.press('Escape');
      check('E-mail de fixture reservado é formatado sem envio', await page.locator('[data-contact="email"]').getAttribute('href') === 'mailto:qa@example.invalid');
      check('Canais inválidos são mantidos inativos', await page.locator('[data-contact="whatsapp"]').getAttribute('href') === null && await page.locator('[data-contact="instagram"]').getAttribute('href') === null);
      check('Integração temporária sem erros JS/HTTP', errors.length === 0, errors);
    } finally { await context.close(); }
  });
  }
} finally {
  await browser.close();
  report.summary = { checks: report.checks.length, passed: report.checks.filter(check => check.passed).length, failed: report.checks.filter(check => !check.passed).length };
  await writeFile(resolve(output, reportName), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  const lines = [
    '# Verificação automatizada do portfólio', '',
    `Navegador: Chrome/Chromium ${report.browser}. Endereço: ${baseURL}.`, '',
    `Resultado: **${report.summary.passed} verificações passaram; ${report.summary.failed} falharam**.`, '',
    '## Cenários', '', ...report.cases.map(test => `- ${test.name}: ${(test.durationMs / 1000).toFixed(1)} s.`), '',
    '## Intervalos medidos da hero', '',
    '| Formato | Cliente → título | Título → menu | Menu → frase |',
    '| --- | ---: | ---: | ---: |',
    ...report.checks.filter(check => check.name.startsWith('Intervalos reais')).map(check => `| ${check.case} | ${check.detail.map(value => value === null ? 'Sem evento' : `${value.toFixed(3)} s`).join(' | ')} |`), '',
    'Cada intervalo começa no evento CSS animationend anterior. A asserção aceita 1,96 a 2,20 s para acomodar a entrega dos eventos em frames do navegador.', '',
    '## Falhas', '', ...(!report.summary.failed ? ['Nenhuma falha automatizada.'] : report.checks.filter(check => !check.passed).map(check => `- ${check.case}: ${check.name}. Consulte os detalhes em ${reportName}.`)), '',
    '## Evidências', '', ...report.screenshots.map(name => `- [${name}](${name})`), '',
    'O relatório JSON registra eventos de animação, intervalos medidos, caminhos de imagens e erros de console/rede.', '',
    liveFonts ? 'A execução utilizou a rede real da fonte Google. Falhas externas são registradas separadamente.' : 'A resposta CSS externa do Google foi interceptada somente no navegador de testes com CSS vazio. O HTML conserva o link original e a fonte utilizada é Pinyon Script do arquivo local em vendor. Não foi feita medição de velocidade da rede Google. Use --live-font-network para repetir sem interceptação.', '',
    'As capturas com sufixo pagina-completa-reduzida mostram o conteúdo inteiro no fluxo acessível, sem pinagem. As capturas conteudo-inicial/conteudo-final e transicao mostram os painéis durante a animação normal; no modo animado o conteúdo longo é revelado pela fase de fake scroll.', '',
    'Os testes não substituem a avaliação humana dos enquadramentos e da composição. Não foram fornecidos vídeos, biografia, depoimentos ou canais comerciais reais; a integração de reprodução com conteúdo final permanece pendente.', '',
  ];
  await writeFile(resolve(output, markdownName), lines.join('\n'), 'utf8');
  console.log(JSON.stringify(report.summary));
  if (report.summary.failed) process.exitCode = 1;
}
