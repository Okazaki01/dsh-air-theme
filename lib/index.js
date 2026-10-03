/**
 * ============================================================================
 * dsh-air-theme — host half (node).
 *
 * Deliberately empty of behaviour. The client-modules scanner discovers this
 * package's browser bundle through `dsh.client` in package.json plus the
 * `./client` export, so the plugin row only needs a loadable host entry: this
 * file exists so the cordis loader can activate `ui-skin-air`. It declares no
 * services, performs no I/O, and imports nothing.
 *
 * The skin's artwork is delivered from the package's own client chunks
 * (lib/client.art.js, client.bg.{a,b}.js, client.mascot.js,
 * client.star.{a,b}.js) through the kernel's client-modules chunk channel,
 * which is why there is no `/air-assets` route any more.
 *
 * History: v0.1.x–v0.2.5 registered a `ctx.webServer` prefix route that streamed
 * files out of ./assets with node:fs. That route was removed on purpose:
 * reading files from the host half made the package ineligible for the DSH
 * Store automatic source policy (the files / commands / credentials permission
 * signals). Serving from `assets/` is now unnecessary — every ornament and
 * photo travels inside the client chunks above.
 * ============================================================================
 */

/** Plugin row id (matches cordis.patch.yml). */
const name = 'ui-skin-air';

/** No services are required: this half only has to be importable. */
const inject = [];

/**
 * Apply the plugin row. Intentionally empty — the whole theme lives in the
 * browser bundle and is installed there by `lib/client.js`.
 */
function apply() {}

export { apply, inject, name };
