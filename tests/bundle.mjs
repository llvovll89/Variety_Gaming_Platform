import Module from 'node:module';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

/**
 * Bundle TypeScript/TSX sources for a test and load them as CommonJS, so bare imports
 * (react, react-dom/server) resolve from node_modules. CSS imports become empty.
 */
export async function loadBundle(contents) {
  const compiled = await build({ stdin: { contents, resolveDir: process.cwd() }, bundle: true, write: false, format: 'cjs', platform: 'node', jsx: 'automatic', loader: { '.css': 'empty' }, define: { 'import.meta.env.DEV': 'false' } });
  const filename = fileURLToPath(import.meta.url);
  const bundled = new Module(filename);
  bundled.filename = filename;
  bundled.paths = Module._nodeModulePaths(process.cwd());
  bundled._compile(compiled.outputFiles[0].text, filename);
  return bundled.exports;
}
