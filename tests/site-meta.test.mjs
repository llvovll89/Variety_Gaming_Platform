import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import vm from 'node:vm';

const html = readFileSync('index.html', 'utf8');
const meta = (attr, key) => html.match(new RegExp(`<meta ${attr}="${key}" content="([^"]+)"`))?.[1];

test('link previews use an absolute 1200×630 image that ships with the site', () => {
  const image = meta('property', 'og:image');
  assert.match(image, /^https:\/\//, 'crawlers ignore relative og:image URLs');
  assert.ok(existsSync(`public${new URL(image).pathname}`));
  const jpg = readFileSync(`public${new URL(image).pathname}`);
  // Find the JPEG SOF0/SOF2 frame header to read the real pixel size.
  let i = 2; let size;
  while (i < jpg.length) { const marker = jpg[i + 1], len = jpg.readUInt16BE(i + 2); if (marker === 0xc0 || marker === 0xc2) { size = [jpg.readUInt16BE(i + 7), jpg.readUInt16BE(i + 5)]; break; } i += 2 + len; }
  assert.deepEqual(size, [Number(meta('property', 'og:image:width')), Number(meta('property', 'og:image:height'))]);
  for (const key of ['og:title', 'og:description', 'og:url', 'og:site_name']) assert.ok(meta('property', key), key);
  assert.equal(meta('name', 'twitter:card'), 'summary_large_image');
});

test('the web app manifest is installable and every icon exists at its declared size', () => {
  assert.match(html, /<link rel="manifest" href="\/manifest\.webmanifest"/);
  const manifest = JSON.parse(readFileSync('public/manifest.webmanifest', 'utf8'));
  for (const key of ['name', 'short_name', 'start_url', 'display', 'theme_color', 'background_color']) assert.ok(manifest[key], key);
  const sizes = new Set();
  for (const icon of manifest.icons) {
    const png = readFileSync(`public${icon.src}`);
    assert.equal(png.subarray(1, 4).toString(), 'PNG');
    assert.equal(`${png.readUInt32BE(16)}x${png.readUInt32BE(20)}`, icon.sizes, icon.src);
    sizes.add(icon.sizes);
  }
  assert.ok(sizes.has('192x192') && sizes.has('512x512'));
  assert.ok(manifest.icons.some(icon => icon.purpose === 'maskable'));
});

test('the service worker parses, skips other origins and never caches pages forever', () => {
  const source = readFileSync('public/sw.js', 'utf8');
  assert.doesNotThrow(() => new vm.Script(source));
  assert.match(source, /request\.mode === 'navigate'/);
  assert.match(source, /url\.origin !== self\.location\.origin/);
  const vercel = JSON.parse(readFileSync('vercel.json', 'utf8'));
  assert.ok(vercel.headers.some(h => h.source === '/sw.js' && h.headers.some(x => x.key === 'Cache-Control' && x.value === 'no-cache')));
});

test('shipped files stay small enough for phones (convert large art to WebP/JPEG first)', async () => {
  const { readdirSync, statSync } = await import('node:fs');
  const { join } = await import('node:path');
  const LIMIT = 1024 * 1024;
  const walk = dir => readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? walk(join(dir, entry.name)) : [join(dir, entry.name)]);
  const oversized = walk('public').filter(file => statSync(file).size > LIMIT);
  assert.deepEqual(oversized, [], 'each file in public/ must be 1MB or smaller');
});
