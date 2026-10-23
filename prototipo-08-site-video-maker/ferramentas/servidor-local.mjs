import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { realpath, stat } from 'node:fs/promises';
import { dirname, extname, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = await realpath(resolve(dirname(fileURLToPath(import.meta.url)), '..'));
const port = Number(process.env.PORT || 8088);
const host = '127.0.0.1';

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT deve ser um número inteiro entre 1 e 65535.');
}

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.vtt': 'text/vtt; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/plain; charset=utf-8',
  '.pdf': 'application/pdf'
};

function isInsideRoot(path) {
  const difference = relative(root, path);
  return difference === '' || (!isAbsolute(difference) && difference !== '..' && !difference.startsWith(`..${sep}`));
}

function sendText(request, response, statusCode, message, extraHeaders = {}) {
  const body = `${message}\n`;
  response.writeHead(statusCode, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    ...extraHeaders
  });
  response.end(request.method === 'HEAD' ? undefined : body);
}

function readRange(value, size) {
  const match = /^bytes=(\d*)-(\d*)$/.exec(value);
  if (!match || (!match[1] && !match[2]) || size === 0) return null;

  let start;
  let end;
  if (!match[1]) {
    const suffixLength = Number(match[2]);
    if (!Number.isSafeInteger(suffixLength) || suffixLength <= 0) return null;
    start = Math.max(0, size - suffixLength);
    end = size - 1;
  } else {
    start = Number(match[1]);
    end = match[2] ? Number(match[2]) : size - 1;
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end)) return null;
    if (start >= size || start > end) return null;
    end = Math.min(end, size - 1);
  }
  return { start, end };
}

const server = createServer(async (request, response) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    sendText(request, response, 405, 'Método não permitido.', { Allow: 'GET, HEAD' });
    return;
  }

  try {
    // Inspeciona o caminho original antes de qualquer normalização de URL.
    const rawPath = (request.url || '/').split('?')[0];
    let pathname;
    try {
      pathname = decodeURIComponent(rawPath);
    } catch {
      sendText(request, response, 400, 'Caminho inválido.');
      return;
    }

    const segments = pathname.split('/');
    if (!pathname.startsWith('/') || pathname.includes('\\') || /[\x00-\x1f\x7f]/.test(pathname)) {
      sendText(request, response, 400, 'Caminho inválido.');
      return;
    }
    if (segments.some(segment => segment.startsWith('.') || segment.includes(':'))) {
      sendText(request, response, 403, 'Acesso não permitido.');
      return;
    }

    let filePath = resolve(root, `.${pathname}`);
    if (!isInsideRoot(filePath)) {
      sendText(request, response, 403, 'Acesso não permitido.');
      return;
    }

    let info = await stat(filePath);
    if (info.isDirectory()) {
      filePath = resolve(filePath, 'index.html');
      info = await stat(filePath);
    }

    const canonicalPath = await realpath(filePath);
    if (!isInsideRoot(canonicalPath) || !info.isFile()) {
      sendText(request, response, 403, 'Acesso não permitido.');
      return;
    }

    const headers = {
      'Content-Type': mimeTypes[extname(canonicalPath).toLowerCase()] || 'application/octet-stream',
      'Content-Length': info.size,
      'Cache-Control': 'no-store',
      'Accept-Ranges': 'bytes',
      'X-Content-Type-Options': 'nosniff'
    };

    // Suporta busca no vídeo ao integrar arquivos MP4/WebM locais.
    let range;
    if (request.headers.range) {
      range = readRange(request.headers.range, info.size);
      if (!range) {
        sendText(request, response, 416, 'Intervalo inválido.', { 'Content-Range': `bytes */${info.size}` });
        return;
      }
      headers['Content-Range'] = `bytes ${range.start}-${range.end}/${info.size}`;
      headers['Content-Length'] = range.end - range.start + 1;
    }

    response.writeHead(range ? 206 : 200, headers);
    if (request.method === 'HEAD') {
      response.end();
      return;
    }

    const stream = createReadStream(canonicalPath, range || undefined);
    stream.on('error', () => response.destroy());
    response.on('close', () => stream.destroy());
    stream.pipe(response);
  } catch (error) {
    const missing = error.code === 'ENOENT' || error.code === 'ENOTDIR';
    if (!response.headersSent) sendText(request, response, missing ? 404 : 500, missing ? 'Arquivo não encontrado.' : 'Não foi possível abrir o arquivo.');
    else response.destroy();
  }
});

server.on('error', error => {
  console.error(error.code === 'EADDRINUSE' ? `A porta ${port} já está em uso. Defina PORT para escolher outra.` : error.message);
  process.exitCode = 1;
});

server.listen(port, host, () => {
  console.log(`Portfólio disponível em http://${host}:${port}`);
  console.log('Use Ctrl+C para encerrar.');
});
