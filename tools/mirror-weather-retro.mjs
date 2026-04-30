import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import { dirname, join, posix } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { pathToFileURL } from 'node:url';

const START_URL = 'https://weather.com/retro/';
const OUT_DIR = join(process.cwd(), 'mirror');
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const textTypes = new Set([
  '.css',
  '.html',
  '.js',
  '.json',
  '.mjs',
  '.svg',
  '.txt',
  '.webmanifest',
  '.xml',
]);

const seen = new Set();
const queue = [];
const downloaded = [];
let googleFontsCssPath = null;

function enqueue(rawUrl, fromUrl = START_URL) {
  if (!rawUrl) return;

  const cleaned = rawUrl
    .replace(/&amp;/g, '&')
    .replace(/^['"]|['"]$/g, '')
    .trim();

  if (
    !cleaned ||
    cleaned.startsWith('data:') ||
    cleaned.startsWith('blob:') ||
    cleaned.startsWith('mailto:') ||
    cleaned.startsWith('tel:') ||
    cleaned.startsWith('#')
  ) {
    return;
  }

  let url;
  try {
    url = new URL(cleaned, fromUrl);
  } catch {
    return;
  }

  if (!isDownloadable(url)) return;

  const key = url.toString();
  if (seen.has(key)) return;
  seen.add(key);
  queue.push(url);
}

function isDownloadable(url) {
  if (url.hostname === 'weather.com') {
    if (/%7B|%7D|\$/i.test(url.pathname)) return false;
    if (url.pathname === '/retro/' || url.pathname === '/retro') return true;
    if (!url.pathname.startsWith('/retro/_nuxt/') && !url.pathname.startsWith('/retro/assets/')) {
      return false;
    }

    return /\.(?:css|js|mjs|json|webmanifest|png|jpe?g|gif|svg|mp3|mp4|webm|woff2?)$/i.test(
      url.pathname,
    );
  }

  if (url.hostname === 'fonts.googleapis.com') return url.pathname.startsWith('/css2');
  if (url.hostname === 'fonts.gstatic.com') return /\.woff2?$/i.test(url.pathname);

  return false;
}

function extname(url) {
  const ext = posix.extname(url.pathname).toLowerCase();
  if (url.hostname === 'fonts.googleapis.com') return '.css';
  if (!ext && url.pathname.endsWith('/')) return '.html';
  return ext || '.bin';
}

function isTextResource(url, contentType = '') {
  const lowerType = contentType.toLowerCase();
  if (
    lowerType.includes('text/') ||
    lowerType.includes('javascript') ||
    lowerType.includes('json') ||
    lowerType.includes('manifest') ||
    lowerType.includes('svg') ||
    lowerType.includes('xml')
  ) {
    return true;
  }

  return textTypes.has(extname(url));
}

function localPublicPath(url) {
  if (url.hostname === 'weather.com') {
    if (url.pathname === '/retro/' || url.pathname === '/retro') return '/retro/index.html';
    return url.pathname;
  }

  if (url.hostname === 'fonts.googleapis.com') {
    return '/retro/local/google-fonts.css';
  }

  if (url.hostname === 'fonts.gstatic.com') {
    const filename = posix.basename(url.pathname);
    return `/retro/local/fonts/${filename}`;
  }

  throw new Error(`No local path rule for ${url}`);
}

function localFilePath(url) {
  return join(OUT_DIR, localPublicPath(url));
}

function rewriteText(text, url) {
  let rewritten = text;

  rewritten = rewritten.replaceAll('https://weather.com/retro/', '/retro/');
  rewritten = rewritten.replaceAll('https://weather.com/retro', '/retro');
  rewritten = rewritten.replace(/mapboxApiToken:"[^"]*"/g, 'mapboxApiToken:""');
  rewritten = rewritten.replace(/weatherApiKey:"[^"]*"/g, 'weatherApiKey:""');
  rewritten = rewritten.replace(/pusherKey:"[^"]*"/g, 'pusherKey:""');
  rewritten = rewritten.replace(/pusherCluster:"[^"]*"/g, 'pusherCluster:""');
  rewritten = rewritten.replace(/partyHost:"[^"]*"/g, 'partyHost:""');
  rewritten = rewritten.replace(/pk\.eyJ[A-Za-z0-9._-]+/g, '');

  if (url.hostname === 'weather.com' && url.pathname === '/retro/') {
    rewritten = rewritten.replace(
      /https:\/\/fonts\.googleapis\.com\/css2\?family=Martian\+Mono:[^"']+/g,
      '/retro/local/google-fonts.css',
    );
    rewritten = rewritten.replace(
      /<link rel="preconnect" href="https:\/\/fonts\.(?:googleapis|gstatic)\.com"[^>]*>/g,
      '',
    );
    rewritten = rewritten.replace(/<script\s*>bazadebezolkohpepadr="[^"]*"<\/script>/g, '');
    rewritten = rewritten.replace(
      /<script[^>]+src="https:\/\/weather\.com\/akam\/[^"]+"[^>]*><\/script>/g,
      '',
    );
    rewritten = rewritten.replace(
      /<noscript><img src="https:\/\/weather\.com\/akam\/[^"]+"[^>]*><\/noscript>/g,
      '',
    );
    rewritten = rewritten.replace(/gtmId:"[^"]*"/g, 'gtmId:""');
  }

  if (url.hostname === 'fonts.googleapis.com') {
    rewritten = rewritten.replace(
      /https:\/\/fonts\.gstatic\.com\/[^)'"\s]+/g,
      match => {
        enqueue(match, url.toString());
        return localPublicPath(new URL(match));
      },
    );
  }

  if (url.hostname === 'weather.com' && url.pathname.startsWith('/retro/_nuxt/')) {
    rewritten = rewritten.replace(/dynamicResourcesSSG:!1/g, 'dynamicResourcesSSG:!0');
  }

  return rewritten;
}

function extractReferences(text, fromUrl) {
  const attrPattern = /\b(?:href|src|poster)=["']([^"']+)["']/gi;
  for (const match of text.matchAll(attrPattern)) enqueue(match[1], fromUrl);

  const cssUrlPattern = /url\(\s*["']?([^"')]+)["']?\s*\)/gi;
  for (const match of text.matchAll(cssUrlPattern)) enqueue(match[1], fromUrl);

  const staticExt = '(?:css|js|mjs|json|webmanifest|png|jpe?g|gif|svg|mp3|mp4|webm|woff2?)';
  const quoted = '["\'`]';
  const staticPathChars = '[^"\'`\\s)\\\\]+';

  const weatherPathPattern = new RegExp(
    quoted + '(/retro/(?:_nuxt|assets)/' + staticPathChars + '\\.' + staticExt + ')' + quoted,
    'g',
  );
  for (const match of text.matchAll(weatherPathPattern)) enqueue(match[1], fromUrl);

  const absoluteWeatherPattern = new RegExp(
    'https:\\/\\/weather\\.com\\/retro\\/(?:_nuxt|assets)\\/' +
      staticPathChars +
      '\\.' +
      staticExt,
    'g',
  );
  for (const match of text.matchAll(absoluteWeatherPattern)) enqueue(match[0], fromUrl);

  const relativeAssetPattern = new RegExp(
    quoted + '((?:assets|_nuxt)/' + staticPathChars + '\\.' + staticExt + ')' + quoted,
    'g',
  );
  for (const match of text.matchAll(relativeAssetPattern)) enqueue(match[1], fromUrl);

  const relativeChunkPattern = new RegExp(
    quoted + '(\\.{1,2}/' + staticPathChars + '\\.' + staticExt + ')' + quoted,
    'g',
  );
  for (const match of text.matchAll(relativeChunkPattern)) enqueue(match[1], fromUrl);

  const runtimeAssetPattern = new RegExp(
    quoted +
      '(/(?:images|sound|video)/' +
      staticPathChars +
      '\\.' +
      staticExt +
      ')' +
      quoted,
    'g',
  );
  for (const match of text.matchAll(runtimeAssetPattern)) {
    enqueue('/retro/assets' + match[1], fromUrl);
  }

  const fontPattern = /https:\/\/fonts\.gstatic\.com\/[^)'"\s]+/g;
  for (const match of text.matchAll(fontPattern)) enqueue(match[0], fromUrl);
}

function seedKnownRuntimeAssets() {
  for (let i = 0; i <= 47; i += 1) {
    enqueue(`/retro/assets/images/icons/${String(i).padStart(2, '0')}.svg`);
  }

  [
    '/retro/assets/images/clock.png',
    '/retro/assets/images/globe.png',
    '/retro/assets/images/needle.png',
    '/retro/assets/images/the-weather-channel.png',
    '/retro/assets/images/icons/moon/first.svg',
    '/retro/assets/images/icons/moon/full.svg',
    '/retro/assets/images/icons/moon/last.svg',
    '/retro/assets/images/icons/moon/new.svg',
    '/retro/assets/video/clouds.mp4',
    '/retro/assets/video/grain.mp4',
    '/retro/assets/video/texture.mp4',
    '/retro/assets/sound/alert-tone.mp3',
    '/retro/assets/sound/music/neon-office-glide.mp3',
    '/retro/assets/sound/voiceovers/current.mp3',
    '/retro/assets/sound/voiceovers/extended.mp3',
    '/retro/assets/sound/voiceovers/local.mp3',
    '/retro/assets/sound/voiceovers/radar.mp3',
    '/retro/assets/sound/voiceovers/regional.mp3',
  ].forEach(asset => enqueue(asset));
}

async function fetchWithRetry(url, attempts = 3) {
  let lastError;

  for (let i = 0; i < attempts; i += 1) {
    try {
      const response = await fetch(url, {
        redirect: 'follow',
        headers: {
          'user-agent': USER_AGENT,
          accept: '*/*',
        },
      });

      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`);
      }

      return response;
    } catch (error) {
      lastError = error;
      await new Promise(resolve => setTimeout(resolve, 500 * (i + 1)));
    }
  }

  throw lastError;
}

async function download(url) {
  const response = await fetchWithRetry(url);
  const filePath = localFilePath(url);
  const contentType = response.headers.get('content-type') || '';

  await mkdir(dirname(filePath), { recursive: true });

  if (isTextResource(url, contentType)) {
    const original = await response.text();
    extractReferences(original, url.toString());
    const rewritten = rewriteText(original, url);
    await writeFile(filePath, rewritten, 'utf8');

    if (url.hostname === 'fonts.googleapis.com') {
      googleFontsCssPath = filePath;
    }
  } else {
    await pipeline(Readable.fromWeb(response.body), createWriteStream(filePath));
  }

  downloaded.push(localPublicPath(url));
  console.log(`saved ${url} -> ${localPublicPath(url)}`);
}

async function writeServer() {
  const serverSource = `import { createServer } from 'node:http';
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
  const relative = pathname === '/retro/' ? 'retro/index.html' : pathname.replace(/^\\/+/, '');
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
    const hasFileExtension = /\\.[a-z0-9]+$/i.test((req.url || '').split('?')[0]);
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
  console.log(\`Retro mirror running at http://localhost:\${port}/retro/\`);
});
`;

  await writeFile(join(OUT_DIR, 'server.mjs'), serverSource, 'utf8');
  await writeFile(
    join(OUT_DIR, 'README.md'),
    `# Weather.com Retro Local Mirror

This directory is generated by \`node tools/mirror-weather-retro.mjs\`.

Run:

\`\`\`powershell
cd mirror
node server.mjs
\`\`\`

Then open http://localhost:4173/retro/
`,
    'utf8',
  );
}

async function findI18nBundle() {
  const nuxtDir = join(OUT_DIR, 'retro', '_nuxt');
  const entries = await readdir(nuxtDir);

  for (const entry of entries) {
    if (!entry.endsWith('.js')) continue;

    const filePath = join(nuxtDir, entry);
    const source = await readFile(filePath, 'utf8');
    if (source.includes('/_i18n/M7P9DoZA/') && source.includes('locale_en_')) {
      return { filePath, source };
    }
  }

  return null;
}

function decodeI18nMessage(value) {
  if (!value || typeof value !== 'object') return value;

  if ('t' in value && 'b' in value) return decodeI18nNode(value.b);

  if (Array.isArray(value)) return value.map(decodeI18nMessage);

  return Object.fromEntries(
    Object.entries(value).map(([key, nestedValue]) => [key, decodeI18nMessage(nestedValue)]),
  );
}

function decodeI18nNode(node) {
  if (!node || typeof node !== 'object') return '';

  if (typeof node.s === 'string') return node.s;
  if (typeof node.v === 'string') return node.v;
  if (typeof node.k === 'string') return `{${node.k}}`;

  if (Array.isArray(node.i)) return node.i.map(decodeI18nNode).join('');
  if (Array.isArray(node.c)) return node.c.map(decodeI18nNode).join(' | ');

  return '';
}

async function writeI18nMessageEndpoints() {
  const bundle = await findI18nBundle();
  if (!bundle) {
    console.warn('skipped i18n JSON endpoints: locale bundle not found');
    return;
  }

  const localePattern =
    /(?:^|[,{])([a-z]{2}):\[\{key:"locale_[^"]+",load:\(\)=>le\(\(\)=>import\("\.\/([^"]+\.js)"\)/g;
  const localeChunks = [...bundle.source.matchAll(localePattern)].map(match => ({
    locale: match[1],
    chunk: match[2],
  }));

  for (const { locale, chunk } of localeChunks) {
    const chunkPath = join(dirname(bundle.filePath), chunk);
    const mod = await import(pathToFileURL(chunkPath).href);
    const outPath = join(OUT_DIR, '_i18n', 'M7P9DoZA', locale, 'messages.json');
    const publicPath = `/_i18n/M7P9DoZA/${locale}/messages.json`;
    const messages = decodeI18nMessage(mod.default);

    await mkdir(dirname(outPath), { recursive: true });
    await writeFile(outPath, JSON.stringify({ [locale]: messages }), 'utf8');
    downloaded.push(publicPath);
    console.log(`generated ${publicPath}`);
  }
}

async function writeManifest() {
  downloaded.sort();
  await writeFile(
    join(OUT_DIR, 'crawl-manifest.json'),
    JSON.stringify(
      {
        source: START_URL,
        crawledAt: new Date().toISOString(),
        files: downloaded,
        googleFontsCssPath,
      },
      null,
      2,
    ),
    'utf8',
  );
}

async function main() {
  enqueue(START_URL);
  seedKnownRuntimeAssets();

  while (queue.length) {
    const url = queue.shift();
    try {
      await download(url);
    } catch (error) {
      console.warn(`failed ${url}: ${error.message}`);
    }
  }

  await writeI18nMessageEndpoints();
  await writeServer();
  await writeManifest();
  console.log(`done: ${downloaded.length} resources saved in ${OUT_DIR}`);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
