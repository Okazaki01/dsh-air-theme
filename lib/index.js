/**
 * ============================================================================
 * dsh-air-theme — host half (node).
 *
 * The ONLY job of this half: serve the skin's static assets (background photo,
 * Q版 mascot PNG, decorative SVGs) to the browser at `/air-assets/<file>`.
 *
 * Why a route instead of data-URIs: the background (001.jpg) and mascot are
 * hundreds of KB. A route keeps the client bundle small, lets the browser
 * cache the images, and keeps switching skins cheap.
 *
 * The route is registered via `ctx.webServer.register` (the documented
 * extension point the dsh-pet plugin uses for the same purpose) and is
 * wrapped in `ctx.effect`, so it is unregistered automatically when the
 * plugin is disabled / the skin is switched away.
 *
 * Security: path traversal is blocked (normalize + prefix check) — the
 * resolved file must stay inside the package's `assets/` directory.
 * ============================================================================
 */
import { createReadStream, existsSync } from 'node:fs';
import { stat } from 'node:fs/promises';
import { join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Plugin row id (matches cordis.patch.yml). */
const name = 'ui-skin-air';
/** Services this host half needs before apply runs: the web server. */
const inject = ['webServer'];

/** Package root: `lib/` is one level below the package root (import.meta.url). */
const PACKAGE_ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));

/** Route prefix: `/air-assets/<file>`. */
const ROUTE_PREFIX = '/air-assets';

/** Content types by extension. */
const MIME = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webm': 'video/webm',
  '.json': 'application/json; charset=utf-8',
};

/**
 * Normalize and validate a request path stays inside the assets root.
 * @param root - absolute assets directory.
 * @param rel  - decoded path segment after the route prefix.
 * @returns absolute file path, or undefined on traversal/empty path.
 */
function resolveAsset(root, rel) {
  if (!rel || rel.length === 0) return undefined;
  const candidate = normalize(join(root, rel));
  const rootWithSep = root.endsWith(sep) ? root : root + sep;
  if (candidate !== root && !candidate.startsWith(rootWithSep)) return undefined;
  return candidate;
}

/**
 * Apply the skin's asset route.
 * @param ctx    - plugin context (ctx.webServer is available via `inject`).
 * @param config - this row's config (unused for now; reserved for future
 *                 asset overrides, e.g. custom background path).
 */
function apply(ctx, config) {
  const assetsRoot = join(PACKAGE_ROOT, 'assets');

  ctx.effect(() => ctx.webServer.register({
    kind: 'prefix',
    path: ROUTE_PREFIX,
    handler: async (req, res) => {
      const url = new URL(req.url ?? '/', 'http://localhost');
      // strip the prefix; decodeURIComponent so CJK filenames survive
      let rest;
      try {
        rest = decodeURIComponent(url.pathname.slice(ROUTE_PREFIX.length + 1));
      } catch {
        res.writeHead(400, { 'content-type': 'text/plain; charset=utf-8' });
        res.end('dsh-air-theme: malformed path');
        return;
      }
      const file = resolveAsset(assetsRoot, rest);
      if (file === undefined) {
        res.writeHead(400, { 'content-type': 'text/plain; charset=utf-8' });
        res.end('dsh-air-theme: invalid path');
        return;
      }
      if (!existsSync(file)) {
        res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
        res.end(`dsh-air-theme: asset not found: ${rest}`);
        return;
      }
      const ext = file.slice(file.lastIndexOf('.')).toLowerCase();
      const contentType = MIME[ext] ?? 'application/octet-stream';
      const { size } = await stat(file);
      res.writeHead(200, {
        'content-type': contentType,
        'content-length': size,
        // static theme assets: safe to cache
        'cache-control': 'public, max-age=3600',
      });
      const stream = createReadStream(file);
      stream.on('error', () => res.destroy());
      stream.pipe(res);
    },
  }), 'dsh-air-theme: /air-assets asset route');
}

export { apply, inject, name };
