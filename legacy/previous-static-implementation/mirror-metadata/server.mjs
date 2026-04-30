import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { extname, join, normalize } from 'node:path';

const root = process.cwd();
const port = Number(process.env.PORT || 4173);
const mime = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.woff2': 'font/woff2',
};

function resolvePath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  const pathname = decoded === '/' ? '/retro/' : decoded;
  const relative = pathname === '/retro/' ? 'retro/index.html' : pathname.replace(/^\/+/, '');
  const filePath = normalize(join(root, relative));
  if (!filePath.startsWith(root)) return null;
  return filePath;
}

createServer(async (req, res) => {
  let filePath = resolvePath(req.url || '/');
  if (!filePath) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  try {
    const info = await stat(filePath);
    if (info.isDirectory()) filePath = join(filePath, 'index.html');
    const type = mime[extname(filePath).toLowerCase()] || 'application/octet-stream';
    res.writeHead(200, {
      'content-type': type,
      'cache-control': 'no-store',
      'access-control-allow-origin': '*',
    });
    createReadStream(filePath).pipe(res);
  } catch {
    const acceptsHtml = (req.headers.accept || '').includes('text/html');
    const hasFileExtension = /\.[a-z0-9]+$/i.test((req.url || '').split('?')[0]);
    if (acceptsHtml || !hasFileExtension) {
      try {
      const fallback = await readFile(join(root, 'retro/index.html'));
      res.writeHead(200, { 'content-type': mime['.html'], 'cache-control': 'no-store' });
      res.end(fallback);
        return;
      } catch {
        // Fall through to 404 below.
      }
    }

    res.writeHead(404);
    res.end('Not found');
  }
}).listen(port, () => {
  console.log(`Retro mirror running at http://localhost:${port}/retro/`);
});
