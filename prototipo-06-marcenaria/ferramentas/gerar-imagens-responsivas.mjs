#!/usr/bin/env node
/**
 * Gera versões WebP responsivas das fotos do site (para srcset/sizes), sem alterar os originais.
 *
 * Uso (na raiz do projeto):
 *   node ferramentas/gerar-imagens-responsivas.mjs
 *
 * Requisitos: Node 22+ (WebSocket nativo) e Google Chrome ou Microsoft Edge instalados.
 * Outro navegador Chromium pode ser indicado pela variável de ambiente CHROME_PATH.
 *
 * O que faz:
 * - Lê todas as PNG/JPG de public/imagens/ (exceto public/imagens/responsivas/) e as fontes extras
 *   listadas em EXTRA_SOURCES (referências usadas no site).
 * - Para cada imagem, gera public/imagens/responsivas/<pasta>/<nome>-<largura>.webp nas larguras
 *   de WIDTHS menores que a original e, se a original tiver menos de 1920 px, uma versão "-full"
 *   na largura original. A redução é feita pelo próprio Chrome (canvas, em etapas, alta qualidade).
 * - Escreve public/imagens/responsivas/manifesto.json com larguras e alturas de cada variante.
 * - É incremental: pula imagens cujas variantes já existem e são mais novas que a original.
 * - Limpa: se uma original foi apagada, as variantes WebP dela saem do disco e do manifesto.
 *
 * Depois de adicionar uma foto nova (por exemplo, gerada no Higgsfield), rode o script e use as
 * variantes no HTML com srcset (ver README, seção "Fotos responsivas").
 */
import http from 'node:http';
import net from 'node:net';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE_DIR = path.join(ROOT, 'public', 'imagens');
const OUT_DIR = path.join(SOURCE_DIR, 'responsivas');
const WIDTHS = [480, 960, 1440, 1920];
const QUALITY = 0.82;

/** Fontes fora de public/imagens usadas no site → nome de saída (sem extensão).
 *  Ex.: { 'referencias/pasta/foto.png': 'servicos/nome-da-foto' }. Hoje todas ficam em public/imagens/. */
const EXTRA_SOURCES = {};

/** Larguras próprias para imagens pequenas na tela (ex.: logo de 46–72 px). */
const CUSTOM_WIDTHS = {
  logo: [96, 192, 384],
};

const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.html': 'text/html' };

function listSources() {
  const sources = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (full !== OUT_DIR) walk(full);
      } else if (/\.(png|jpe?g)$/i.test(entry.name)) {
        const rel = path.relative(SOURCE_DIR, full).replace(/\\/g, '/');
        sources.push({ file: full, url: `/public/imagens/${rel}`, name: rel.replace(/\.(png|jpe?g)$/i, '') });
      }
    }
  };
  walk(SOURCE_DIR);
  for (const [rel, name] of Object.entries(EXTRA_SOURCES)) {
    const full = path.join(ROOT, rel);
    if (fs.existsSync(full)) sources.push({ file: full, url: `/${rel}`, name });
    else console.warn(`Fonte extra não encontrada: ${rel}`);
  }
  return sources;
}

function startServer() {
  const server = http.createServer((req, res) => {
    const urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (urlPath === '/') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end('<!doctype html><title>gerador</title>');
      return;
    }
    const file = path.join(ROOT, urlPath);
    if (!file.startsWith(ROOT) || !fs.existsSync(file)) {
      res.writeHead(404);
      res.end();
      return;
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server)));
}

function freePort() {
  return new Promise((resolve) => {
    const probe = net.createServer();
    probe.listen(0, '127.0.0.1', () => {
      const { port } = probe.address();
      probe.close(() => resolve(port));
    });
  });
}

function findChrome() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const candidates = [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ];
  const found = candidates.find((candidate) => fs.existsSync(candidate));
  if (!found) throw new Error('Chrome/Edge não encontrado. Defina CHROME_PATH com o caminho do navegador.');
  return found;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function openBrowser(pageUrl) {
  const port = await freePort();
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'pinson-imagens-'));
  const browser = spawn(findChrome(), [
    '--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`,
    '--no-first-run', '--no-default-browser-check', pageUrl,
  ], { stdio: 'ignore' });

  let targets = [];
  for (let attempt = 0; attempt < 60 && !targets.length; attempt += 1) {
    await sleep(250);
    try {
      targets = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).filter((t) => t.type === 'page');
    } catch { /* navegador ainda iniciando */ }
  }
  if (!targets.length) throw new Error('Não foi possível conectar ao navegador.');

  const socket = new WebSocket(targets[0].webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  let id = 0;
  const pending = new Map();
  socket.onmessage = (message) => {
    const data = JSON.parse(message.data);
    if (data.id && pending.has(data.id)) {
      const { resolve, reject } = pending.get(data.id);
      pending.delete(data.id);
      if (data.error) reject(new Error(data.error.message));
      else resolve(data.result);
    }
  };
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    id += 1;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
  // Só processa depois que a página do servidor local carregou: avaliar ainda na aba inicial
  // (about:blank) faz o Chrome bloquear o acesso a 127.0.0.1 ("Failed to fetch").
  const expected = new URL(pageUrl).origin;
  await send('Page.navigate', { url: pageUrl });
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const { result } = await send('Runtime.evaluate', { expression: 'document.readyState === "complete" && location.origin', returnByValue: true });
    if (result.value === expected) break;
    await sleep(250);
  }
  return {
    send,
    close() {
      socket.close();
      browser.kill();
      setTimeout(() => fs.rmSync(profile, { recursive: true, force: true }), 1500);
    },
  };
}

/** Executada dentro do Chrome: decodifica, reduz em etapas e exporta WebP. */
const RESIZE_IN_PAGE = `async (url, targets, quality) => {
  const image = new Image();
  image.src = url;
  await image.decode();
  const results = [];
  for (const width of targets) {
    const height = Math.round(image.naturalHeight * width / image.naturalWidth);
    let source = image;
    let sw = image.naturalWidth;
    let sh = image.naturalHeight;
    while (sw / 2 >= width) {
      const step = document.createElement('canvas');
      step.width = Math.round(sw / 2);
      step.height = Math.round(sh / 2);
      const stepContext = step.getContext('2d');
      stepContext.imageSmoothingQuality = 'high';
      stepContext.drawImage(source, 0, 0, step.width, step.height);
      source = step;
      sw = step.width;
      sh = step.height;
    }
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    context.imageSmoothingQuality = 'high';
    context.drawImage(source, 0, 0, width, height);
    results.push({ width, height, data: canvas.toDataURL('image/webp', quality) });
  }
  return { naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight, results };
}`;

function plannedWidths(name, naturalWidth) {
  const base = path.basename(name);
  if (CUSTOM_WIDTHS[base]) return CUSTOM_WIDTHS[base].filter((w) => w <= naturalWidth).map((w) => ({ w, suffix: String(w) }));
  const list = WIDTHS.filter((w) => w < naturalWidth).map((w) => ({ w, suffix: String(w) }));
  if (naturalWidth < WIDTHS[WIDTHS.length - 1]) list.push({ w: naturalWidth, suffix: 'full' });
  return list;
}

function readDimensions(file) {
  const buffer = fs.readFileSync(file);
  if (buffer.toString('ascii', 1, 4) === 'PNG') return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  // JPEG: procura o marcador SOF
  let offset = 2;
  while (offset < buffer.length) {
    const marker = buffer[offset + 1];
    const size = buffer.readUInt16BE(offset + 2);
    if (marker >= 0xc0 && marker <= 0xc3) return { width: buffer.readUInt16BE(offset + 7), height: buffer.readUInt16BE(offset + 5) };
    offset += 2 + size;
  }
  throw new Error(`Dimensões não encontradas: ${file}`);
}

/** Remove do manifesto (e do disco) as variantes de fotos cuja original foi apagada. */
function pruneRemovedSources(manifest, sources) {
  const names = new Set(sources.map((source) => source.name));
  for (const [name, entry] of Object.entries(manifest)) {
    if (names.has(name)) continue;
    for (const { arquivo } of entry.variantes ?? []) fs.rmSync(path.join(ROOT, arquivo), { force: true });
    delete manifest[name];
    console.log(`✖ ${name}: original removida; variantes WebP apagadas`);
  }
}

async function main() {
  const sources = listSources();
  const manifestFile = path.join(OUT_DIR, 'manifesto.json');
  const manifest = fs.existsSync(manifestFile) ? JSON.parse(fs.readFileSync(manifestFile, 'utf8')) : {};
  pruneRemovedSources(manifest, sources);
  const server = await startServer();
  const origin = `http://127.0.0.1:${server.address().port}`;
  const browser = await openBrowser(`${origin}/`);
  let generated = 0;

  try {
    for (const source of sources) {
      const { width: naturalWidth, height: naturalHeight } = readDimensions(source.file);
      const plan = plannedWidths(source.name, naturalWidth);
      const sourceTime = fs.statSync(source.file).mtimeMs;
      const outputs = plan.map(({ w, suffix }) => ({ w, file: path.join(OUT_DIR, `${source.name}-${suffix}.webp`) }));
      const upToDate = outputs.every(({ file }) => fs.existsSync(file) && fs.statSync(file).mtimeMs >= sourceTime);

      if (!upToDate) {
        const expression = `(${RESIZE_IN_PAGE})(${JSON.stringify(origin + source.url)}, ${JSON.stringify(plan.map((p) => p.w))}, ${QUALITY})`;
        const { result, exceptionDetails } = await browser.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
        if (exceptionDetails) throw new Error(`Falha ao processar ${source.name}: ${exceptionDetails.exception?.description || exceptionDetails.text}`);
        result.value.results.forEach((item, index) => {
          const { file } = outputs[index];
          fs.mkdirSync(path.dirname(file), { recursive: true });
          fs.writeFileSync(file, Buffer.from(item.data.split(',')[1], 'base64'));
          generated += 1;
        });
        console.log(`✔ ${source.name}: ${plan.map((p) => p.w).join(', ')} px`);
      }

      manifest[source.name] = {
        origem: path.relative(ROOT, source.file).replace(/\\/g, '/'),
        largura: naturalWidth,
        altura: naturalHeight,
        variantes: plan.map(({ w, suffix }) => ({
          arquivo: `public/imagens/responsivas/${source.name}-${suffix}.webp`,
          largura: w,
          altura: Math.round((naturalHeight * w) / naturalWidth),
        })),
      };
    }
  } finally {
    browser.close();
    server.close();
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`Concluído: ${generated} arquivo(s) gerado(s); manifesto em public/imagens/responsivas/manifesto.json`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
