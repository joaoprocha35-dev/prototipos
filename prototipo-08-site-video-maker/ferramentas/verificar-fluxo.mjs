import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const output = fileURLToPath(new URL('../docs/verificacao/', import.meta.url));
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const report = { checks: [], errors: [] };
function check(name, passed) { report.checks.push({ name, passed: !!passed }); assert.ok(passed, name); }
try {
  for (const [width, height] of [[1440, 900], [390, 844], [360, 800]]) {
    const page = await browser.newPage({ viewport: { width, height } });
    page.on('pageerror', e => report.errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') report.errors.push(m.text()); });
    await page.addInitScript(() => {
      window.entries = []; window.entryDetails = []; window.headingEntries = new Set();
      document.addEventListener('animationstart', e => {
        window.entries.push(e.target.id);
        window.entryDetails.push({ name: e.animationName, hero: !!e.target.closest('.hero'), nav: !!e.target.closest('#nav-links') });
        if (e.target.matches('h2, h3')) window.headingEntries.add(e.target);
      });
    });
    await page.goto(process.env.SITE_URL || 'http://127.0.0.1:8088');
    await page.evaluate(() => document.fonts.ready);
    await page.waitForFunction(() => window.PORTFOLIO_APP?.intro.finished);
    const s = await page.evaluate(() => ({
      entries: window.entries, pins: document.querySelectorAll('.pin-spacer').length,
      plugin: !!window.ScrollToPlugin, clientAnimation: getComputedStyle(document.querySelector('.hero-portrait')).animationName,
      bg: document.querySelector('.hero-background').getAttribute('src'), client: document.querySelector('.hero-portrait').getAttribute('src'),
      font: getComputedStyle(document.querySelector('p')).fontFamily, cursor: getComputedStyle(document.querySelector('p')).cursor,
      overflow: document.documentElement.scrollWidth > innerWidth,
      layers: +getComputedStyle(document.querySelector('.hero-portrait-position')).zIndex > +getComputedStyle(document.querySelector('.hero-title-position')).zIndex,
      fits: document.querySelector('h1').scrollWidth <= document.querySelector('h1').clientWidth + 2,
    }));
    check(`${width}: título e links em cascata`, s.entries.filter(id => id === 'hero-title').length === 1 && await page.evaluate(expected => entryDetails.filter(e => e.nav && e.name === 'fadeInDown').length === expected, width > 800 ? 8 : 0));
    check(`${width}: todos os textos visíveis da hero animam`, await page.evaluate(expected => entryDetails.filter(e => e.hero && e.name === 'fadeInDown').length === expected && !document.querySelector('.hero [data-motion-pending]'), width > 800 ? 8 : 7));
    check(`${width}: chamada para rolar disponível`, await page.locator('.hero-scroll').isVisible());
    const arrowPositions = [];
    for (let i = 0; i < 3; i++) {
      arrowPositions.push(await page.evaluate(() => +gsap.getProperty('.scroll-arrow', 'y')));
      await page.waitForTimeout(180);
    }
    check(`${width}: seta se movimenta`, Math.max(...arrowPositions) - Math.min(...arrowPositions) > .5);
    check(`${width}: cliente estática e fluxo sem pin`, s.clientAnimation === 'none' && s.pins === 0);
    check(`${width}: ScrollToPlugin`, s.plugin);
    check(`${width}: assets preservados`, s.bg === 'referencia-hero/fundo-hero.png' && s.client === 'referencia-hero/imagem-cliente.png');
    check(`${width}: fonte normal e pointer global`, s.font.includes('Arial') && s.cursor === 'pointer');
    check(`${width}: título inteiro atrás da cliente`, s.layers && s.fits);
    check(`${width}: sem overflow`, !s.overflow);
    check(`${width}: seções ocupam largura inteira`, await page.evaluate(() => [...document.querySelectorAll('main section')].every(e => Math.abs(e.offsetWidth - innerWidth) <= 1)));
    check(`${width}: barra lateral oculta`, await page.evaluate(() => getComputedStyle(document.documentElement).scrollbarWidth === 'none'));
    check(`${width}: imagem sobre cobre a seção`, await page.evaluate(() => { const a = document.querySelector('.about').getBoundingClientRect(); const b = document.querySelector('.about-visual').getBoundingClientRect(); return Math.abs(a.width-b.width) < 1 && Math.abs(a.height-b.height) < 1; }));
    check(`${width}: fundo preto em toda a página`, await page.evaluate(() => [document.body, document.querySelector('.site-content'), ...document.querySelectorAll('main section')].every(e => { const css = getComputedStyle(e); return css.backgroundColor === 'rgb(0, 0, 0)' && css.backgroundImage === 'none'; })));
    for (const [section, visual, copy, basename, faceClearance] of [
      ['sobre-mim', '.about-visual', '.about-copy', 'secao-sobre-mim', .8],
      ['vamos-conversar', '.contact-visual', '.contact-heading', 'secao-vamos-conversar', 1],
    ]) {
      const portrait = page.locator(`${visual} img`);
      await portrait.evaluate(async img => { img.loading = 'eager'; await img.decode(); });
      check(`${width}: ${section} seleciona a imagem correta`, await portrait.evaluate((img, filename) => img.currentSrc.endsWith(filename), `${basename}-${width <= 800 ? 'celular' : 'computador'}.png`));
      if (width <= 800) {
        // Safe areas observed in the supplied 752×1344 portraits leave the face unobstructed.
        check(`${width}: ${section} mantém proporção e texto abaixo do rosto`, await page.evaluate(({ visual, copy, faceClearance }) => {
          const img = document.querySelector(`${visual} img`).getBoundingClientRect();
          const text = document.querySelector(copy).getBoundingClientRect();
          return Math.abs(img.height / img.width - 1344 / 752) < .01 && text.top >= img.top + img.width * faceClearance;
        }, { visual, copy, faceClearance }));
      }
      await page.locator(`#${section}`).screenshot({ path: `${output}retratos-${section}-${width}.png` });
    }
    check(`${width}: lâmpada inteira e fundo uniforme`, await page.locator('.process-image-bulb img').evaluate(e => getComputedStyle(e).objectFit === 'contain' && getComputedStyle(e.parentElement).backgroundColor === 'rgb(0, 0, 0)'));
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({ path: `${output}fluxo-${width}.png` });
    for (const id of ['portfolio', 'sobre-mim', 'servicos', 'como-trabalho', 'depoimentos', 'duvidas', 'vamos-conversar', 'inicio']) {
      if (width <= 800) await page.locator('#menu-toggle').click();
      await page.locator(`#nav-links a[href="#${id}"]`).click();
      await page.waitForFunction(id => {
        const e = document.getElementById(id);
        const y = Math.max(0, Math.min(scrollY + e.getBoundingClientRect().top - 120, document.documentElement.scrollHeight - innerHeight));
        return Math.abs(scrollY - y) < 2;
      }, id);
      check(`${width}: link ${id}`, await page.evaluate(id => document.activeElement.id === id, id));
      if (id !== 'inicio') check(`${width}: título de ${id} usa fadeInDown`, await page.locator(`#${id} h2`).first().evaluate(e => window.headingEntries.has(e)));
    }
    await page.mouse.wheel(0, 500);
    await page.waitForTimeout(1000);
    check(`${width}: deslizamento`, await page.evaluate(() => scrollY >= 495 && scrollY <= 505));
    if (width === 1440) {
      await page.mouse.wheel(0, 300);
      await page.waitForTimeout(80);
      check('Roda progride gradualmente', await page.evaluate(() => scrollY > 500 && scrollY < 800));
      await page.mouse.wheel(0, 300);
      await page.waitForTimeout(1050);
      check('Roda acumula gestos consecutivos', await page.evaluate(() => Math.abs(scrollY - 1100) < 3));
      await page.mouse.wheel(0, 300);
      await page.waitForTimeout(80);
      const beforeReverse = await page.evaluate(() => scrollY);
      await page.mouse.wheel(0, -200);
      await page.waitForTimeout(1050);
      check('Inversão da roda responde imediatamente', await page.evaluate(y => scrollY < y - 100, beforeReverse));
      await page.locator('#nav-links a[href="#vamos-conversar"]').click();
      await page.waitForTimeout(150);
      await page.keyboard.press('Escape');
      const stopped = await page.evaluate(() => scrollY);
      await page.waitForTimeout(250);
      check('Teclado interrompe a navegação animada', await page.evaluate(y => Math.abs(scrollY - y) < 2, stopped));
    }
    await page.locator('summary').first().click();
    check(`${width}: FAQ`, await page.locator('details').first().evaluate(e => e.open));
    await page.locator('[data-video="showreel"]').first().click();
    check(`${width}: modal`, await page.locator('#video-dialog').evaluate(e => e.open));
    await page.waitForTimeout(50);
    check(`${width}: título do modal animado`, await page.locator('#video-title').evaluate(e => window.headingEntries.has(e)));
    await page.keyboard.press('Escape');
    if (width === 1440) {
      const card = page.locator('.testimonial-viewport');
      const index = () => page.locator('.testimonial-carousel').getAttribute('data-index');
      await card.scrollIntoViewIfNeeded();
      await page.mouse.move(1, 1);
      await page.evaluate(() => document.activeElement.blur());
      let before = await index();
      await page.waitForTimeout(3200);
      check('Carrossel troca após 3 segundos', await index() !== before);
      await card.hover(); before = await index();
      await page.waitForTimeout(3200);
      check('Carrossel pausa no hover', await index() === before);
      await page.mouse.down(); await page.mouse.move(1, 1);
      before = await index(); await page.waitForTimeout(3200);
      check('Carrossel pausa ao segurar', await index() === before);
      await page.mouse.up();
      await page.waitForTimeout(3200);
      check('Carrossel retoma após soltar e sair', await index() !== before);
      await page.locator('[data-carousel-next]').click();
      check('Controle do carrossel funciona', await index() !== before);
    }
    await page.evaluate(async () => {
      for (const i of document.images) { i.loading = 'eager'; await i.decode().catch(() => {}); }
      for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight * .65) {
        scrollTo(0, y); await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      }
    });
    await page.waitForTimeout(1300);
    check(`${width}: todos os títulos do conteúdo receberam a entrada`, await page.evaluate(() => [...document.querySelectorAll('main h2, main h3')].filter(e => !e.closest('[hidden]')).every(e => window.headingEntries.has(e))));
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({ path: `${output}fluxo-completo-${width}.png`, fullPage: true });
    await page.close();
  }
  const p = await browser.newPage({ reducedMotion: 'reduce' });
  await p.goto('http://127.0.0.1:8088');
  check('Movimento reduzido', await p.evaluate(() => !document.querySelector('.animate__animated, .pin-spacer')));
  await p.locator('.about-visual img, .contact-visual img').evaluateAll(images => images.forEach(img => { img.loading = 'eager'; }));
  for (const width of [800, 801, 390]) {
    await p.setViewportSize({ width, height: 900 });
    await p.waitForFunction(device => [...document.querySelectorAll('.about-visual img, .contact-visual img')].every(img => img.currentSrc.endsWith(`-${device}.png`)), width <= 800 ? 'celular' : 'computador');
    check(`Redimensionar para ${width} px atualiza os dois retratos`, true);
  }
  await p.close();
  const touchPage = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  touchPage.on('pageerror', e => report.errors.push(e.message));
  await touchPage.goto(process.env.SITE_URL || 'http://127.0.0.1:8088');
  await touchPage.waitForFunction(() => window.PORTFOLIO_APP?.intro.finished);
  await touchPage.locator('.hero-scroll').tap();
  await touchPage.waitForTimeout(120);
  check('Celular real: link desliza gradualmente', await touchPage.evaluate(() => scrollY > 0 && scrollY < 650));
  await touchPage.waitForFunction(() => Math.abs(document.querySelector('#portfolio').getBoundingClientRect().top - 120) < 2);
  const beforeTouch = await touchPage.evaluate(() => scrollY);
  const client = await touchPage.context().newCDPSession(touchPage);
  await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 190, y: 650 }] });
  for (const y of [560, 470, 380, 290, 200]) {
    await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 190, y }] });
    await touchPage.waitForTimeout(35);
  }
  await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await touchPage.waitForTimeout(500);
  check('Celular real: gesto de toque mantém rolagem livre', await touchPage.evaluate(y => scrollY > y + 150, beforeTouch));
  await touchPage.emulateMedia({ reducedMotion: 'reduce' });
  await touchPage.waitForTimeout(100);
  check('Alterar preferência desativa entradas e seta', await touchPage.evaluate(() => !document.querySelector('.animate__animated, [data-motion-pending]') && getComputedStyle(document.querySelector('.scroll-arrow')).transform === 'none' && gsap.getTweensOf(window).length === 0));
  await touchPage.close();
  check('Console sem erros', report.errors.length === 0);
} catch (e) { report.errors.push(e.message); process.exitCode = 1; }
finally {
  await browser.close();
  await writeFile(`${output}relatorio-fluxo.json`, JSON.stringify(report, null, 2));
  await writeFile(`${output}verificacao-fluxo.md`, `# Verificação atual\n\n${report.checks.filter(c => c.passed).length}/${report.checks.length} verificações passaram.\n\n${report.errors.join('\n') || 'Sem erros de JavaScript.'}\n\nFormatos: 1440×900, 390×844 e 360×800. Capturas: fluxo-*.png e fluxo-completo-*.png.\n`);
  console.log(JSON.stringify({ passed: report.checks.filter(c => c.passed).length, total: report.checks.length, errors: report.errors }));
}
