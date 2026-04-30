import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const root = process.cwd();
const port = Number(process.env.PORT || 4173);
const basePath = (process.env.BASE_PATH || '/RetroWeatherCast/').replace(/^([^/])/, '/$1').replace(/([^/])$/, '$1/');

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
  let pathname = decoded === '/' ? '/index.html' : decoded;
  if (pathname === basePath.slice(0, -1)) pathname = '/index.html';
  if (pathname.startsWith(basePath)) pathname = `/${pathname.slice(basePath.length) || 'index.html'}`;
  const relative = pathname.replace(/^\/+/, '');
  const filePath = normalize(join(root, relative));
  return filePath.startsWith(root) ? filePath : null;
}

createServer(async (req, res) => {
  const filePath = resolvePath(req.url || '/');
  if (!filePath) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  try {
    const info = await stat(filePath);
    const finalPath = info.isDirectory() ? join(filePath, 'index.html') : filePath;
    const type = mime[extname(finalPath).toLowerCase()] || 'application/octet-stream';
    res.writeHead(200, {
      'content-type': type,
      'cache-control': 'no-store',
      'access-control-allow-origin': '*',
    });
    createReadStream(finalPath).pipe(res);
  } catch {
    res.writeHead(404);
    res.end('Not found');
  }
}).listen(port, () => {
  console.log(`RetroWeatherCast running at http://localhost:${port}/`);
});
