/**
 * ============================================================================
 * dsh-air-theme — browser half. 《AIR》夏日青空 skin for the DSH web GUI.
 *
 * Hand-written ModuleLoader bundle (no build step) — same shape as
 * dsh-font-custom / dsh-pet / dsh-client-ui-skin-maid-atelier:
 *
 *   window.__ModuleLoader__.load({ id, factory })
 *
 * Everything is a hot-swappable OVERLAY:
 *   - all CSS is scoped under `body[data-dsh-air]` (the skin's bodyAttr), so
 *     disabling the skin / switching to another one tears the theme down
 *     cleanly; no native function or structure is touched.
 *   - decorations are DOM nodes tagged `data-skin-owner="dsh-air"` and are
 *     removed on dispose by `ctx.effect`.
 *   - state hooks ride stable DOM attributes the shell already exposes:
 *       [data-phase]            composer phase (hero / active / settling)
 *       [data-state=ongoing]    session running (sidebar loading dot)
 *       [data-variant=think][data-state=running]  thinking rows
 *       [data-chat-flow-kind]   message bubbles (user / assistant / tool …)
 *       [data-composer-card]    the input card
 *       [data-shell-overlay]    the floating overlay layer
 *       [data-slot=sidebar.settings] [role=dialog]   settings modal
 *
 * Animation hooks (预留接口, all pure CSS classes the theme toggles):
 *   - body.air-busy        feathers fall faster + sparkles layer shows
 *   - body[data-air-composer-motion=dock|rise]  composer phase transition
 *   - .air-click-ripple    water-drop ripple spawned on button press
 *   - body[data-air-settings-open]  settings modal open → theme suspended
 *   - body[data-air-mascot-top]     sidebar has no visible records → mascot on top
 *
 * Assets (background photo, Q版 mascot, sakura branch, star-trail photo,
 * gold ornaments, jewel crest) are served by the host half at `/air-assets/<file>`
 * (see lib/index.js) and cached by the browser.
 * ============================================================================
 */
window.__ModuleLoader__.load({
  id: "@dsh-external/dsh-client-ui-skin-air",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

    // ---------------------------------------------------------------------
    // Art (inline SVG data URIs — self-contained, zero network dependency)
    // ---------------------------------------------------------------------
    // Skin version (shown in the activation badge — used to verify the loaded build)
    var SKIN_VERSION = "0.2.5";
    /**
     * hero(空会话)态输入框的垂直位置: 以「输入框+上方标题行」整体的垂直中线为准,
     * 落在滚动口中线**下方**这么多像素。数值越大越靠下。改这里即可微调。
     */
    var HERO_CENTER_SHIFT = 56;
    // A soft white feather with a sky-blue shaft, used for the drifting
    // feather-fall layer and the composer-card corner decorations.
    var FEATHER_ART = "data:image/svg+xml;utf8," + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">' +
      '<path d="M32 4 C40 20 44 32 42 46 C40 54 36 60 32 62 C30 60 26 54 25 46 C23 32 27 20 32 4 Z" fill="url(#g)" opacity="0.95"/>' +
      '<path d="M32 4 C27 22 26 40 30 58 L34 58 C37 40 36 22 32 4 Z" fill="#ffffff" opacity="0.9"/>' +
      '<line x1="32" y1="6" x2="32" y2="60" stroke="#8ecdf0" stroke-width="1.6" stroke-linecap="round" opacity="0.85"/>' +
      '<path d="M32 14 C34 20 33 28 31 34 M32 22 C34.5 27 33.5 33 31.5 38 M32 30 C34 35 33 41 31.5 46" stroke="#8ecdf0" stroke-width="1" fill="none" opacity="0.6"/>' +
      '<defs><radialGradient id="g" cx="0.5" cy="0.35" r="0.75">' +
      '<stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#dff2fd"/></radialGradient></defs></svg>'
    );
    // A tiny sakura blossom (five petals) for the settings button + section glyphs.
    var SAKURA_ART = "data:image/svg+xml;utf8," + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">' +
      '<g fill="#ffb6c9" stroke="#f78fb0" stroke-width="1">' +
      '<ellipse cx="24" cy="10" rx="4.4" ry="7.4" transform="rotate(0 24 24)"/>' +
      '<ellipse cx="24" cy="10" rx="4.4" ry="7.4" transform="rotate(72 24 24)"/>' +
      '<ellipse cx="24" cy="10" rx="4.4" ry="7.4" transform="rotate(144 24 24)"/>' +
      '<ellipse cx="24" cy="10" rx="4.4" ry="7.4" transform="rotate(216 24 24)"/>' +
      '<ellipse cx="24" cy="10" rx="4.4" ry="7.4" transform="rotate(288 24 24)"/>' +
      '</g><circle cx="24" cy="24" r="2.6" fill="#ffe3ec"/></svg>'
    );
    // A magic-star for the busy sparkle hook and button glyphs.
    var STAR_ART = "data:image/svg+xml;utf8," + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">' +
      '<path d="M16 2 L19.5 12.5 L30 16 L19.5 19.5 L16 30 L12.5 19.5 L2 16 L12.5 12.5 Z" fill="#fff7c9" stroke="#ffd166" stroke-width="1.2" stroke-linejoin="round"/></svg>'
    );
    // A small flying-bird silhouette (two birds), used as a corner vignette.
    var BIRD_ART = "data:image/svg+xml;utf8," + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 40">' +
      '<g fill="#5aa7d8" opacity="0.55">' +
      '<path d="M10 22 Q16 12 26 10 Q20 15 22 22 Q18 18 14 20 Z"/>' +
      '<path d="M16 20 Q22 10 32 8 Q26 13 28 20 Q24 16 20 18 Z"/>' +
      '<path d="M46 26 Q51 18 59 16 Q54 20 56 26 Q52 22 49 24 Z"/>' +
      '<path d="M51 24 Q56 16 64 14 Q59 18 61 24 Q57 20 54 22 Z"/>' +
      '<path d="M74 20 Q78 13 85 11 Q81 15 82 20 Q79 17 76 18 Z"/>' +
      '</g></svg>'
    );
    // Tiny water ripple rings for the thinking hook (CSS-drawn instead, but
    // this SVG is used for the hero accent).
    var RIPPLE_ART = "data:image/svg+xml;utf8," + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">' +
      '<g fill="none" stroke="#8ecdf0" stroke-width="2" opacity="0.6">' +
      '<ellipse cx="32" cy="34" rx="26" ry="7"/><ellipse cx="32" cy="34" rx="18" ry="5"/>' +
      '<ellipse cx="32" cy="34" rx="10" ry="3"/></g></svg>'
    );
    // A magic open book (send button glyph).
    var BOOK_ART = "data:image/svg+xml;utf8," + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 26 22">' +
      '<path d="M13 4.2 C9.4 2.2 5 2.4 2.2 3.6 V18.8 C5 17.6 9.4 17.4 13 19.4 C16.6 17.4 21 17.6 23.8 18.8 V3.6 C21 2.4 16.6 2.2 13 4.2 Z" fill="#ffffff" stroke="#5fb0e8" stroke-width="1.3" stroke-linejoin="round"/>' +
      '<path d="M13 4.2 V19.4" stroke="#5fb0e8" stroke-width="1.5"/>' +
      '<path d="M6.5 6.6 C8.2 5.8 10.4 5.7 11.8 6 M6.5 9.8 C8.2 9 10.4 8.9 11.8 9.2 M6.5 13 C8.2 12.2 10.4 12.1 11.8 12.4" stroke="#7ec4ee" stroke-width="1.1" fill="none" opacity="0.85" stroke-linecap="round"/>' +
      '<path d="M19.5 6.6 C17.8 5.8 15.6 5.7 14.2 6 M19.5 9.8 C17.8 9 15.6 8.9 14.2 9.2 M19.5 13 C17.8 12.2 15.6 12.1 14.2 12.4" stroke="#7ec4ee" stroke-width="1.1" fill="none" opacity="0.85" stroke-linecap="round"/></svg>'
    );
    // A gold corner flourish (brand capsule + composer corners).
    var ORNAMENT_ART = "data:image/svg+xml;utf8," + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">' +
      '<g fill="none" stroke="#d9a63f" stroke-width="2" stroke-linecap="round">' +
      '<path d="M4 34 Q4 4 34 4" opacity="0.85"/>' +
      '<path d="M4 40 Q4 26 10 20" opacity="0.6"/>' +
      '<path d="M40 4 Q26 4 20 10" opacity="0.6"/>' +
      '</g><circle cx="8" cy="8" r="3" fill="#f0c460" opacity="0.9"/></svg>'
    );
    // A tiny single petal (falling sakura accent).
    var PETAL_ART = "data:image/svg+xml;utf8," + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">' +
      '<path d="M12 2 C18 7 20 14 12 22 C4 14 6 7 12 2 Z" fill="#ffc3d4" stroke="#f78fb0" stroke-width="0.8" opacity="0.95"/></svg>'
    );
    // Feather favicon.
    var FAVICON = "data:image/svg+xml;utf8," + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">' +
      '<rect width="64" height="64" rx="14" fill="#bfe3f7"/>' +
      '<path d="M32 8 C40 22 44 34 42 48 C40 55 36 60 32 62 C30 60 26 55 25 48 C23 34 27 22 32 8 Z" fill="#ffffff"/>' +
      '<path d="M32 8 C27 24 26 40 30 58 L34 58 C37 40 36 24 32 8 Z" fill="#e6f6ff"/>' +
      '<line x1="32" y1="10" x2="32" y2="60" stroke="#6db7e8" stroke-width="2" stroke-linecap="round"/></svg>'
    );
    // Remote asset URLs (served by the host half via /air-assets/<file>).
    var ASSET_BRANCH = "/air-assets/sakura-branch.svg";       // web-sourced sakura branch
    var ASSET_STAR = "/air-assets/star-trail-small.jpg";      // web-sourced star trail photo
    var ASSET_MASCOT = "/air-assets/misuzu.png";
    var ASSET_CORNER_ARC = "/air-assets/corner-arc-gold.svg";      // custom quarter-ring hugging the card's rounded corners
    var ASSET_GOLD_SIDE = "/air-assets/gold-side.svg";              // slim gold vertical ornament (re-designed)
    var ASSET_GOLD_EDGE = "/air-assets/gold-edge-h.svg";            // custom gold horizontal ornament
    var ASSET_TOP_GEM = "/air-assets/top-gem.svg";                  // gold jewel crest (replaces the wing)
    var ASSET_SKY_CORNER = "/air-assets/border-corner-sky.svg";     // web-sourced sky floral corner (capsule + folders)

    // ---------------------------------------------------------------------
    // Theme CSS — every rule scoped under body[data-dsh-air]
    // ---------------------------------------------------------------------
    var CSS_TAG = "@dsh-external/dsh-client-ui-skin-air/air.module.css";
    var css = [
      "/* ============ AIR root palette ============ */",
      "body[data-dsh-air]{color:#1e3a5f;--air-sky:#6db7e8;--air-sky-deep:#3f8fd0;--air-sky-pale:#dff2fd;--air-cloud:#f8fcff;--air-ink:#1e3a5f;--air-sakura:#f7b8cf;--air-sakura-deep:#f78fb0;--air-feather:#ffffff;--air-glass:rgba(250,253,255,.66);--air-glass-strong:rgba(248,252,255,.82);--air-glass-border:rgba(140,200,240,.55);--air-gold:#e8b64c;--air-gold-soft:#ffe9a8;--air-shadow:0 18px 54px rgba(64,140,200,.16),0 2px 10px rgba(64,140,200,.10);--air-hand-font:'Zen Kurenaido','Segoe Print','Yu Mincho','Yu Gothic','Hiragino Maru Gothic ProN','Comic Sans MS',cursive;--air-body-font:'Zen Maru Gothic','Clear Sans Japanese','Yu Gothic UI','Yu Gothic','Hiragino Sans','Noto Sans CJK JP','Microsoft YaHei UI',sans-serif;",
      "/* neutralise the shell fills so the sky backdrop shows through */",
      "--dsw-alias-bg-base:transparent!important;--dsw-alias-bg-layer-1:rgba(250,253,255,.62);--dsw-alias-bg-layer-2:rgba(244,250,255,.72);--dsw-alias-bg-layer-3:rgba(240,248,255,.80);--dsw-alias-bg-overlay:rgba(244,251,255,.94);--dsw-alias-bg-module-platform:rgba(248,252,255,.55);",
      "--dsw-alias-border-l1:rgba(120,180,225,.28);--dsw-alias-border-l2:rgba(120,180,225,.36);--dsw-alias-border-l2-darkmode-thin:rgba(120,180,225,.30);--dsw-alias-border-l3:rgba(100,170,225,.50);--dsw-alias-border-l4:rgba(90,160,220,.42);",
      "--dsw-alias-brand-primary:#4a9fe0;--dsw-alias-brand-text:#1e3a5f;--dsw-alias-label-primary:#1e3a5f;--dsw-alias-label-primary-bluish:#2b5a8a;--dsw-alias-label-secondary:#3f6d99;--dsw-alias-label-tertiary:#5c86ab;--dsw-alias-label-caption:#7193b2;--dsw-alias-label-dimmed:#93abc2;",
      "--dsw-alias-button-elevated-fill:rgba(250,253,255,.86);--dsw-alias-button-floating-fill:rgba(250,253,255,.92);--dsw-alias-button-floating-hover:#e8f4fd;--dsw-alias-button-info-fill:#5aa7e0;--dsw-alias-button-info-hover:#3f8fd0;",
      "--dsw-alias-interactive-bg-active:rgba(110,180,235,.30);--dsw-alias-interactive-bg-hover:rgba(120,185,235,.18);--dsw-alias-interactive-bg-hover-solid:#e3f2fd;",
      "--dsw-alias-state-business-primary:#3f8fd0;--dsw-alias-state-business-tertiary:#d8eefb;--dsw-alias-state-error-primary:#e0609a;",
      "--dsw-shadow-lv2:var(--air-shadow);--dsw-specific-input-major:rgba(250,253,255,.72);--dsw-specific-selector:rgba(232,244,253,.85);--dsw-specific-sidebar-fill:rgba(238,248,255,.60);--dsw-specific-sidebar-nav-item-active-accent:rgba(110,180,235,.35);",
      "background-color:#dbeef9}",
      "body[data-dsh-air][data-ds-dark-theme]{color:#eaf5ff;--air-ink:#eaf5ff;--air-glass:rgba(14,36,62,.60);--air-glass-strong:rgba(16,42,72,.80);--air-glass-border:rgba(110,180,230,.40);--air-gold:#f2c96b;--air-gold-soft:#ffe9a8;--air-shadow:0 18px 58px rgba(0,0,0,.5),0 2px 10px rgba(0,0,0,.35);",
      "/* v0.2.5 关键修复: 深色块必须自己再声明一次 --dsw-alias-bg-base。",
      "   它原来只写在浅色块里(权重 0-1-1)，而内核深色模式是 body[data-ds-dark-theme](同样 0-1-1) ——",
      "   同权重时按样式表顺序决胜：冷启动时皮肤表先插、内核表后插 → 内核赢 → 不透明的 #151517",
      "   糊满整个视口 → 天空图被整个盖住；而热重载会把皮肤表重新追加到 <head> 末尾 → 皮肤赢 →",
      "   照片出现。这就是「冷启动必黑、热重载就好」的真因。升到 0-2-1 并加 !important，与顺序无关。 */",
      "--dsw-alias-bg-base:transparent!important;--dsw-alias-bg-layer-1:rgba(13,34,58,.66);--dsw-alias-bg-layer-2:rgba(17,41,70,.74);--dsw-alias-bg-layer-3:rgba(20,48,82,.82);--dsw-alias-bg-overlay:rgba(11,30,52,.95);--dsw-alias-bg-module-platform:rgba(13,34,58,.55);",
      "--dsw-alias-border-l1:rgba(140,200,240,.22);--dsw-alias-border-l2:rgba(140,200,240,.30);--dsw-alias-border-l2-darkmode-thin:rgba(140,200,240,.26);--dsw-alias-border-l3:rgba(160,210,245,.42);--dsw-alias-border-l4:rgba(150,205,240,.36);",
      "--dsw-alias-brand-primary:#8ecdf0;--dsw-alias-brand-text:#eaf5ff;--dsw-alias-label-primary:#eaf5ff;--dsw-alias-label-primary-bluish:#cfe7fa;--dsw-alias-label-secondary:#b5d6ef;--dsw-alias-label-tertiary:#93bedb;--dsw-alias-label-caption:#7ba7c8;--dsw-alias-label-dimmed:#5f8cab;",
      "--dsw-alias-button-elevated-fill:rgba(24,54,90,.88);--dsw-alias-button-floating-fill:rgba(22,52,88,.94);--dsw-alias-button-floating-hover:rgba(40,78,124,.96);--dsw-alias-button-info-fill:#4a9fe0;--dsw-alias-button-info-hover:#6db7e8;",
      "--dsw-alias-interactive-bg-active:rgba(120,190,240,.30);--dsw-alias-interactive-bg-hover:rgba(120,185,235,.20);--dsw-alias-interactive-bg-hover-solid:rgba(42,80,128,.6);",
      "--dsw-alias-state-business-primary:#8ecdf0;--dsw-alias-state-business-tertiary:rgba(58,104,156,.45);",
      "--dsw-specific-input-major:rgba(15,40,68,.68);--dsw-specific-selector:rgba(24,54,92,.85);--dsw-specific-sidebar-fill:rgba(8,26,46,.62);--dsw-specific-sidebar-nav-item-active-accent:rgba(120,190,240,.28);",
      "background-color:#0a1c30}",
      "",
      "/* ============ full-viewport sky backdrop ============ */",
      "body[data-dsh-air]::before{content:\"\";position:fixed;inset:0;z-index:-1;pointer-events:none;background:linear-gradient(180deg,rgba(210,238,252,.0),rgba(214,240,252,.28) 55%,rgba(190,228,250,.42)),url(/air-assets/bg.jpg) center 22%/cover no-repeat;background-blend-mode:normal}",
      "body[data-dsh-air][data-ds-dark-theme]::before{background:linear-gradient(180deg,rgba(6,20,36,.18),rgba(8,26,46,.42) 60%,rgba(6,20,36,.55)),url(/air-assets/bg.jpg) center 22%/cover no-repeat}",
      "body[data-dsh-air] [id=root]{background:0 0;position:relative}",
      "",
      "/* ============ ambient chrome: clouds, birds, feathers ============ */",
      "body[data-dsh-air] [data-air-chrome=ambient]{position:fixed;inset:0;z-index:0;pointer-events:none;overflow:hidden}",
      "body[data-dsh-air] [data-air-cloud]{position:absolute;background:radial-gradient(ellipse at 32% 42%,rgba(255,255,255,.92) 0 34%,rgba(255,255,255,.55) 46%,rgba(255,255,255,0) 72%),radial-gradient(ellipse at 72% 58%,rgba(255,255,255,.85) 0 30%,rgba(255,255,255,.45) 44%,rgba(255,255,255,0) 68%);border-radius:50%;filter:blur(.5px);opacity:.5;animation:air-cloud-drift linear infinite;will-change:transform}",
      "body[data-dsh-air][data-ds-dark-theme] [data-air-cloud]{opacity:.16}",
      "@keyframes air-cloud-drift{0%{transform:translate3d(-18vw,0,0)}100%{transform:translate3d(118vw,0,0)}}",
      "body[data-dsh-air] [data-air-birds]{position:absolute;top:12%;right:6%;width:130px;height:44px;background:var(--air-bird-art) center/contain no-repeat;opacity:.8;animation:air-bird-float 9s ease-in-out infinite;will-change:transform}",
      "@keyframes air-bird-float{0%,100%{transform:translateY(0) translateX(0)}50%{transform:translateY(-14px) translateX(10px)}}",
      "body[data-dsh-air] [data-air-chrome=feathers]{position:fixed;inset:0;z-index:2147483646;pointer-events:none;overflow:hidden}",
      "body[data-dsh-air] [data-air-feather]{position:absolute;top:-46px;width:var(--fx-s,22px);height:var(--fx-s,22px);background:var(--air-feather-art) center/contain no-repeat;opacity:0;animation:air-feather-fall var(--fx-d,16s) linear var(--fx-delay,0s) infinite;will-change:transform,opacity}",
      "@keyframes air-feather-fall{0%{transform:translate3d(0,-46px,0) rotate(0deg);opacity:0}8%{opacity:var(--fx-o,.55)}78%{opacity:var(--fx-o,.55)}100%{transform:translate3d(var(--fx-x,90px),108vh,0) rotate(var(--fx-r,520deg));opacity:0}}",
      "/* busy (loading / running) — feathers dance faster and sparkles show */",
      "body[data-dsh-air].air-busy [data-air-feather]{animation-duration:calc(var(--fx-d,16s)*.5)}",
      "body[data-dsh-air] [data-air-chrome=sparkles]{position:fixed;inset:0;z-index:2147483646;pointer-events:none;overflow:hidden}",
      "body[data-dsh-air] [data-air-spark]{position:absolute;width:14px;height:14px;background:var(--air-star-art) center/contain no-repeat;opacity:0;animation:air-twinkle var(--fx-d,3.2s) ease-in-out var(--fx-delay,0s) infinite;will-change:transform,opacity}",
      "@keyframes air-twinkle{0%,100%{transform:scale(.3) rotate(0deg);opacity:0}35%{opacity:var(--fx-o,.9)}55%{opacity:var(--fx-o,.9)}70%{transform:scale(1.05) rotate(40deg);opacity:0}}",
      "",
      "/* ============ sidebar: washi texture + mascot + ambient decor ============ */",
      "body[data-dsh-air] :is(__AIRSIDEBAR__){position:relative;border-right:1px solid var(--air-glass-border);background:repeating-linear-gradient(45deg,rgba(120,180,225,.05) 0 1px,transparent 1px 8px),repeating-linear-gradient(-45deg,rgba(120,180,225,.04) 0 1px,transparent 1px 8px),var(--dsw-specific-sidebar-fill);overflow:visible}",
      "body[data-dsh-air] :is(__AIRSIDEBAR__)>div{background:0 0;position:relative}",
      "/* --- 黄区: mascot sits BELOW the translucent panels by default (z-index 1);",
      "         only raised above (z-index 6) when no session records are visible below it */",
      "body[data-dsh-air] :is(__AIRSIDEBAR__)>div>:not([data-air-chrome=sidebar-mascot],[role=tooltip]){z-index:2;position:relative}",
      "body[data-dsh-air] [data-air-chrome=sidebar-mascot]{position:absolute;left:50%;bottom:64px;z-index:1;width:78%;max-height:52%;object-fit:contain;object-position:center bottom;pointer-events:none;opacity:.6;filter:drop-shadow(0 10px 18px rgba(64,140,200,.28))saturate(.96)brightness(1.0);transform:translate(-50%);transition:opacity .4s,transform .4s,z-index .2s}",
      "body[data-dsh-air][data-air-mascot-top] [data-air-chrome=sidebar-mascot]{z-index:6;opacity:.85}",
      "body[data-dsh-air][data-ds-dark-theme] [data-air-chrome=sidebar-mascot]{opacity:.5;filter:brightness(.85)saturate(.9)drop-shadow(0 12px 20px rgba(0,0,0,.5))}",
      "body[data-dsh-air][data-ds-dark-theme][data-air-mascot-top] [data-air-chrome=sidebar-mascot]{opacity:.7}",
      "body[data-dsh-air][data-air-sidebar=rail] [data-air-chrome=sidebar-mascot],body[data-dsh-air][data-air-sidebar=narrow] [data-air-chrome=sidebar-mascot]{display:none}",
      "/* sidebar ambient (mounted on body, positions synced by JS): star-trail at bottom, sakura branch at bottom-left, birds mid-right */",
      "body[data-dsh-air] [data-air-chrome=sidebar-star]{position:fixed;height:110px;background:url(" + ASSET_STAR + ") center 30%/cover no-repeat;mix-blend-mode:multiply;opacity:.2;pointer-events:none;z-index:3;-webkit-mask-image:linear-gradient(180deg,transparent,rgba(0,0,0,.5) 55%,rgba(0,0,0,.85));mask-image:linear-gradient(180deg,transparent,rgba(0,0,0,.5) 55%,rgba(0,0,0,.85))}",
      "body[data-dsh-air][data-ds-dark-theme] [data-air-chrome=sidebar-star]{opacity:.18;mix-blend-mode:screen}",
      "body[data-dsh-air] [data-air-chrome=sidebar-branch]{position:fixed;width:120px;height:96px;background:url(" + ASSET_BRANCH + ") center/contain no-repeat;pointer-events:none;z-index:3;opacity:.7;transform:scaleX(-1);filter:hue-rotate(172deg) saturate(1.5) brightness(1.06)}",
      "body[data-dsh-air][data-ds-dark-theme] [data-air-chrome=sidebar-branch]{opacity:.3}",
      "body[data-dsh-air] [data-air-chrome=sidebar-birds]{position:fixed;width:86px;height:30px;background:var(--air-bird-art) center/contain no-repeat;opacity:.5;pointer-events:none;z-index:3;animation:air-bird-float 8s ease-in-out infinite}",
      "/* sidebar section glyphs (卷轴风装饰) */",
      "body[data-dsh-air] :is(__AIRSIDEBAR__) [class*=sectionHeader]{color:var(--air-sky-deep);font-weight:700;letter-spacing:.02em}",
      "body[data-dsh-air] :is(__AIRSIDEBAR__) [class*=sectionHeader] [class*=sectionLabel]{color:inherit}",
      "body[data-dsh-air] :is(__AIRSIDEBAR__) [class*=sectionHeader] [class*=sectionLabel]:before{content:\"❀\";margin-right:6px;color:var(--air-sakura-deep);font-size:.92em;text-shadow:0 0 6px rgba(247,184,207,.8)}",
      "/* --- 绿区: brand logo row — ornate gold capsule + shine sweep --- */",
      "body[data-dsh-air] :is(__AIRSIDEBAR__) [class*=logoRow]{position:relative;background:linear-gradient(135deg,rgba(255,240,200,.45),rgba(240,250,255,.35)),linear-gradient(135deg,rgba(200,230,250,.55),rgba(240,250,255,.35));border:1px solid rgba(222,176,90,.55);border-radius:14px;box-shadow:inset 0 1px 0 rgba(255,255,255,.75),0 0 14px rgba(232,182,76,.18),0 4px 14px rgba(80,150,210,.12);overflow:hidden}",
      "body[data-dsh-air] :is(__AIRSIDEBAR__) [class*=logoRow]::after{content:\"\";position:absolute;inset:0;border-radius:14px;background:linear-gradient(115deg,transparent 32%,rgba(255,238,190,.5) 45%,transparent 58%);background-size:260% 100%;animation:air-shine 5.5s ease-in-out infinite;pointer-events:none;z-index:5}",
      "@keyframes air-shine{0%{background-position:190% 0}55%,100%{background-position:-90% 0}}",
      "body[data-dsh-air] :is(__AIRSIDEBAR__) [class*=logoRow] [class*=brand]{position:relative;z-index:6;padding-left:16px}",
      "body[data-dsh-air] :is(__AIRSIDEBAR__) [class*=brand] svg{display:none}",
      "/* 品牌行: 内核的 logoRow 里还挂着一块自带的 identity(鱼标 + 本地构建版本名), 它和",
      "   皮肤自绘的 wordmark 挤在同一行, 而 .brand 自身带 overflow:hidden —— 结果自绘的",
      "   「HARNESS」胶囊被裁掉, 只剩一个方块。这里让自带 identity 退场(皮肤提供完整",
      "   wordmark: 金色 deepseek + HARNESS 胶囊), 并解除裁切、改为左对齐。 */",
      "body[data-dsh-air] :is(__AIRSIDEBAR__) [class*=logoRow] [class*=brandIdentity]{display:none!important}",
      "body[data-dsh-air] :is(__AIRSIDEBAR__) [class*=logoRow] [class*=brand]{overflow:visible!important;justify-content:flex-start!important}",
      "body[data-dsh-air] .air-brand-custom{display:inline-flex;align-items:center;gap:7px;min-width:0;white-space:nowrap}",
      "body[data-dsh-air] .air-brand-deepseek{font-family:var(--air-body-font);font-weight:800;font-size:19px;line-height:1;letter-spacing:.02em;color:#ffd75e;background:linear-gradient(120deg,#fff6d8 0%,#ffe06e 30%,#f6b93b 55%,#ffd257 72%,#fff0bd 100%);-webkit-background-clip:text;background-clip:text;text-shadow:0 0 2px rgba(10,6,0,.98),0 0 3px rgba(10,6,0,.85),0 0 6px rgba(10,6,0,.6),0 2px 1px rgba(10,6,0,.7),0 1px 0 rgba(255,255,255,.2)}",
      "body[data-dsh-air][data-ds-dark-theme] .air-brand-deepseek{-webkit-text-stroke:1.3px rgba(0,0,0,.95)}",
      "body[data-dsh-air] .air-brand-harness{font-size:10px;font-weight:800;letter-spacing:.15em;color:#fff;padding:2.5px 9px 2px;border-radius:999px;background:linear-gradient(135deg,#4a6fa5,#1e3a5f);border:1px solid rgba(255,215,140,.9);box-shadow:0 0 0 1px rgba(255,215,140,.3),inset 0 1px 0 rgba(255,255,255,.35),0 2px 7px rgba(0,0,0,.3);text-shadow:0 1px 2px rgba(0,0,0,.55)}",
      "body[data-dsh-air][data-ds-dark-theme] .air-brand-harness{background:linear-gradient(135deg,#7ea6d8,#2c4e7e);border-color:rgba(255,225,160,.75)}",
      "body[data-dsh-air] [data-air-chrome=brand-corner]{position:absolute;width:20px;height:20px;background:var(--air-ornament-art) center/contain no-repeat;pointer-events:none;z-index:6;opacity:.9}",
      "/* --- 紫区: 新会话 capsule — sky-glass with feather + sakura (distinct from gold brand) --- */",
      "body[data-dsh-air] :is(__AIRSIDEBAR__) button[class*=newSession]{position:relative;border-radius:999px;color:var(--air-ink);border:1px solid rgba(140,200,240,.65);background:linear-gradient(135deg,rgba(250,253,255,.95),rgba(224,242,253,.86));box-shadow:inset 0 0 0 1px rgba(255,255,255,.8),0 3px 12px rgba(80,150,210,.26),0 0 16px rgba(140,200,240,.16);font-weight:600;transition:box-shadow .25s,transform .2s;overflow:visible}",
      "body[data-dsh-air] :is(__AIRSIDEBAR__) button[class*=newSession]:hover:not(:disabled){transform:translateY(-1px);box-shadow:inset 0 0 0 1px rgba(255,255,255,.85),0 0 0 4px rgba(140,200,240,.16),0 0 24px rgba(140,200,240,.42),0 3px 12px rgba(80,150,210,.3)}",
      "body[data-dsh-air] :is(__AIRSIDEBAR__) button[class*=newSession] svg{color:var(--air-sky-deep)}",
      "body[data-dsh-air] :is(__AIRSIDEBAR__) button[class*=newSession]:before{content:\"\";position:absolute;right:8px;top:50%;width:15px;height:15px;background:var(--air-feather-art) center/contain no-repeat;transform:translateY(-50%) rotate(14deg);opacity:.8;pointer-events:none;filter:drop-shadow(0 1px 2px rgba(100,160,215,.45));animation:air-sway 3.6s ease-in-out infinite}",
      "body[data-dsh-air] :is(__AIRSIDEBAR__) button[class*=newSession]:after{content:\"❀\";position:absolute;left:-3px;top:-8px;font-size:13px;color:var(--air-sakura-deep);text-shadow:0 0 7px rgba(247,184,207,.95);animation:air-spin 9s linear infinite;pointer-events:none}",
      "@keyframes air-spin{to{transform:rotate(360deg)}}",
      "body[data-dsh-air][data-air-sidebar=rail] :is(__AIRSIDEBAR__) button[class*=newSession]:before,body[data-dsh-air][data-air-sidebar=rail] :is(__AIRSIDEBAR__) button[class*=newSession]:after{display:none}",
      "/* 新会话 capsule 镶边: sky-blue art-nouveau corners (different material from the input box's gold frame) */",
      "body[data-dsh-air] .air-capsule-corner{position:absolute;width:30px;height:30px;object-fit:contain;pointer-events:none;z-index:5;opacity:.9;filter:drop-shadow(0 1px 3px rgba(110,180,235,.55))}",
      "body[data-dsh-air][data-ds-dark-theme] .air-capsule-corner{opacity:.75}",
      "body[data-dsh-air][data-ds-dark-theme] :is(__AIRSIDEBAR__) button[class*=newSession]{color:var(--air-ink);background:linear-gradient(135deg,rgba(52,96,146,.92),rgba(36,72,118,.86));border-color:rgba(140,200,240,.42);box-shadow:inset 0 0 0 1px rgba(255,255,255,.1),0 3px 12px rgba(0,0,0,.35)}",
      "/* --- 粉区: workspace folder rows — capsule under the folder name (reuse 紫区 style) --- */",
      "body[data-dsh-air] :is(__AIRSIDEBAR__) [class*=projectRow]{position:relative;border-radius:999px;margin:2px 0;background:linear-gradient(135deg,rgba(250,253,255,.9),rgba(226,243,253,.7));border:1px solid rgba(140,200,240,.48);box-shadow:inset 0 0 0 1px rgba(255,255,255,.62),0 2px 8px rgba(80,150,210,.14);transition:box-shadow .2s,transform .2s,background-color .2s;overflow:visible}",
      "body[data-dsh-air] :is(__AIRSIDEBAR__) [class*=projectRow]:hover{transform:translateX(2px);background:linear-gradient(135deg,rgba(250,253,255,.97),rgba(212,237,252,.9));box-shadow:inset 0 0 0 1px rgba(255,255,255,.75),0 0 16px rgba(140,200,240,.4),0 2px 8px rgba(80,150,210,.2)}",
      "body[data-dsh-air][data-ds-dark-theme] :is(__AIRSIDEBAR__) [class*=projectRow]{background:linear-gradient(135deg,rgba(34,70,116,.85),rgba(24,52,92,.75));border-color:rgba(140,200,240,.32)}",
      "body[data-dsh-air] :is(__AIRSIDEBAR__) [class*=projectRow] [class*=folder]{color:var(--air-sky-deep);filter:drop-shadow(0 0 5px rgba(140,200,240,.65))}",
      "body[data-dsh-air] :is(__AIRSIDEBAR__) [class*=projectRow] [class*=title]{font-weight:600}",
      "/* session rows (上下文记录): soft sakura hover + Q版 silhouette peek */",
      "body[data-dsh-air] :is(__AIRSIDEBAR__) [class*=sessionRow]{position:relative;border-radius:12px;margin:1px 0;transition:background-color .15s}",
      "body[data-dsh-air] :is(__AIRSIDEBAR__) [class*=sessionRow]:hover{background:linear-gradient(90deg,rgba(247,210,224,.38),rgba(140,200,240,.16))}",
      "body[data-dsh-air] :is(__AIRSIDEBAR__) [class*=sessionRow]:hover:after,body[data-dsh-air] :is(__AIRSIDEBAR__) [class*=projectRow]:hover:after{content:\"\";position:absolute;right:4px;top:50%;width:24px;height:24px;background:url(" + ASSET_MASCOT + ") center/contain no-repeat;transform:translateY(-50%);opacity:.38;pointer-events:none;filter:drop-shadow(0 0 4px rgba(140,200,240,.7));z-index:1}",
      "body[data-dsh-air] :is(__AIRSIDEBAR__) [class*=sessionRow][aria-selected=true],body[data-dsh-air] :is(__AIRSIDEBAR__) [aria-selected=true][class*=row]{background:linear-gradient(90deg,rgba(140,200,240,.30),rgba(140,200,240,.12));box-shadow:inset 2px 0 0 var(--air-sky)}",
      "/* settings gear -> rotating sakura (kept) */",
      "body[data-dsh-air] [data-slot=sidebar\\.settings]>:is(button,[role=button]){position:relative}",
      "body[data-dsh-air] [data-slot=sidebar\\.settings]>:is(button,[role=button]) svg{opacity:.15;transition:opacity .2s}",
      "body[data-dsh-air] [data-slot=sidebar\\.settings]>:is(button,[role=button]):hover svg{opacity:.05}",
      "body[data-dsh-air] [data-slot=sidebar\\.settings]>:is(button,[role=button]):before{content:\"\";position:absolute;width:20px;height:20px;background:var(--air-sakura-art) center/contain no-repeat;animation:air-spin 7s linear infinite;filter:drop-shadow(0 0 5px rgba(247,184,207,.85));pointer-events:none}",
      "body[data-dsh-air][data-air-sidebar=rail] [data-slot=sidebar\\.settings]>:is(button,[role=button]):before{width:18px;height:18px}",
      "/* running dot glow + selection ribbon (kept) */",
      "body[data-dsh-air] svg[data-state=ongoing]{filter:drop-shadow(0 0 5px rgba(110,180,235,.9));animation:air-pulse 1.3s ease-in-out infinite}",
      "@keyframes air-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.55;transform:scale(.86)}}",
      "",
      "/* ============ composer / input card ============ */",
      "/* --- 红区: four-side ornament frame + gold corner accents --- */",
      "/* NOTE: no isolation / z-index on the card — an isolated stacking context made the composer paint OVER the settings modal */",
      "body[data-dsh-air] [data-composer-card]{position:relative;border:1px solid var(--air-glass-border);background:linear-gradient(180deg,rgba(252,254,255,.88),rgba(244,251,255,.72)),var(--air-glass);border-radius:24px;box-shadow:0 0 0 1px rgba(247,184,207,.30),0 0 0 4px rgba(140,200,240,.10),var(--air-shadow),inset 0 1px 0 rgba(255,255,255,.85);backdrop-filter:blur(7px) saturate(.95);overflow:visible;transition:border-color .25s,box-shadow .25s}",
      "body[data-dsh-air][data-ds-dark-theme] [data-composer-card]{background:linear-gradient(180deg,rgba(22,54,92,.82),rgba(13,36,62,.72)),var(--air-glass);box-shadow:0 0 0 1px rgba(247,184,207,.18),0 0 0 4px rgba(140,200,240,.08),var(--air-shadow),inset 0 1px 0 rgba(255,255,255,.07);backdrop-filter:blur(7px) saturate(.9)}",
      "body[data-dsh-air] [data-composer-card]:focus-within{border-color:rgba(110,185,240,.9);box-shadow:0 0 0 1px rgba(247,184,207,.35),0 0 0 5px rgba(110,185,240,.20),var(--air-shadow)}",
      "/* gold frame on the four borders — arc corners hugging the rounded corners + edge strips (nothing intrudes into the card) */",
      "body[data-dsh-air] [data-air-chrome=card-goldcorner]{position:absolute;width:40px;height:40px;object-fit:contain;pointer-events:none;z-index:5;filter:drop-shadow(0 2px 5px rgba(180,140,60,.4))}",
      "body[data-dsh-air][data-ds-dark-theme] [data-air-chrome=card-goldcorner]{filter:drop-shadow(0 2px 5px rgba(0,0,0,.5)) opacity:.85}",
      "body[data-dsh-air] [data-air-chrome=card-goldedge]{position:absolute;pointer-events:none;z-index:5;opacity:.85}",
      "body[data-dsh-air][data-ds-dark-theme] [data-air-chrome=card-goldedge]{opacity:.7}",
      "/* slim side ornaments sit OUTSIDE the border (not inside the card), so nothing is covered */",
      "body[data-dsh-air] [data-air-chrome=card-goldside]{position:absolute;pointer-events:none;z-index:5;opacity:.9;background-repeat:repeat-y;background-position:center center}",
      "/* gold jewel crest on the top border centre (replaces the removed wing — sits fully above the border, never blocks text) */",
      "body[data-dsh-air] [data-air-chrome=card-gem]{position:absolute;top:-34px;left:50%;transform:translateX(-50%);width:150px;height:auto;pointer-events:none;z-index:7;filter:drop-shadow(0 6px 14px rgba(180,140,60,.4))}",
      "/* feather garlands on the left/right borders (随风摆动) */",
      "body[data-dsh-air] [data-air-chrome=card-feather]{position:absolute;width:28px;height:28px;background:var(--air-feather-art) center/contain no-repeat;pointer-events:none;z-index:5;opacity:.75;filter:drop-shadow(0 3px 6px rgba(100,160,215,.35));transform-origin:50% 100%}",
      "body[data-dsh-air] [data-air-chrome=card-petal]{position:absolute;width:22px;height:22px;background:var(--air-petal-art) center/contain no-repeat;pointer-events:none;z-index:5;opacity:.95;animation:air-petal-float 5s ease-in-out infinite;filter:drop-shadow(0 2px 4px rgba(240,150,180,.4))}",
      "@keyframes air-petal-float{0%,100%{transform:translateY(0) rotate(-6deg)}50%{transform:translateY(-5px) rotate(14deg)}}",
      "/* corner feathers (kept) */",
      "body[data-dsh-air] [data-composer-card]::before,body[data-dsh-air] [data-composer-card]::after{content:\"\";position:absolute;width:36px;height:36px;background:var(--air-feather-art) center/contain no-repeat;pointer-events:none;z-index:6;opacity:.8;transform-origin:50% 100%;filter:drop-shadow(0 3px 6px rgba(100,160,215,.35))}",
      "body[data-dsh-air] [data-composer-card]::before{top:-22px;left:16px;animation:air-sway 3.8s ease-in-out infinite}",
      "body[data-dsh-air] [data-composer-card]::after{top:-20px;right:18px;transform:scaleX(-1);animation:air-sway 4.6s ease-in-out .6s infinite}",
      "@keyframes air-sway{0%,100%{transform:rotate(-9deg)}50%{transform:rotate(11deg)}}",
      "body[data-dsh-air][data-ds-dark-theme] [data-composer-card]::before,body[data-dsh-air][data-ds-dark-theme] [data-composer-card]::after{opacity:.5}",
      "/* --- 橙区: workspace & preset chips docked into the card top-left --- */",
      "body[data-dsh-air] [class*=composerStack]{position:relative}",
      "/* 滚动铁律: 内核把 composer seat 渲染成滚动容器 [data-conversation-scroll] 的",
      "   最后一个 flex 子元素, 于是滚轮滚消息会把输入框一起带走。用稳定契约属性",
      "   [data-composer-seat] 把它粘在滚动口底部 —— 只有消息区滚动, 输入框固定。",
      "   hero 态没有溢出时 sticky 自然不生效, 不影响居中布局。 */",
      "/* 滚动铁律: 输入框钉底 —— 由 JS pinComposerSeat() 用 position:fixed + 同步几何实现。",
      "   这里保留 sticky 只作为 JS 未跑到时的兜底(内核把 composer seat 放在滚动容器里,",
      "   且它下面还排着别的内容, 单靠 sticky 会在滚到底前脱钩 → 滚轮一带就上移、到顶弹回)。 */",
      "body[data-dsh-air] [data-composer-seat]{position:sticky;bottom:0;z-index:1}",
      "/* 悬停提示 / 浮层必须画在固定输入框之上。",
      "   背景: 输入框被 JS 改成 position:fixed 后成了「有 z-index 的定位元素」—— 它就必然",
      "   盖住任何层级更低/为 auto 的浮层。实测消息框底下的动作按钮(复制/分享…)悬停提示",
      "   是个低层级的黑框, 会被输入框压住。",
      "   处理: ① 输入框只保留打赢消息内容所需的最低层级 1;",
      "         ② 把提示/浮层统一抬到 9000, 双保险。 */",
      "body[data-dsh-air] [role=tooltip]{z-index:9000!important}",
      "body[data-dsh-air] [data-radix-popper-content-wrapper]{z-index:9000!important}",
      "/* 悬停提示被「裁掉」而不是被压住: dsh-viewport-lock 会给消息视图",
      "   <div class=XPOEOG_viewArea> 打一条 **inline** 的 clip-path:inset(0 0 Npx 0),",
      "   用来裁掉「进入透明输入框范围」的消息像素(它是为旧的 sticky 输入框设计的)。",
      "   但 clip-path 会把整块区域连同里面的元素一起裁掉 —— 消息动作按钮的悬停提示是",
      "   position:fixed(z-index:9999) 且渲染在消息行内部, 一旦落进那条被裁的带子里就",
      "   **直接被剪没**, 表现为「黑框被输入框挡住压住了」。",
      "   实测证据: 命中测试打不到提示框本身(HIT=scrollBody)、viewArea 的 computed",
      "   clip=inset(0px 0px Npx 0px)、且没有任何 CSS 规则匹配它(说明是 JS 打的 inline)。",
      "   作者 !important 能压过非 important 的 inline 样式, 所以下面这条足以解除。",
      "   现在输入框是 position:fixed + 滚动容器补了 padding-bottom, 不再依赖这条裁剪。 */",
      "body[data-dsh-air] [class*=viewArea]{clip-path:none!important}",
      "/* 滚动铁律 2 (滚轮外溢): 消息列表滚到底后继续滚轮, 浏览器会把滚动链交给外层。",
      "   页面里恰好有一个 6px 高的按钮挂在视口下方, 让 body 多出 21px 可滚动高度 ——",
      "   于是「再多滚一格」变成滚动整个页面, 输入框连同一整列一起被带走。",
      "   两层堵死: ① overscroll-behavior:contain 在会话滚动口切断滚动链;",
      "   ② body 用 overflow:clip —— clip 不产生 scroll container, 连程序化滚动都不存在。 */",
      "body[data-dsh-air] [data-conversation-scroll]{overscroll-behavior:contain}",
      "body[data-dsh-air]{overflow:clip!important;overscroll-behavior:none}",
      "/* 层级铁律(强制): 输入框卡片(0) ≥ 工作区/预设芯片(z0!important, 最低层) < 其它折叠菜单(overlay z60 / row 内 popover z12+ / seat 外 z>=1)。",
      "   根源: 原生 composerSeat 是 z-index:7 + sticky(创建 stacking context)，整个输入框被抬到 z7，",
      "   而折叠菜单渲染在 [data-conversation-composer-overlay]（与 composerSeat 同级、z auto），",
      "   所以以前给芯片行改 z(30/8) 都无效 —— 芯片的 z 只在其内部生效，永远盖不住 overlay。",
      "   处理: overlay 提到 z60、hero 态 seat 降到 z0、芯片行强制 z0!important —— 菜单必然在芯片之上。 */",
      "body[data-dsh-air] [data-conversation-composer-overlay]{position:relative;z-index:60}",
      "/* 终极兜底: hero 态把 composerSeat 从原生 z7 降到 z0(它创建 stacking context 且原生 z7 会把整个输入框抬到折叠菜单之上)。",
      "   hero 态输入框卡片本身 z auto(0) ≥ 芯片 z0!important < seat 外任意菜单 z>=1，三层顺序满足: 输入框 ≤ 芯片 < 菜单。",
      "   仅 hero 态生效，active 会话态保留原生 z7(sticky 盖滚动内容所需)。 */",
      "body[data-dsh-air] [data-phase=hero] [class*=composerSeat]{z-index:0}",
      "/* 保险: active 态输入框卡片顶部的'选择工作区'触发区同样强制压到最低层(0!important)，技能/命令等 popover 在 row(z12) 内可盖过它 */",
      "body[data-dsh-air] [data-composer-card] [class*=cardWorkspaceTrigger]{position:relative;z-index:0!important}",
      "body[data-dsh-air] [data-phase=hero] [class*=heroWorkspaceRow]{position:absolute;z-index:0!important;display:flex;align-items:center;gap:5px;padding:4px 6px;border-radius:14px;background:transparent;transition:opacity .3s}",
      "body[data-dsh-air] [data-phase=hero] [class*=heroWorkspaceRow] button{border-radius:999px;border:1px solid rgba(140,200,240,.5);background:linear-gradient(135deg,rgba(250,253,255,.94),rgba(224,242,253,.78));box-shadow:inset 0 1px 0 rgba(255,255,255,.85),0 2px 8px rgba(80,150,210,.16);color:var(--air-ink);font-weight:600;font-size:12.5px;backdrop-filter:blur(4px);transition:box-shadow .2s,transform .2s}",
      "body[data-dsh-air] [data-phase=hero] [class*=heroWorkspaceRow] button:hover{box-shadow:inset 0 1px 0 rgba(255,255,255,.9),0 0 0 3px rgba(140,200,240,.16),0 0 14px rgba(140,200,240,.35);transform:translateY(-1px)}",
      "body[data-dsh-air][data-ds-dark-theme] [data-phase=hero] [class*=heroWorkspaceRow] button{background:linear-gradient(135deg,rgba(46,86,132,.92),rgba(30,60,100,.85));color:var(--air-ink);border-color:rgba(140,200,240,.4)}",
      "body[data-dsh-air] [data-phase=hero] [data-composer-card]{padding-top:16px}",
      "/* 芯片行移到卡片上方外侧后: 标题上移 70px(hero 顶部空间充足) + 下方留 40px，芯片行落在标题与卡片之间、不与文字重叠 */",
      "body[data-dsh-air] [data-phase=hero] __AIRMOD(HeroShell.module.css|headline)__{margin-top:-70px;margin-bottom:40px}",
      "/* v0.2.4 冷启动兜底: 恢复的是「有消息的会话」时, HeroShell.module.css 尚未加载, 上面的令牌会退化成",
      "   :not(*) 而整条失效 -> hero 整行少 70px 上移(小鲸鱼/横幅/预览版看起来「错位」)。这里用免前缀锚",
      "   再写一遍同样的值: 令牌一旦解析成功, 两条规则值相同、互不冲突; 解析失败也有正确结果。",
      "   注意要排除 headlineText / previewBadge —— 它们的类名里也含 headline。 */",
      "body[data-dsh-air] [data-phase=hero] [class*=headline]:not([class*=headlineText]):not([class*=previewBadge]){margin-top:-70px;margin-bottom:40px}",
      "body[data-dsh-air] [data-phase=hero] [class*=heroWorkspaceRow] svg{color:var(--air-sky-deep)}",
      "/* hero (idle) phase — wider, airier (kept) */",
      "body[data-dsh-air] [data-phase=hero]{--dsh-chat-content-width:clamp(560px,42vw,780px)}",
      "body[data-dsh-air] [data-phase=hero] [data-composer-card] __AIRMOD(InputBar.module.css|grow|[class*=grow])__{min-height:clamp(76px,9vh,118px)}",
      "/* placeholder — Japanese handwriting, pale blue + glow (kept) */",
      "body[data-dsh-air] [data-composer-card] textarea::placeholder,body[data-dsh-air] [data-composer-placeholder]{color:rgba(120,175,220,.9);font-family:var(--air-hand-font);font-weight:600;font-size:15px;text-shadow:0 0 8px rgba(160,205,245,.75),0 0 16px rgba(160,205,245,.4);opacity:1}",
      "body[data-dsh-air][data-ds-dark-theme] [data-composer-card] textarea::placeholder,body[data-dsh-air][data-ds-dark-theme] [data-composer-placeholder]{color:rgba(160,205,245,.85);text-shadow:0 0 8px rgba(110,170,220,.6)}",
      "/* composer buttons: magic-book send + glow hover + sparkle glyph (kept & extended) */",
      "body[data-dsh-air] [data-composer-card] button{position:relative;transition:transform .16s,box-shadow .16s,background-color .16s,filter .16s}",
      "body[data-dsh-air] [data-composer-card] button:hover:not(:disabled){transform:translateY(-1px)}",
      "body[data-dsh-air] [data-composer-card] button[class*=primary]{color:#fff;background:linear-gradient(145deg,#7cc4ee,#3f8fd0);border:1px solid rgba(255,255,255,.5);box-shadow:0 4px 14px rgba(63,143,208,.45),inset 0 1px 0 rgba(255,255,255,.55)}",
      "body[data-dsh-air] [data-composer-card] button[class*=primary]:hover:not(:disabled){box-shadow:0 0 0 5px rgba(124,196,238,.28),0 6px 18px rgba(63,143,208,.5),inset 0 1px 0 rgba(255,255,255,.55)}",
      "body[data-dsh-air] [data-composer-card] button[class*=primary] svg{display:none}",
      "body[data-dsh-air] [data-composer-card] button[class*=primary]:before{content:\"\";position:absolute;inset:0;margin:auto;width:18px;height:15px;background:var(--air-book-art) center/contain no-repeat;filter:drop-shadow(0 0 4px rgba(255,255,255,.85))}",
      "body[data-dsh-air] [data-composer-card] button[class*=primary]:after{content:\"\";position:absolute;right:-4px;top:-4px;width:13px;height:13px;background:var(--air-star-art) center/contain no-repeat;animation:air-twinkle 2.4s ease-in-out infinite;opacity:.95;pointer-events:none}",
      "body[data-dsh-air] [data-composer-card] button:active:not(:disabled){transform:translateY(0) scale(.96)}",
      "/* refresh button -> sakura petal */",
      "body[data-dsh-air] [data-composer-card] button:has([class*=Refresh]) svg,body[data-dsh-air] :is(__AIRSIDEBAR__) button:has([class*=Refresh]) svg{display:none}",
      "body[data-dsh-air] [data-composer-card] button:has([class*=Refresh]):before,body[data-dsh-air] :is(__AIRSIDEBAR__) button:has([class*=Refresh]):before{content:\"❀\";font-size:15px;color:var(--air-sakura-deep);text-shadow:0 0 7px rgba(247,184,207,.95);animation:air-spin 8s linear infinite}",
      "/* loading buttons -> spinning star */",
      "body[data-dsh-air] button:has([class*=Loading]) svg{display:none}",
      "body[data-dsh-air] button:has([class*=Loading]):before{content:\"\";width:15px;height:15px;background:var(--air-star-art) center/contain no-repeat;animation:air-spin 1.1s linear infinite;filter:drop-shadow(0 0 5px rgba(255,247,201,.9));display:inline-block}",
      "/* add / tool buttons: soft sky circles (kept) */",
      "body[data-dsh-air] [data-composer-card] button[class*=add],body[data-dsh-air] [data-composer-card] [class*=modes] button[class*=trigger]{color:var(--air-sky-deep);background:rgba(240,250,255,.85);border:1px solid var(--air-glass-border);border-radius:50%;box-shadow:inset 0 0 0 3px rgba(255,255,255,.6),0 3px 10px rgba(80,150,210,.18)}",
      "body[data-dsh-air][data-ds-dark-theme] [data-composer-card] button[class*=add],body[data-dsh-air][data-ds-dark-theme] [data-composer-card] [class*=modes] button[class*=trigger]{color:#cfe7fa;background:rgba(30,66,104,.8);box-shadow:inset 0 0 0 3px rgba(255,255,255,.06),0 3px 10px rgba(0,0,0,.3)}",
      "/* --- redesign: no ornament intrudes into the card; '+' stays in the tools row and send stays above the thin gold frame --- */",
      "/* toolbar row + send button paint above any remaining border ornament */",
      "body[data-dsh-air] [data-composer-card] [class*=row]{position:relative;z-index:12}",
      "body[data-dsh-air] [data-composer-card] button[class*=primary]{position:relative;z-index:13}",
      "/* the '+' keeps its native spot in the tools row (bottom-left) — always visible & clickable, nothing covers it now */",
      "body[data-dsh-air] [data-composer-card] button[class*=add]{background:linear-gradient(145deg,#ffffff,#d7ecfb);box-shadow:inset 0 0 0 1px rgba(255,255,255,.92),0 2px 8px rgba(80,150,210,.35),0 0 0 3px rgba(140,200,240,.3)}",
      "/* --- round7: 标题栏 + 输入框底部信息配色 --- */",
      "/* 上下文对话标题 -> 与 deepseek 同款金色镶黑边 */",
      "body[data-dsh-air] __AIRMOD(ConversationRoot.module.css|crumb|[class*=crumb])__:not([class*=crumbSep]):not([class*=crumbSeg]){color:#ffd75e;background:linear-gradient(120deg,#fff6d8 0%,#ffe06e 30%,#f6b93b 55%,#ffd257 72%,#fff0bd 100%);-webkit-background-clip:text;background-clip:text;text-shadow:0 0 2px rgba(20,12,0,.95),0 0 5px rgba(20,12,0,.65),0 1px 0 rgba(255,255,255,.35)}",
      "/* 选项卡（对话/轨迹/文件）+ agent预设 -> 橙色 + 加粗黑色描边 */",
      "body[data-dsh-air] __AIRMOD(ConversationRoot.module.css|tab|[class*=tab])__{color:#ff8c1f!important;font-weight:600;text-shadow:0 0 2px rgba(10,6,0,.98),0 0 3px rgba(10,6,0,.85),0 0 6px rgba(10,6,0,.6),0 2px 1px rgba(10,6,0,.7),0 1px 0 rgba(255,255,255,.2)}",
      "body[data-dsh-air] __AIRMOD(AgentPresetLabel.module.css|label)__{color:#ff8c1f!important;text-shadow:0 0 2px rgba(10,6,0,.98),0 0 3px rgba(10,6,0,.85),0 0 6px rgba(10,6,0,.6),0 2px 1px rgba(10,6,0,.7),0 1px 0 rgba(255,255,255,.2)}",
      "body[data-dsh-air] __AIRMOD(AgentPresetLabel.module.css|label)__ svg,body[data-dsh-air] __AIRMOD(AgentPresetLabel.module.css|icon)__{color:#ff8c1f!important}",
      "/* hero 横幅「探索未至之境」-> 金色（强制 text-fill-color，防止被应用默认色覆盖）+ 黑色描边（减弱模糊） */",
      "body[data-dsh-air] __AIRMOD(HeroShell.module.css|headlineText|[class*=headlineText])__{color:#ffd75e;-webkit-text-fill-color:#ffd75e;font-weight:800!important;text-shadow:0 0 2px rgba(10,6,0,.95),0 0 4px rgba(10,6,0,.7),0 2px 1px rgba(10,6,0,.7),0 1px 0 rgba(255,255,255,.2)}",
      "/* 「预览版」徽章 -> 金色文字 + 浅金底（不再涂黑）+ 同款描边 */",
      "body[data-dsh-air] __AIRMOD(HeroShell.module.css|previewBadge|[class*=previewBadge])__{color:#ffd75e;-webkit-text-fill-color:#ffd75e;font-weight:700!important;background:linear-gradient(135deg,rgba(255,238,190,.92),rgba(255,214,110,.55))!important;border-color:rgba(201,134,30,.85)!important;text-shadow:0 0 2px rgba(10,6,0,.95),0 0 4px rgba(10,6,0,.7),0 2px 1px rgba(10,6,0,.7),0 1px 0 rgba(255,255,255,.2)}",
      "/* 输入框底部信息行 -> 橙色 + 加粗黑色描边；dsh-balance 的「空闲价」行不受影响 */",
      "body[data-dsh-air] __AIRMOD(ContextMeter.module.css|root)__,body[data-dsh-air] __AIRMOD(ContextMeter.module.css|root)__ *{color:#ff8c1f!important;text-shadow:0 0 2px rgba(10,6,0,.98),0 0 3px rgba(10,6,0,.85),0 0 6px rgba(10,6,0,.6),0 2px 1px rgba(10,6,0,.7),0 1px 0 rgba(255,255,255,.2)}",
      "body[data-dsh-air][data-ds-dark-theme] __AIRMOD(ConversationRoot.module.css|tab|[class*=tab])__,body[data-dsh-air][data-ds-dark-theme] __AIRMOD(AgentPresetLabel.module.css|label)__,body[data-dsh-air][data-ds-dark-theme] __AIRMOD(ContextMeter.module.css|root)__{color:#ffa14d!important}",
      "/* click ripple (water drop) */",
      "body[data-dsh-air] .air-click-ripple{position:absolute;width:14px;height:14px;border-radius:50%;border:1.5px solid rgba(140,200,240,.9);transform:translate(-50%,-50%) scale(.3);animation:air-ripple-click .6s ease-out forwards;pointer-events:none;z-index:9}",
      "@keyframes air-ripple-click{0%{transform:translate(-50%,-50%) scale(.3);opacity:.95}100%{transform:translate(-50%,-50%) scale(3.4);opacity:0}}",
      "",
      "/* ============ chat messages (kept + adaptive glow) ============ */",
      "body[data-dsh-air] [data-chat-flow]{scroll-margin-block:8px}",
      "/* 消息气泡刻意不用 backdrop-filter / filter（毛玻璃观感用加深的渐变表达）。",
      "   原因: backdrop-filter 会创建 stacking context 并成为 position:fixed 后代的包含块,",
      "   消息框底下的动作按钮提示(`.<hash>_bubble_<n>`, position:fixed)就在这条链上 ——",
      "   任何这类「把固定定位后代关起来」的属性都会让浮层行为变得难预测。",
      "   (本皮肤实测到的真正元凶是 viewArea 上的 inline clip-path, 见上文 composer 段落;",
      "    这里只是顺手不给自己再制造同类陷阱。) */",
      "body[data-dsh-air] [data-chat-flow-kind=user]>*>*>div:not([data-variant]){box-sizing:border-box;background:linear-gradient(150deg,rgba(247,210,224,.86),rgba(250,235,242,.78));border:1px solid rgba(247,184,207,.55);border-radius:18px 18px 7px 18px;box-shadow:0 5px 16px rgba(220,120,160,.16),inset 0 1px 0 rgba(255,255,255,.7)}",
      "body[data-dsh-air][data-ds-dark-theme] [data-chat-flow-kind=user]>*>*>div:not([data-variant]){background:linear-gradient(150deg,rgba(88,40,70,.88),rgba(52,30,58,.82));border-color:rgba(247,184,207,.35);box-shadow:0 5px 16px rgba(0,0,0,.3)}",
      "body[data-dsh-air] [data-chat-flow-kind=assistant-step]>*>*>div:not([data-variant]),body[data-dsh-air] [data-chat-flow-kind=assistant]>*>*>div:not([data-variant]){box-sizing:border-box;background:linear-gradient(180deg,rgba(248,252,255,.94),rgba(240,249,255,.90));border:1px solid var(--air-glass-border);border-radius:18px 18px 18px 7px;box-shadow:var(--air-shadow),inset 0 1px 0 rgba(255,255,255,.8)}",
      "body[data-dsh-air][data-ds-dark-theme] [data-chat-flow-kind=assistant-step]>*>*>div:not([data-variant]),body[data-dsh-air][data-ds-dark-theme] [data-chat-flow-kind=assistant]>*>*>div:not([data-variant]){background:rgba(14,36,62,.82);border-color:rgba(110,180,230,.35);box-shadow:var(--air-shadow),inset 0 1px 0 rgba(255,255,255,.05)}",
      "/* glow + bold Japanese-style body text: sakura-pink for user, sky-cyan for assistant */",
      "body[data-dsh-air] [data-chat-flow] [class*=content],body[data-dsh-air] [data-chat-flow] p,body[data-dsh-air] [data-chat-flow] li{font-family:var(--air-body-font);font-weight:600;letter-spacing:.01em}",
      "body[data-dsh-air] [data-chat-flow-kind=user] [class*=content]{color:#7a3b52;text-shadow:0 0 10px rgba(247,184,207,.45)}",
      "body[data-dsh-air] [data-chat-flow-kind=assistant-step] [class*=content],body[data-dsh-air] [data-chat-flow-kind=assistant] [class*=content]{color:var(--air-ink);text-shadow:0 0 10px rgba(140,200,245,.4)}",
      "body[data-dsh-air][data-ds-dark-theme] [data-chat-flow-kind=user] [class*=content]{color:#ffd3e0;text-shadow:0 0 10px rgba(247,184,207,.35)}",
      "/* tool rows: glass chips (kept) —— 同样不加 backdrop-filter，理由见上面消息气泡那段 */",
      "body[data-dsh-air] [data-chat-flow-kind=tool-call]>*,body[data-dsh-air] [data-chat-flow-kind=tool-result]>*{background:rgba(238,248,255,.82);border:1px solid rgba(140,200,240,.4);border-radius:12px}",
      "body[data-dsh-air][data-ds-dark-theme] [data-chat-flow-kind=tool-call]>*,body[data-dsh-air][data-ds-dark-theme] [data-chat-flow-kind=tool-result]>*{background:rgba(16,42,72,.66);border-color:rgba(140,200,240,.28)}",
      "/* tool running: sparkle burst hook */",
      "body[data-dsh-air] [data-chat-flow-kind=tool-call][data-state=running],body[data-dsh-air] [data-chat-flow-kind=tool-call]:has([data-state=running]){position:relative}",
      "body[data-dsh-air] [data-chat-flow-kind=tool-call][data-state=running]:after,body[data-dsh-air] [data-chat-flow-kind=tool-call]:has([data-state=running]):after{content:\"\";position:absolute;top:50%;right:-10px;width:18px;height:18px;background:var(--air-star-art) center/contain no-repeat;animation:air-twinkle 1.4s ease-in-out infinite;opacity:.9;pointer-events:none}",
      "/* code blocks (kept) */",
      "body[data-dsh-air] pre{border:1px solid rgba(140,200,240,.4);border-radius:14px;box-shadow:0 6px 20px rgba(80,150,210,.14);background:rgba(250,253,255,.9)}",
      "body[data-dsh-air][data-ds-dark-theme] pre{background:rgba(8,22,40,.92);box-shadow:0 6px 20px rgba(0,0,0,.35)}",
      "",
      "/* ============ thinking hook: magic circle ripple (kept) ============ */",
      "body[data-dsh-air] [data-variant=think][data-state=running] [class*=row]{position:relative}",
      "body[data-dsh-air] [data-variant=think][data-state=running] [class*=row]:before{content:\"\";position:absolute;left:-8px;top:50%;width:36px;height:36px;border:1.6px solid rgba(110,180,235,.65);border-radius:50%;transform:translateY(-50%) scale(.4);opacity:0;animation:air-ripple 1.7s ease-out infinite;pointer-events:none}",
      "body[data-dsh-air] [data-variant=think][data-state=running] [class*=row]:after{content:\"\";position:absolute;left:-8px;top:50%;width:36px;height:36px;border:1.6px solid rgba(247,184,207,.55);border-radius:50%;transform:translateY(-50%) scale(.4);opacity:0;animation:air-ripple 1.7s ease-out .5s infinite;pointer-events:none}",
      "@keyframes air-ripple{0%{transform:translateY(-50%) scale(.35);opacity:.95}100%{transform:translateY(-50%) scale(1.55);opacity:0}}",
      "body[data-dsh-air] [data-state=running] :is([class*=runState],[class*=stateDot]){filter:drop-shadow(0 0 6px rgba(110,180,235,.9))}",
      "",
      "/* ============ hero headline (kept) ============ */",
      "body[data-dsh-air] [data-phase=hero] [class*=headline]{color:var(--air-ink);font-family:var(--air-body-font);font-weight:700;text-shadow:0 1px 0 rgba(255,255,255,.9),0 6px 22px rgba(120,180,230,.35);letter-spacing:.02em}",
      "/* 标题行布局铁律(通用选择器, 不依赖 css-module 前缀): 小鲸鱼 | 标题胶囊 | 预览版 横排同一水平线。",
      "   flex + align-items:center 是最可靠的垂直居中; 鱼固定 34px; 全部 !important 防覆盖。 */",
      "body[data-dsh-air] [data-phase=hero] [class*=headline]:not([class*=headlineText]):not([class*=previewBadge]):not([class*=fish]){display:flex!important;align-items:center!important;justify-content:center!important;gap:6px!important;flex-wrap:nowrap!important;writing-mode:horizontal-tb!important;min-width:0;max-width:100%}",
      "/* 小鲸鱼胶囊底衬(浅蓝玻璃圆角, 让鱼图标更清晰, 与标题胶囊风格统一) */",
      "body[data-dsh-air] [data-phase=hero] [class*=headline] [class*=fish],body[data-dsh-air] [data-phase=hero] [class*=fishHitbox]{display:flex!important;align-items:center;justify-content:center;width:40px!important;height:40px!important;flex:0 0 40px!important;margin:0!important;background:linear-gradient(135deg,rgba(255,255,255,.95),rgba(214,238,252,.8));border:1px solid rgba(140,200,240,.6);border-radius:13px;box-shadow:0 2px 8px rgba(80,150,210,.25),inset 0 1px 0 rgba(255,255,255,.9)}",
      "body[data-dsh-air][data-ds-dark-theme] [data-phase=hero] [class*=headline] [class*=fish],body[data-dsh-air][data-ds-dark-theme] [data-phase=hero] [class*=fishHitbox]{background:linear-gradient(135deg,rgba(36,70,108,.92),rgba(24,48,80,.85));border-color:rgba(140,200,240,.4)}",
      "body[data-dsh-air] [data-phase=hero] [class*=headline] [class*=fish] svg,body[data-dsh-air] [data-phase=hero] [class*=fishHitbox] svg{width:32px!important;height:32px!important;display:block;margin:auto}",
      "/* 标题文字放入胶囊(玻璃胶囊+金色字)，与左侧小鲸鱼同一水平线；translateY 下移 55px(用户微调定稿)。",
      "   文字立体感: 深色细描边(外轮廓) + 底部两层投影(凸起浮雕) + 柔和外阴影(与背景分离) */",
      "body[data-dsh-air] [data-phase=hero] [class*=headlineText]{display:flex!important;align-items:center;justify-content:center;align-self:center!important;background:linear-gradient(135deg,rgba(255,255,255,.92),rgba(214,238,252,.75));-webkit-background-clip:border-box!important;background-clip:border-box!important;border:1px solid rgba(140,200,240,.55);border-radius:999px;padding:4px 18px;white-space:nowrap;box-shadow:0 2px 10px rgba(80,150,210,.18),inset 0 1px 0 rgba(255,255,255,.85);font-size:26px;line-height:1.2;text-shadow:0 0 1.5px rgba(30,18,0,.95),0 0 3px rgba(30,18,0,.8),0 1px 0 rgba(90,52,8,.5),0 2px 0 rgba(90,52,8,.35),0 3px 8px rgba(40,20,0,.45)}",
      "body[data-dsh-air][data-ds-dark-theme] [data-phase=hero] [class*=headlineText]{background:linear-gradient(135deg,rgba(34,64,96,.9),rgba(24,48,80,.85))!important;border-color:rgba(140,200,240,.4)}",
      "/* 预览版贴标题胶囊右上角(flex 行内靠顶) */",
      "/* 预览版贴标: 与 小鲸鱼 / 文字横幅 **同一条水平中线**（不再 align-self:flex-start 吊在右上），",
      "   三者合成一条对称、居中的标题行；整行仍由 flex 居中。 */",
      "body[data-dsh-air] [data-phase=hero] [class*=headline] [class*=Badge],body[data-dsh-air] [data-phase=hero] [class*=previewBadge]{align-self:center!important;margin:0 0 0 3px!important;display:inline-block!important;white-space:nowrap}",
      "",
      "/* ============ dialogs / question cards ============ */",
      "body[data-dsh-air] :is([role=dialog],[role=menu],[data-radix-popper-content-wrapper]>*){background:var(--air-glass-strong);border:1px solid var(--air-glass-border);border-radius:16px;box-shadow:var(--air-shadow);backdrop-filter:blur(10px) saturate(.95)}",
      "body[data-dsh-air] [data-question-key]>section{background:var(--air-glass-strong);border-color:var(--air-glass-border);box-shadow:var(--air-shadow);backdrop-filter:blur(10px)}",
      "",
      "/* ============ settings modal: PRISTINE (no theming, keep original content/tabs) ============ */",
      "/* ambient effects pause while the settings window is open */",
      "body[data-dsh-air][data-air-settings-open] [data-air-chrome=feathers],body[data-dsh-air][data-air-settings-open] [data-air-chrome=sparkles],body[data-dsh-air][data-air-settings-open] [data-air-chrome=ambient]{display:none!important}",
      "/* hide the composer card + docked chips while settings is open: they must never paint over or intercept the modal */",
      "body[data-dsh-air][data-air-settings-open] [data-composer-card],body[data-dsh-air][data-air-settings-open] [data-phase=hero] [class*=heroWorkspaceRow]{display:none!important}",
      "/* restore the original alias palette inside the settings subtree */",
      "body[data-dsh-air][data-air-settings-open] [data-slot=sidebar\\.settings]{--dsw-alias-bg-base:var(--dsw-static-neutral-bluish-00);--dsw-alias-bg-layer-1:var(--dsw-static-neutral-bluish-00);--dsw-alias-bg-layer-2:var(--dsw-static-neutral-bluish-00);--dsw-alias-bg-layer-3:var(--dsw-static-neutral-bluish-00);--dsw-alias-bg-overlay:var(--dsw-static-neutral-bluish-150);--dsw-alias-border-l1:rgba(0,0,0,.04);--dsw-alias-border-l2:rgba(0,0,0,.1);--dsw-alias-border-l2-darkmode-thin:rgba(0,0,0,.1);--dsw-alias-border-l3:rgba(0,0,0,.12);--dsw-alias-border-l4:rgba(0,0,0,.16);--dsw-alias-brand-primary:var(--dsw-static-neutral-bluish-1000);--dsw-alias-label-primary:var(--dsw-static-neutral-bluish-1000);--dsw-alias-label-secondary:var(--dsw-static-neutral-bluish-700);--dsw-alias-label-tertiary:var(--dsw-static-neutral-bluish-600);--dsw-alias-label-caption:var(--dsw-static-neutral-bluish-400);--dsw-alias-label-dimmed:var(--dsw-static-neutral-bluish-200);--dsw-alias-interactive-bg-hover:rgba(38,49,72,.06);--dsw-alias-interactive-bg-active:rgba(38,49,72,.1);--dsw-specific-sidebar-fill:var(--dsw-static-neutral-bluish-50);--dsw-specific-sidebar-nav-item-active:var(--dsw-static-neutral-bluish-100);--dsw-specific-sidebar-nav-item-hover:var(--dsw-static-neutral-bluish-75);--dsw-specific-sidebar-nav-item-active-accent:var(--dsw-static-deepseek-100);--dsw-specific-input-major:var(--dsw-static-neutral-bluish-00);--dsw-specific-selector:var(--dsw-static-neutral-bluish-60)}",
      "body[data-dsh-air][data-ds-dark-theme][data-air-settings-open] [data-slot=sidebar\\.settings]{--dsw-alias-bg-base:var(--dsw-static-neutral-bluish-950);--dsw-alias-bg-layer-1:var(--dsw-static-neutral-bluish-875);--dsw-alias-bg-layer-2:var(--dsw-static-neutral-bluish-850);--dsw-alias-bg-layer-3:var(--dsw-static-neutral-bluish-800);--dsw-alias-bg-overlay:var(--dsw-static-neutral-bluish-700);--dsw-alias-border-l1:rgba(255,255,255,.06);--dsw-alias-border-l2:rgba(255,255,255,.12);--dsw-alias-border-l2-darkmode-thin:rgba(255,255,255,.06);--dsw-alias-border-l3:rgba(255,255,255,.16);--dsw-alias-border-l4:rgba(255,255,255,.2);--dsw-alias-brand-primary:var(--dsw-static-neutral-bluish-50);--dsw-alias-label-primary:var(--dsw-static-neutral-bluish-50);--dsw-alias-label-secondary:var(--dsw-static-neutral-bluish-300);--dsw-alias-label-tertiary:var(--dsw-static-neutral-bluish-400);--dsw-alias-label-caption:var(--dsw-static-neutral-bluish-600);--dsw-alias-label-dimmed:var(--dsw-static-neutral-bluish-750);--dsw-alias-interactive-bg-hover:rgba(255,255,255,.08);--dsw-alias-interactive-bg-active:rgba(255,255,255,.14);--dsw-specific-sidebar-fill:var(--dsw-static-neutral-bluish-900);--dsw-specific-sidebar-nav-item-active:var(--dsw-static-neutral-bluish-750);--dsw-specific-sidebar-nav-item-hover:var(--dsw-static-neutral-bluish-850);--dsw-specific-sidebar-nav-item-active-accent:var(--dsw-static-neutral-bluish-800);--dsw-specific-input-major:var(--dsw-static-neutral-bluish-850);--dsw-specific-selector:var(--dsw-static-neutral-bluish-800)}",
      "/* the settings panel itself: opaque original look (undo the glass dialog styling) */",
      "body[data-dsh-air][data-air-settings-open] [data-slot=sidebar\\.settings] [role=dialog]{background:var(--dsw-static-neutral-bluish-00);border:1px solid var(--dsw-alias-border-l2);border-radius:24px;box-shadow:var(--dsw-shadow-lv3);backdrop-filter:none;-webkit-backdrop-filter:none}",
      "body[data-dsh-air][data-ds-dark-theme][data-air-settings-open] [data-slot=sidebar\\.settings] [role=dialog]{background:var(--dsw-static-neutral-bluish-850)}",
      "",
      "/* ============ titlebar + scrollbars + selection (kept) ============ */",
      "body[data-dsh-air] :is(__AIRTITLEBAR__){background:linear-gradient(180deg,rgba(200,230,250,.92),rgba(226,243,253,.85));border-bottom:1px solid var(--air-glass-border)}",
      "body[data-dsh-air][data-ds-dark-theme] :is(__AIRTITLEBAR__){background:linear-gradient(180deg,rgba(20,50,84,.96),rgba(13,34,58,.94));border-bottom-color:rgba(140,200,240,.25)}",
      "body[data-dsh-air] ::selection{background:rgba(140,200,240,.4)}",
      "body[data-dsh-air] :is(__AIRSIDEBAR__)::-webkit-scrollbar,body[data-dsh-air] [data-conversation-scroll]::-webkit-scrollbar{width:9px}",
      "body[data-dsh-air] :is(__AIRSIDEBAR__)::-webkit-scrollbar-thumb,body[data-dsh-air] [data-conversation-scroll]::-webkit-scrollbar-thumb{background:rgba(110,180,235,.4);border-radius:8px;border:2px solid transparent;background-clip:content-box}",
      "body[data-dsh-air] :is(__AIRSIDEBAR__)::-webkit-scrollbar-thumb:hover,body[data-dsh-air] [data-conversation-scroll]::-webkit-scrollbar-thumb:hover{background:rgba(110,180,235,.6);border:2px solid transparent;background-clip:content-box}",
      "",
      "/* ============ reduced motion (kept) ============ */",
      "@media (prefers-reduced-motion:reduce){body[data-dsh-air] [data-air-feather],body[data-dsh-air] [data-air-cloud],body[data-dsh-air] [data-air-spark],body[data-dsh-air] [data-air-birds],body[data-dsh-air] [data-air-chrome=sidebar-birds],body[data-dsh-air] [data-air-chrome=card-feather],body[data-dsh-air] [data-air-chrome=card-petal],body[data-dsh-air] [data-composer-card]::before,body[data-dsh-air] [data-composer-card]::after,body[data-dsh-air] [data-composer-card] button[class*=primary]:after,body[data-dsh-air] :is(__AIRSIDEBAR__) button[class*=newSession]:before,body[data-dsh-air] :is(__AIRSIDEBAR__) button[class*=newSession]:after,body[data-dsh-air] :is(__AIRSIDEBAR__) [class*=logoRow]::after,body[data-dsh-air] [data-variant=think][data-state=running] [class*=row]:before,body[data-dsh-air] [data-variant=think][data-state=running] [class*=row]:after{animation:none!important}}",
      "",
      "/* ============ activation self-check badge (小白友好: 激活时右下角短暂提示, 不拦截点击) ============ */",
      "body[data-dsh-air] [data-air-chrome=ready-badge]{position:fixed;right:18px;bottom:18px;z-index:2147483645;pointer-events:none;padding:10px 18px;border-radius:999px;background:linear-gradient(135deg,rgba(255,255,255,.97),rgba(224,242,253,.92));border:1px solid rgba(140,200,240,.6);box-shadow:0 0 0 4px rgba(140,200,240,.18),0 8px 24px rgba(80,150,210,.3);color:var(--air-ink);font-family:var(--air-hand-font);font-weight:700;font-size:15px;line-height:1;display:flex;align-items:center;gap:8px;animation:air-ready-pop 4.4s ease forwards}",
      "body[data-dsh-air] [data-air-chrome=ready-badge]:before{content:\"❀\";color:var(--air-sakura-deep);font-size:16px}",
      "@keyframes air-ready-pop{0%{opacity:0;transform:translateY(10px) scale(.95)}12%{opacity:1;transform:none}82%{opacity:1}100%{opacity:0;transform:translateY(-6px)}}",
      "body[data-dsh-air][data-ds-dark-theme] [data-air-chrome=ready-badge]{background:linear-gradient(135deg,rgba(34,64,96,.96),rgba(24,48,80,.94));border-color:rgba(140,200,240,.45)}"
    ].join("");

    // ---------------------------------------------------------------------
    // Drift-proof target resolution
    //
    // DSH builds its UI with CSS Modules, so every app class is emitted as
    // "<hash>_<key>" (e.g. XPOEOG_tab) and the <hash> part is derived from the
    // source path — it CHANGES whenever the kernel is rebuilt (0.1.0 shipped
    // wSkVaW_*, 0.1.2 ships XPOEOG_, ...). Hardcoding a hash silently kills
    // every rule that uses it, which is exactly how this skin's sidebar,
    // headline capsule, title tabs and composer footer lost their styling.
    //
    // Two drift-proof strategies are used instead:
    //   1. preference-free attribute anchors  [class*=<key>]  — no hash at all,
    //      used wherever the key name is unambiguous inside the rule's scope;
    //   2. runtime resolution of the real class from the module's own <style>
    //      tag, which carries a STABLE logical id in data-plugin-css
    //      ("@deepseek-ai/dsh-client-ui-conversation/HeroShell.module.css").
    //      Needed for ambiguous keys (root / label / icon / tab), where a bare
    //      [class*=root] would over-match half the application.
    // ---------------------------------------------------------------------
    var MOD_STYLE_SEL = "style[data-plugin-css]";

    /** Collect { key: "<hash>_<key>" } for one CSS module, by its stable file name. */
    function moduleClassMap(sheetFile) {
      var map = {};
      if (typeof document === "undefined") return map;
      var nodes = document.querySelectorAll(MOD_STYLE_SEL);
      for (var i = 0; i < nodes.length; i++) {
        var id = nodes[i].getAttribute("data-plugin-css") || "";
        if (id.slice(-sheetFile.length) !== sheetFile) continue;
        var text = nodes[i].textContent || "";
        var re = /\.([A-Za-z_][A-Za-z0-9]*)_([A-Za-z][A-Za-z0-9]*)/g;
        var m;
        while ((m = re.exec(text))) map[m[2]] = m[1] + "_" + m[2];
      }
      return map;
    }

    /** Resolve one key in one module to a usable class selector, else fallback. */
    function moduleSelector(sheetFile, key, fallback) {
      var cls = moduleClassMap(sheetFile)[key];
      return cls ? "." + cls : (fallback || ":not(*)");
    }

    /**
     * Run one decoration step in isolation.
     *
     * A single broken selector must never abort apply(): the global
     * MutationObserver, the placeholder/busy hooks and the teardown effect are
     * all registered near the END of apply(), so an exception thrown earlier
     * silently disables every later feature at once. (That is exactly how
     * "deepseek"/"HARNESS" disappeared: decorateBrand() threw and took the rest
     * of the skin's setup down with it.)
     */
    function safe(fn, label) {
      try {
        return fn();
      } catch (error) {
        try {
          console.warn("[dsh-air] " + label + " failed: " + (error && error.message ? error.message : error));
        } catch (ignored) { /* console is best-effort */ }
        return undefined;
      }
    }

    // The sidebar root has no stable data-* hook: the app renders it as a bare
    // <div class="<hash>_root"> whose first child is the brand row. Anchor on
    // that structure when the module class cannot be resolved.
    var SIDEBAR_STRUCTURAL = ":has(> [class*=logoRow])";
    // The desktop shell draws its own title bar and exposes it by a STABLE id
    // (sidecar/bridge.js BAR_ID / FLOAT_BAR_ID), not by a class.
    var TITLEBAR_STABLE = "#__dsh_desktop_chrome__,#__dsh_desktop_floatbar__";

    /**
     * Sidebar-root selector list. Legacy anchors stay as harmless extras, the
     * resolved module class is added when available, and the structural anchor
     * guarantees a hit on any build.
     */
    function sidebarSelectorList() {
      var parts = ["[data-pane=sidebar]", "[class*=sidebarCol]", "[class*=sidebarRoot]"];
      var resolved = moduleClassMap("SidebarRoot.module.css").root;
      if (resolved) parts.push("." + resolved);
      parts.push(SIDEBAR_STRUCTURAL);
      return parts;
    }

    /**
     * The same list wrapped in :is(), for use from JavaScript.
     *
     * querySelector/querySelectorAll/closest need a REAL selector string — the
     * __AIRSIDEBAR__ token is CSS-template sugar that only resolveCssTokens()
     * understands. Passing the raw token to querySelector throws a SyntaxError
     * and aborts the whole caller (that is exactly how the brand wordmark and
     * the status observer went missing).
     */
    function sidebarSelector() {
      return ":is(" + sidebarSelectorList().join(",") + ")";
    }

    /**
     * Expand the selector tokens used in the rule table into real selectors.
     * Tokens:
     *   __AIRSIDEBAR__                       sidebar root + its descendants
     *   __AIRTITLEBAR__                      desktop title bar / floating bar
     *   __AIRMOD(<sheet>|<key>)__            exact class, "" when unresolvable
     *   __AIRMOD(<sheet>|<key>|<fallback>)__ exact class, else <fallback>
     */
    function resolveCssTokens(text) {
      var out = text.replace(/__AIRMOD\(([^|()]+)\|([^|()]+)(?:\|([^)]*))?\)__/g,
        function (_all, sheet, key, fallback) {
          return moduleSelector(sheet, key, fallback === undefined ? "" : fallback);
        });
      out = out.split("__AIRSIDEBAR__").join(sidebarSelectorList().join(","));
      out = out.split("__AIRTITLEBAR__").join("[class*=titlebar]," + TITLEBAR_STABLE);
      return out;
    }

    // Modules whose classes the rule table targets by name. While any of them
    // is still missing from the document, the sheet is re-resolved: the client
    // plugin can apply before the app UI modules have injected their CSS, and a
    // one-shot pass would freeze those rules to their fallbacks.
    var REQUIRED_MODULES = [
      "SidebarRoot.module.css",
      "ConversationRoot.module.css",
      "HeroShell.module.css",
      "InputBar.module.css",
      "ContextMeter.module.css",
      "AgentPresetLabel.module.css"
    ];
    var RETRY_MS = 250;
    var RETRY_MAX = 120; // ~30s of slow polling as a belt & braces backstop
    var moduleWatcher = null; // set while the app's module sheets are still landing
    var resolveTries = 0;

    function modulesReady() {
      if (typeof document === "undefined") return true;
      for (var i = 0; i < REQUIRED_MODULES.length; i++) {
        if (document.querySelector('style[data-plugin-css$="/' + REQUIRED_MODULES[i] + '"]') === null) return false;
      }
      return true;
    }

    /**
     * v0.2.4: keep re-resolving the sheet until every targeted module exists.
     *
     * The old code resolved once and then retried for 40 *animation frames*
     * (≈0.7s, not the 10s the comment claimed) and gave up. That silently broke
     * the skin on a COLD start: EAC restores the previous conversation, so
     * HeroShell.module.css is not in the DOM yet, its tokens degrade to
     * ":not(*)" and the hero rules stay dead — until a hot re-apply happens to
     * run while the hero is on screen, which is exactly why reloading "fixed" it.
     *
     * Now the sheet is rewritten as soon as a new module sheet appears, plus a
     * slow poll as a backstop. Both stop permanently once everything resolved.
     */
    function watchModules() {
      if (typeof MutationObserver !== "function" || moduleWatcher !== null) return;
      if (modulesReady()) return;
      var pending = false;
      var settle = function () {
        pending = false;
        var el = document.querySelector("style[data-plugin-css=" + JSON.stringify(CSS_TAG) + "]");
        if (el !== null) el.textContent = resolveCssTokens(css);
        if (modulesReady()) stopWatching();
      };
      var kick = function () {
        if (pending) return;
        pending = true;
        if (typeof requestAnimationFrame === "function") requestAnimationFrame(settle);
        else setTimeout(settle, 60);
      };
      moduleWatcher = new MutationObserver(kick);
      // The app appends its module <style> tags into <head>.
      moduleWatcher.observe(document.head, { childList: true, subtree: true });
      (function poll() {
        if (moduleWatcher === null || modulesReady()) return;
        if (++resolveTries > RETRY_MAX) return;
        kick();
        setTimeout(poll, RETRY_MS);
      })();
    }

    function stopWatching() {
      if (moduleWatcher === null) return;
      try { moduleWatcher.disconnect(); } catch (ignored) { /* already gone */ }
      moduleWatcher = null;
    }

    function injectCss() {
      if (typeof document === "undefined") return;
      // Always (re)write the sheet: a client-plugin hot re-apply disposes and
      // re-runs apply() on the SAME document, so an existing tag holds the
      // PREVIOUS build's rules and skipping the write would freeze the page on
      // the old skin. Re-resolving is also what upgrades the fallback selectors
      // to the real module classes once the app's stylesheets have landed.
      var tag = document.querySelector("style[data-plugin-css=" + JSON.stringify(CSS_TAG) + "]");
      if (tag === null) {
        tag = document.createElement("style");
        tag.dataset.plugin = "@dsh-external/dsh-client-ui-skin-air";
        tag.dataset.pluginCss = CSS_TAG;
        document.head.appendChild(tag);
      }
      tag.textContent = resolveCssTokens(css);
      // v0.2.4: not a one-shot retry any more — resolve again the moment the
      // app's missing module sheets land (see watchModules()).
      stopWatching();
      resolveTries = 0;
      watchModules();
    }

    // ---------------------------------------------------------------------
    // Decoration builders
    // ---------------------------------------------------------------------
    var SKIN_OWNER = "dsh-air";
    var AIR_DEBUG = false; // flip to true to outline every decoration (dev only)
    function chrome(tag) {
      var el = document.createElement(tag);
      el.dataset.skinOwner = SKIN_OWNER;
      el.setAttribute("aria-hidden", "true");
      if (AIR_DEBUG) el.style.outline = "3px solid red";
      return el;
    }

    /**
     * 滚动铁律(终版): 把 composer seat 从滚动流里拿出来。
     *
     * 内核把 composer seat 渲染成 [data-conversation-scroll] 的最后一个孩子, 但
     * 滚动容器里还有别的内容排在它下面(本机实测 1961px —— 其它插件的面板/装饰
     * 溢出), 于是 position:sticky 在滚到底**之前**就"脱钩": 滚轮一滚输入框上移,
     * 到顶再弹回原位。这种结构下 sticky 无解 —— 负 margin-bottom 也无效(实测
     * scrollHeight 一点没变, 因为 trailing 内容既不是它的兄弟也不受它约束)。
     *
     * 唯一确定的办法: position:fixed + JS 同步几何(与 sidebar 装饰同一套做法),
     * 再给滚动容器补 padding-bottom, 让最后一条消息仍能滚到输入框上方。
     * fixed 元素不受任何祖先滚动影响 —— 滚轮再也带不动它。
     */
    function pinComposerSeat() {
      var sc = document.querySelector("[data-conversation-scroll]");
      var seat = document.querySelector("[data-composer-seat]");
      if (!sc || !seat) return;
      var r = sc.getBoundingClientRect();
      if (r.width < 80 || r.height < 80) return;
      var h = seat.offsetHeight || 0;
      var isHero = document.querySelector("[data-phase=hero]") !== null;
      seat.style.position = "fixed";
      seat.style.left = r.left + "px";
      seat.style.right = "auto";
      seat.style.width = r.width + "px";
      seat.style.top = "auto";
      seat.style.zIndex = "1";
      seat.style.marginBottom = "0";
      if (isHero && r.height > h + 120) {
        // hero(空会话)态: 内核原本把输入框垂直居中; 既然我们把它 fixed 了, 就得自己摆。
        // 按需求「居中偏下」—— 以「整个 seat(含上方标题行+卡片)」的垂直中线为准,
        // 落在滚动口中线下方 HERO_CENTER_SHIFT 处, 这样小鲸鱼标题行、文字横幅、
        // 预览版贴标作为一个整体跟着一起走, 三者始终同一条水平线、也始终对称居中。
        var centerY = r.top + r.height / 2 + HERO_CENTER_SHIFT;
        var bottomPx = window.innerHeight - (centerY + h / 2);
        seat.style.bottom = Math.max(0, Math.round(bottomPx)) + "px";
      } else {
        // 活跃会话态: 钉在滚动口底部。
        seat.style.bottom = Math.max(0, Math.round(window.innerHeight - r.bottom)) + "px";
      }
      // 让最后一条消息还能滚到输入框上方, 不被固定住的输入框盖住。
      // hero 态不需要 —— 那儿没有消息流, 补 padding 反而会凭空造出滚动条。
      var pad = (isHero ? 0 : (h > 0 ? h + 12 : 0)) + "px";
      if (sc.style.paddingBottom !== pad) sc.style.paddingBottom = pad;
    }

    function unpinComposerSeat() {
      var sc = document.querySelector("[data-conversation-scroll]");
      var seat = document.querySelector("[data-composer-seat]");
      if (sc) sc.style.removeProperty("padding-bottom");
      if (!seat) return;
      ["position", "left", "right", "width", "bottom", "top", "z-index", "margin-bottom"].forEach(function (p) {
        seat.style.removeProperty(p);
      });
    }

    /**
     * Random feather layer: ~11 feathers with randomized motion params.
     */
    function buildFeathers() {
      var layer = chrome("div");
      layer.dataset.airChrome = "feathers";
      var count = 11;
      for (var i = 0; i < count; i++) {
        var f = document.createElement("span");
        f.dataset.airFeather = "";
        var s = 16 + Math.random() * 16;
        f.style.left = (Math.random() * 100).toFixed(2) + "%";
        f.style.setProperty("--fx-s", s.toFixed(1) + "px");
        f.style.setProperty("--fx-d", (12 + Math.random() * 14).toFixed(1) + "s");
        f.style.setProperty("--fx-delay", (-Math.random() * 22).toFixed(1) + "s");
        f.style.setProperty("--fx-x", ((Math.random() - 0.3) * 240).toFixed(0) + "px");
        f.style.setProperty("--fx-r", (380 + Math.random() * 360).toFixed(0) + "deg");
        f.style.setProperty("--fx-o", (0.35 + Math.random() * 0.4).toFixed(2));
        layer.appendChild(f);
      }
      return layer;
    }

    /** Drifting clouds: 3 soft puffs at staggered heights/speeds. */
    function buildClouds() {
      var layer = chrome("div");
      layer.dataset.airChrome = "ambient";
      var spec = [
        { top: "8%", w: "300px", d: "110s", delay: "-30s", o: 0.55 },
        { top: "26%", w: "420px", d: "150s", delay: "-90s", o: 0.42 },
        { top: "44%", w: "260px", d: "125s", delay: "-60s", o: 0.34 }
      ];
      for (var i = 0; i < spec.length; i++) {
        var c = document.createElement("div");
        c.dataset.airCloud = "";
        c.style.top = spec[i].top;
        c.style.width = spec[i].w;
        c.style.height = (parseFloat(spec[i].w) * 0.42).toFixed(0) + "px";
        c.style.animationDuration = spec[i].d;
        c.style.animationDelay = spec[i].delay;
        c.style.opacity = String(spec[i].o);
        layer.appendChild(c);
      }
      var birds = chrome("div");
      birds.dataset.airBirds = "";
      layer.appendChild(birds);
      return layer;
    }

    /** Sparkle layer (busy/loading accent) — 6 twinkling stars. */
    function buildSparkles() {
      var layer = chrome("div");
      layer.dataset.airChrome = "sparkles";
      for (var i = 0; i < 6; i++) {
        var sp = document.createElement("span");
        sp.dataset.airSpark = "";
        sp.style.left = (8 + Math.random() * 84).toFixed(1) + "%";
        sp.style.top = (12 + Math.random() * 60).toFixed(1) + "%";
        sp.style.setProperty("--fx-d", (2.6 + Math.random() * 2.4).toFixed(1) + "s");
        sp.style.setProperty("--fx-delay", (-Math.random() * 5).toFixed(1) + "s");
        sp.style.setProperty("--fx-o", (0.5 + Math.random() * 0.5).toFixed(2));
        layer.appendChild(sp);
      }
      return layer;
    }

    /** The Q版 mascot inside the sidebar column. */
    function buildMascot() {
      var img = chrome("img");
      img.dataset.airChrome = "sidebar-mascot";
      img.src = ASSET_MASCOT;
      img.alt = "";
      img.draggable = false;
      return img;
    }

    /**
     * 红区: decorate the composer card's four borders.
     *  - gold jewel crest on the top border centre (replaces the wing)
     *  - ornate gold frame: floral corners + tiled edge strips (web-sourced)
     *  - slim gold side lines ON the border (no content overlap)
     *  - feather garlands hanging on the left / right borders
     *  - sakura petals floating along the bottom border
     */
    function buildComposerDecor(card) {
      if (!card) return;
      if (card.querySelector("[data-air-chrome=card-gem]") !== null) return; // already decorated
      var frag = document.createDocumentFragment();

      var gem = chrome("img");
      gem.dataset.airChrome = "card-gem";
      gem.src = ASSET_TOP_GEM;
      gem.alt = "";
      gem.draggable = false;
      frag.appendChild(gem);

      // gold frame: quarter-ring corners that HUG the card's 24px rounded corners
      // (inner arc = the card's own corner curve, band extends 16px outward —
      // zero intrusion into the card) + slightly thicker top/bottom edge strips.
      var gCorners = [
        { top: "-16px", left: "-16px", r: "0deg" },
        { top: "-16px", right: "-16px", r: "90deg" },
        { left: "-16px", bottom: "-16px", r: "-90deg" },
        { right: "-16px", bottom: "-16px", r: "180deg" }
      ];
      for (var i = 0; i < gCorners.length; i++) {
        var gc = chrome("img");
        gc.dataset.airChrome = "card-goldcorner";
        gc.src = ASSET_CORNER_ARC;
        gc.alt = "";
        gc.draggable = false;
        gc.style.top = gCorners[i].top || "auto";
        gc.style.left = gCorners[i].left || "auto";
        gc.style.right = gCorners[i].right || "auto";
        gc.style.bottom = gCorners[i].bottom || "auto";
        gc.style.transform = "rotate(" + gCorners[i].r + ")";
        frag.appendChild(gc);
      }
      var gt = chrome("div");
      gt.dataset.airChrome = "card-goldedge";
      gt.style.top = "-11px"; gt.style.left = "64px"; gt.style.right = "64px"; gt.style.height = "22px";
      gt.style.background = "url(" + ASSET_GOLD_EDGE + ") repeat-x top center";
      gt.style.backgroundSize = "auto 22px";
      frag.appendChild(gt);
      var gb = chrome("div");
      gb.dataset.airChrome = "card-goldedge";
      gb.style.bottom = "-11px"; gb.style.left = "64px"; gb.style.right = "64px"; gb.style.height = "22px";
      gb.style.background = "url(" + ASSET_GOLD_EDGE + ") repeat-x bottom center";
      gb.style.backgroundSize = "auto 22px";
      gb.style.transform = "scaleY(-1)";
      frag.appendChild(gb);
      // slim side lines — placed ENTIRELY OUTSIDE the border so they never cover text
      var gl = chrome("div");
      gl.dataset.airChrome = "card-goldside";
      gl.style.left = "-14px"; gl.style.top = "44px"; gl.style.bottom = "44px"; gl.style.width = "9px";
      gl.style.backgroundImage = "url(" + ASSET_GOLD_SIDE + ")";
      gl.style.backgroundSize = "9px auto";
      frag.appendChild(gl);
      var gr = chrome("div");
      gr.dataset.airChrome = "card-goldside";
      gr.style.right = "-14px"; gr.style.top = "44px"; gr.style.bottom = "44px"; gr.style.width = "9px";
      gr.style.backgroundImage = "url(" + ASSET_GOLD_SIDE + ")";
      gr.style.backgroundSize = "9px auto";
      frag.appendChild(gr);

      // feather garlands on the left / right borders (mid height)
      var sides = [
        { left: "-16px", top: "34%", flip: "scaleX(-1)" },
        { left: "-16px", top: "58%", flip: "scaleX(-1)" },
        { right: "-16px", top: "34%", flip: "" },
        { right: "-16px", top: "58%", flip: "" }
      ];
      for (var s = 0; s < sides.length; s++) {
        var f = chrome("span");
        f.dataset.airChrome = "card-feather";
        f.style.left = sides[s].left || "auto";
        f.style.right = sides[s].right || "auto";
        f.style.top = sides[s].top;
        f.style.animation = "air-sway " + (3.6 + s * 0.4) + "s ease-in-out " + (s * 0.5) + "s infinite";
        f.style.transform = sides[s].flip;
        frag.appendChild(f);
      }

      // sakura petals along the bottom border
      var petals = [
        { left: "16%", delay: "0s" },
        { left: "50%", delay: "1.2s" },
        { left: "84%", delay: "2.1s" }
      ];
      for (var p = 0; p < petals.length; p++) {
        var pet = chrome("span");
        pet.dataset.airChrome = "card-petal";
        pet.style.left = petals[p].left;
        pet.style.bottom = "-11px";
        pet.style.animationDelay = petals[p].delay;
        frag.appendChild(pet);
      }

      card.appendChild(frag);
    }

    /** 紫区: 新会话 capsule 镶边 — sky-blue art-nouveau corners (distinct material from the input box). */
    function decorateNewSession() {
      var btn = document.querySelector(sidebarSelector() + " button[class*=newSession]");
      if (!btn) return;
      if (btn.querySelector(".air-capsule-corner")) return;
      var pos = [
        { top: "-6px", left: "-6px", r: "0deg" },
        { top: "-6px", right: "-6px", r: "90deg" },
        { bottom: "-6px", left: "-6px", r: "-90deg" },
        { bottom: "-6px", right: "-6px", r: "180deg" }
      ];
      for (var i = 0; i < pos.length; i++) {
        var c = chrome("img");
        c.className = "air-capsule-corner";
        c.src = ASSET_SKY_CORNER;
        c.alt = "";
        c.draggable = false;
        c.style.top = pos[i].top || "auto";
        c.style.left = pos[i].left || "auto";
        c.style.right = pos[i].right || "auto";
        c.style.bottom = pos[i].bottom || "auto";
        c.style.transform = "rotate(" + pos[i].r + ")";
        btn.appendChild(c);
      }
    }

    /** 粉区: apply the same sky corners (as the new-session capsule) to every workspace folder row. */
    function decorateFolderCorners() {
      var rows = document.querySelectorAll(sidebarSelector() + " [class*=projectRow]");
      for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        if (row.querySelector(".air-capsule-corner")) continue;
        var pos = [
          { top: "-6px", left: "-6px", r: "0deg" },
          { top: "-6px", right: "-6px", r: "90deg" },
          { bottom: "-6px", left: "-6px", r: "-90deg" },
          { bottom: "-6px", right: "-6px", r: "180deg" }
        ];
        for (var j = 0; j < pos.length; j++) {
          var c = chrome("img");
          c.className = "air-capsule-corner";
          c.src = ASSET_SKY_CORNER;
          c.alt = "";
          c.draggable = false;
          c.style.top = pos[j].top || "auto";
          c.style.left = pos[j].left || "auto";
          c.style.right = pos[j].right || "auto";
          c.style.bottom = pos[j].bottom || "auto";
          c.style.transform = "rotate(" + pos[j].r + ")";
          row.appendChild(c);
        }
      }
    }

    /** 绿区: replace the BrandWordmark svg with the custom gold wordmark. */
    function decorateBrand() {
      var brand = document.querySelector(sidebarSelector() + " [class*=logoRow] [class*=brand]");
      if (!brand || brand.querySelector(".air-brand-custom")) return;
      var svg = brand.querySelector("svg");
      if (svg) svg.style.display = "none";
      var custom = document.createElement("span");
      custom.className = "air-brand-custom";
      custom.dataset.skinOwner = SKIN_OWNER;
      var d = document.createElement("span");
      d.className = "air-brand-deepseek";
      d.textContent = "deepseek";
      var h = document.createElement("span");
      h.className = "air-brand-harness";
      h.textContent = "HARNESS";
      custom.appendChild(d);
      custom.appendChild(h);
      brand.appendChild(custom);
    }

    /** 绿区: gold corner flourishes on the logo row. */
    function decorateLogoRow() {
      var logo = document.querySelector(sidebarSelector() + " [class*=logoRow]");
      if (!logo) return;
      if (logo.querySelector("[data-air-chrome=brand-corner]")) return;
      var c1 = chrome("span");
      c1.dataset.airChrome = "brand-corner";
      c1.style.top = "-7px"; c1.style.left = "-6px";
      var c2 = chrome("span");
      c2.dataset.airChrome = "brand-corner";
      c2.style.bottom = "-7px"; c2.style.right = "-6px";
      c2.style.transform = "rotate(180deg)";
      logo.appendChild(c1);
      logo.appendChild(c2);
    }

    /**
     * 黄区+装饰: star-trail strip + sakura branch + birds.
     * Mounted on document.body with FIXED positioning synced to the sidebar
     * rect — immune to React re-renders replacing the sidebar's children.
     */
    var sidebarDecorEls = null; // { star, branch, birds }
    function buildSidebarDecor(sidebar) {
      if (!sidebar || document.body.querySelector("[data-air-chrome=sidebar-star]")) return;
      var star = chrome("div");
      star.dataset.airChrome = "sidebar-star";
      var branch = chrome("div");
      branch.dataset.airChrome = "sidebar-branch";
      var birds = chrome("div");
      birds.dataset.airChrome = "sidebar-birds";
      document.body.appendChild(star);
      document.body.appendChild(branch);
      document.body.appendChild(birds);
      sidebarDecorEls = { star: star, branch: branch, birds: birds };
      syncSidebarDecor(sidebar);
    }

    /** Recompute fixed positions of the body-mounted sidebar decorations. */
    function syncSidebarDecor(sidebar) {
      if (!sidebar || !sidebarDecorEls) return;
      var r = sidebar.getBoundingClientRect();
      if (!r || r.width < 10 || r.height < 10) return;
      sidebarDecorEls.star.style.left = r.left + "px";
      sidebarDecorEls.star.style.width = r.width + "px";
      sidebarDecorEls.star.style.top = (r.bottom - 110) + "px";
      sidebarDecorEls.branch.style.left = (r.left - 4) + "px";
      sidebarDecorEls.branch.style.width = "120px";
      sidebarDecorEls.branch.style.top = (r.bottom - 100) + "px";
      sidebarDecorEls.birds.style.left = (r.right - 96) + "px";
      sidebarDecorEls.birds.style.width = "86px";
      sidebarDecorEls.birds.style.top = (r.top + r.height * 0.42) + "px";
    }

    /**
     * 橙区: dock the hero workspace/preset chips row INSIDE the composer
     * card's top-left corner. Keeps native behaviour (the buttons still open
     * their own menus) — only geometry is overlaid.
     */
    function dockChips(force) {
      var row = document.querySelector("[data-phase=hero] [class*=heroWorkspaceRow]");
      var card = document.querySelector("[data-phase=hero] [data-composer-card]");
      if (!row || !card) return;
      if (row.getAttribute("data-air-docked") === "1" && !force) return;
      var stack = row.parentElement;
      if (stack) stack.style.position = "relative";
      var pos = function () {
        var c = card.getBoundingClientRect();
        var s = stack.getBoundingClientRect();
        // 移到输入框卡片上边外侧的最左角: 卡片上方 42px(芯片行高≈36-40 + 底部留 2-6px 间隙)，左对齐卡片左缘
        row.style.top = (c.top - s.top - 42) + "px";
        row.style.left = (c.left - s.left + 2) + "px";
      };
      pos();
      row.setAttribute("data-air-docked", "1");
    }

    /** 红区+按钮: water-drop ripple + soft plink sound on composer clicks. */
    function setupRipple() {
      if (typeof document === "undefined") return;
      var audioCtx = null;
      var ensureAudio = function () {
        if (!audioCtx && (window.AudioContext || window.webkitAudioContext)) {
          audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx && audioCtx.state === "suspended") audioCtx.resume().catch(function () {});
      };
      var plink = function () {
        try {
          if (!audioCtx) return;
          var t = audioCtx.currentTime;
          var o = audioCtx.createOscillator();
          var g = audioCtx.createGain();
          o.type = "sine";
          o.frequency.setValueAtTime(920, t);
          o.frequency.exponentialRampToValueAtTime(460, t + 0.12);
          g.gain.setValueAtTime(0.0001, t);
          g.gain.exponentialRampToValueAtTime(0.07, t + 0.015);
          g.gain.exponentialRampToValueAtTime(0.0001, t + 0.26);
          o.connect(g);
          g.connect(audioCtx.destination);
          o.start(t);
          o.stop(t + 0.3);
        } catch (e) { /* audio is best-effort */ }
      };
      var handler = function (e) {
        var btn = e.target && e.target.closest ? e.target.closest("button") : null;
        if (!btn || btn.disabled) return;
        var inComposer = !!btn.closest("[data-composer-card]");
        var inSidebar = !!btn.closest(sidebarSelector());
        if (!inComposer && !inSidebar) return;
        ensureAudio();
        plink();
        var host = inComposer ? btn.closest("[data-composer-card]") : btn;
        var rect = btn.getBoundingClientRect();
        var x = ((e.clientX - rect.left) / Math.max(1, rect.width)) * 100;
        var y = ((e.clientY - rect.top) / Math.max(1, rect.height)) * 100;
        var r = document.createElement("span");
        r.className = "air-click-ripple";
        r.dataset.skinOwner = SKIN_OWNER;
        r.setAttribute("aria-hidden", "true");
        r.style.left = x + "%";
        r.style.top = y + "%";
        host.appendChild(r);
        setTimeout(function () { if (r.parentNode) r.parentNode.removeChild(r); }, 650);
      };
      document.addEventListener("pointerdown", handler, true);
      return function () {
        document.removeEventListener("pointerdown", handler, true);
      };
    }

    // ---------------------------------------------------------------------
    // apply: activate the skin (hot-swappable; ctx.effect tears it down)
    // ---------------------------------------------------------------------
    function apply(ctx) {
      if (typeof document === "undefined") return;
      var body = document.body;
      var originalTitle = document.title;
      var AIR_TITLE = "AIR·夏日青空 · DeepSeek Harness";
      var PLACEHOLDER = "嘻嘻，又可以偷吃用户的token了......";

      // CSS variables referencing the art data-URIs (set once on body).
      body.style.setProperty("--air-feather-art", "url(" + FEATHER_ART + ")");
      body.style.setProperty("--air-sakura-art", "url(" + SAKURA_ART + ")");
      body.style.setProperty("--air-star-art", "url(" + STAR_ART + ")");
      body.style.setProperty("--air-bird-art", "url(" + BIRD_ART + ")");
      body.style.setProperty("--air-ripple-art", "url(" + RIPPLE_ART + ")");
      body.style.setProperty("--air-book-art", "url(" + BOOK_ART + ")");
      body.style.setProperty("--air-ornament-art", "url(" + ORNAMENT_ART + ")");
      body.style.setProperty("--air-petal-art", "url(" + PETAL_ART + ")");

      // 滚动铁律: 页面本体绝不允许成为第二个滚动容器。
      // 消息区滚到底后继续滚轮时, 浏览器会把滚动链交给外层; body 里恰好有一个
      // 6px 高的按钮挂在视口下方, 让它多出 21px 可滚动高度, 于是"再多滚一格"
      // 变成滚整页 —— 输入框连同一整列一起被带走。overscroll-behavior:contain
      // (样式表里, 加在 [data-conversation-scroll] 上) 负责切断滚动链; 这里再用
      // inline !important 把 body 变成非滚动容器(overflow:clip 不是 scroll
      // container, 连程序化滚动都不存在), 双保险。样式表里的同名规则会被内核
      // 更高优先级的 body 规则压掉, 所以必须走 inline。
      safe(function () {
        body.style.setProperty("overflow", "clip", "important");
        body.style.setProperty("overscroll-behavior", "none", "important");
      }, "pinPageScroll");

      injectCss();

      // Activate the skin (all CSS is scoped under this attribute).
      body.dataset.dshAir = "";

      // --- activation self-check: badge + log (小白/无视觉 API 的 AI 均可据此确认生效) ---
      body.dataset.airReady = "1";
      try {
        console.info("[dsh-air] 主题已激活 ✓ (AIR·夏日青空 " + (typeof SKIN_VERSION !== "undefined" ? SKIN_VERSION : "0.1.0") + ") assets: /air-assets");
      } catch (e) { /* console best-effort */ }
      var readyBadge = document.createElement("div");
      readyBadge.dataset.skinOwner = SKIN_OWNER;
      readyBadge.setAttribute("data-air-chrome", "ready-badge");
      readyBadge.textContent = "AIR·夏日青空 主题已生效 ✓ v" + SKIN_VERSION;
      document.body.appendChild(readyBadge);
      setTimeout(function () {
        if (readyBadge && readyBadge.parentNode) readyBadge.parentNode.removeChild(readyBadge);
        if (body && body.dataset) delete body.dataset.airReady;
      }, 8000);

      // --- ambient chrome ---
      var clouds = buildClouds();
      var feathers = buildFeathers();
      var sparkles = buildSparkles();
      var mascot = buildMascot();
      body.prepend(clouds);
      body.append(feathers);
      body.append(sparkles);

      // --- Japanese display fonts (graceful fallback if offline) ---
      var fontLink = document.createElement("link");
      fontLink.rel = "stylesheet";
      fontLink.href = "https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@500;700&family=Zen+Maru+Gothic:wght@500;700;900&family=Zen+Kurenaido&display=swap";
      fontLink.dataset.skinOwner = SKIN_OWNER;
      document.head.appendChild(fontLink);

      // --- favicon + title ---
      var favicon = document.createElement("link");
      favicon.rel = "icon";
      favicon.type = "image/svg+xml";
      favicon.href = FAVICON;
      favicon.dataset.skinOwner = SKIN_OWNER;
      document.head.append(favicon);
      document.title = AIR_TITLE;

      // --- ripple + water sound ---
      var disposeRipple = setupRipple();

      // --- sidebar mascot mounting + width tracking ---
      var SIDEBAR_SELECTOR = ":is([data-pane='sidebar'],[class*='sidebarCol'])";
      var resizeObserver = null;
      var observedSidebar = null;
      var applySidebarWidth = function (width) {
        var mode = width < 120 ? "rail" : width < 230 ? "narrow" : "wide";
        if (body.dataset.airSidebar !== mode) body.dataset.airSidebar = mode;
      };
      var ensureSidebarObserved = function () {
        var sidebar = document.querySelector(SIDEBAR_SELECTOR);
        if (!sidebar || !resizeObserver || sidebar === observedSidebar) return;
        if (observedSidebar) resizeObserver.unobserve(observedSidebar);
        observedSidebar = sidebar;
        resizeObserver.observe(sidebar);
      };
      if (typeof ResizeObserver !== "undefined") {
        resizeObserver = new ResizeObserver(function (entries) {
          var entry = entries[entries.length - 1];
          if (entry) {
            applySidebarWidth(entry.contentRect.width);
            syncSidebarDecor(observedSidebar || document.querySelector(SIDEBAR_SELECTOR));
          }
        });
      }
      var mountSidebar = function () {
        var sidebar = document.querySelector(SIDEBAR_SELECTOR);
        if (!sidebar) return;
        if (!sidebar.querySelector("[data-air-chrome=sidebar-mascot]")) {
          sidebar.appendChild(mascot);
        }
        buildSidebarDecor(sidebar);
        ensureSidebarObserved();
        var w = sidebar.getBoundingClientRect ? sidebar.getBoundingClientRect().width : 0;
        if (resizeObserver === null) applySidebarWidth(w);
      };
      mountSidebar();

      // --- mascot layer: below content normally; on top when no records visible ---
      var syncMascotLayer = function () {
        var rows = document.querySelectorAll(SIDEBAR_SELECTOR + " [class*=sessionRow]");
        var anyVisible = false;
        for (var i = 0; i < rows.length; i++) {
          var el = rows[i];
          if (el.getClientRects && el.getClientRects().length > 0) { anyVisible = true; break; }
        }
        if (anyVisible) delete body.dataset.airMascotTop;
        else body.dataset.airMascotTop = "";
      };
      syncMascotLayer();

      // --- settings modal detection: pristine mode while open ---
      var syncSettings = function () {
        var open = document.querySelector("[data-slot=sidebar\\.settings] [role=dialog]") !== null ||
          document.querySelector("[data-slot=sidebar\\.settings] .VOzbGW_overlay") !== null;
        if (open) body.dataset.airSettingsOpen = "";
        else delete body.dataset.airSettingsOpen;
      };
      syncSettings();

      // --- composer card decoration + chips docking ---
      var cardResizeObserver = null;
      // --- hero headline text (观铃定制文案, React 重渲染会覆盖 → 每次 composer 变化时重应用) ---
      var HERO_HEADLINE = "将未完的夏天，寄往天空的尽头";
      var enforceHeadline = function () {
        var el = document.querySelector("[data-phase=hero] [class*=headlineText]");
        if (el && el.textContent !== HERO_HEADLINE) {
          el.textContent = HERO_HEADLINE;
        }
      };
      safe(enforceHeadline, "enforceHeadline");

      var applyComposer = function () {
        var card = document.querySelector("[data-composer-card]");
        if (card) {
          buildComposerDecor(card);
          if (cardResizeObserver === null && typeof ResizeObserver !== "undefined") {
            cardResizeObserver = new ResizeObserver(function () { dockChips(true); });
            cardResizeObserver.observe(card);
          }
        } else if (cardResizeObserver !== null) {
          cardResizeObserver.disconnect();
          cardResizeObserver = null;
        }
        dockChips();
        enforceHeadline();
        pinComposerSeat();
      };
      safe(applyComposer, "applyComposer");

      // The composer is pinned by geometry, so it must be re-synced on viewport
      // resize (and whenever the column width changes).
      ctx.effect(function () {
        var onResize = function () { safe(pinComposerSeat, "pinComposerSeat"); };
        window.addEventListener("resize", onResize);
        return function () { window.removeEventListener("resize", onResize); };
      }, "ui-skin-air: keep the composer pinned on viewport resize");

      // --- brand + new-session capsule decoration ---
      // Each step is isolated: a broken selector degrades one ornament instead
      // of aborting the rest of apply() (observer / placeholder / teardown).
      safe(decorateBrand, "decorateBrand");
      safe(decorateLogoRow, "decorateLogoRow");
      safe(decorateNewSession, "decorateNewSession");
      safe(decorateFolderCorners, "decorateFolderCorners");

      // --- placeholder enforcement (React re-renders the editor) ---
      var enforcePlaceholder = function () {
        // Legacy textarea (kept for older kernels).
        var ta = document.querySelector("[data-composer-card] textarea");
        if (ta && ta.getAttribute("placeholder") !== PLACEHOLDER) {
          ta.setAttribute("placeholder", PLACEHOLDER);
        }
        // Current kernels use a Lexical contenteditable: the placeholder is a
        // real element carrying data-composer-placeholder, plus a
        // data-placeholder attribute on the editor itself. Without these two
        // the custom copy never appears.
        var ph = document.querySelector("[data-composer-card] [data-composer-placeholder]");
        if (ph && ph.textContent !== PLACEHOLDER) ph.textContent = PLACEHOLDER;
        var ed = document.querySelector("[data-composer-card] [data-placeholder]");
        if (ed && ed.getAttribute("data-placeholder") !== PLACEHOLDER) {
          ed.setAttribute("data-placeholder", PLACEHOLDER);
        }
      };
      safe(enforcePlaceholder, "enforcePlaceholder");

      // --- busy (loading) state: any sidebar ongoing dot or streaming text ---
      var syncBusy = function () {
        var busy = document.querySelector("svg[data-state=ongoing]") !== null ||
          document.querySelector("[data-streaming]") !== null;
        body.classList.toggle("air-busy", busy);
        sparkles.style.display = busy ? "" : "none";
      };
      safe(syncBusy, "syncBusy");

      // --- composer phase motion (hero <-> active transitions) ---
      var composerPhase = void 0;
      var syncComposerMotion = function () {
        var el = document.querySelector("[data-phase=hero], [data-phase=active]");
        var next = el ? el.dataset.phase : void 0;
        if (next !== "hero" && next !== "active") return;
        if (composerPhase !== void 0 && composerPhase !== next) {
          body.dataset.airComposerMotion = next === "active" ? "dock" : "rise";
          setTimeout(function () { delete body.dataset.airComposerMotion; }, 560);
        }
        composerPhase = next;
      };
      safe(syncComposerMotion, "syncComposerMotion");

      // --- global observer: structure + attribute state hooks ---
      var observer = new MutationObserver(function (records) {
        var sidebarChanged = false;
        var placeholderMaybe = false;
        var busyMaybe = false;
        var composerChanged = false;
        var brandMaybe = false;
        var settingsMaybe = false;
        var mascotMaybe = false;
        var sweptSkin = false; // React removed one of our decorations -> re-apply
        for (var i = 0; i < records.length; i++) {
          var record = records[i];
          if (record.type === "attributes") {
            var name = record.attributeName;
            if (name === "data-ds-dark-theme") busyMaybe = true;
            else if (name === "data-phase") composerChanged = true;
            else if (name === "data-state" || name === "data-streaming") busyMaybe = true;
            continue;
          }
          if (record.removedNodes) {
            for (var k = 0; k < record.removedNodes.length; k++) {
              var rn = record.removedNodes[k];
              if (rn instanceof Element && rn.getAttribute && rn.getAttribute("data-skin-owner") === SKIN_OWNER) {
                sweptSkin = true;
              }
            }
          }
          var nodes = [];
          if (record.addedNodes) for (var j = 0; j < record.addedNodes.length; j++) nodes.push(record.addedNodes[j]);
          if (record.removedNodes) for (var l = 0; l < record.removedNodes.length; l++) nodes.push(record.removedNodes[l]);
          for (var m = 0; m < nodes.length; m++) {
            var node = nodes[m];
            if (!(node instanceof Element)) continue;
            if (node.getAttribute && node.getAttribute("data-skin-owner") === SKIN_OWNER) continue;
            sidebarChanged = true;
            placeholderMaybe = true;
            busyMaybe = true;
            composerChanged = true;
            brandMaybe = true;
            settingsMaybe = true;
            mascotMaybe = true;
          }
        }
        if (sweptSkin) {
          sidebarChanged = true;
          placeholderMaybe = true;
          busyMaybe = true;
          composerChanged = true;
          brandMaybe = true;
          settingsMaybe = true;
          mascotMaybe = true;
        }
        if (sidebarChanged) mountSidebar();
        if (settingsMaybe) syncSettings();
        if (mascotMaybe || sidebarChanged) syncMascotLayer();
        if (placeholderMaybe) enforcePlaceholder();
        if (busyMaybe) syncBusy();
        if (composerChanged) applyComposer();
        if (brandMaybe) { decorateBrand(); decorateLogoRow(); decorateNewSession(); decorateFolderCorners(); }
      });
      observer.observe(body, {
        attributes: true,
        attributeFilter: ["data-ds-dark-theme", "data-phase", "data-state", "data-streaming", "aria-expanded", "aria-selected"],
        childList: true,
        subtree: true
      });




















      // --- teardown ---
      ctx.effect(function () {
        return function () {
          delete body.dataset.dshAir;
          delete body.dataset.airSidebar;
          delete body.dataset.airComposerMotion;
          delete body.dataset.airSettingsOpen;
          delete body.dataset.airMascotTop;
          if (composerPhase !== void 0) composerPhase = void 0;
          if (observer) observer.disconnect();
          if (resizeObserver) resizeObserver.disconnect();
          if (cardResizeObserver) cardResizeObserver.disconnect();
          stopWatching();
          if (disposeRipple) disposeRipple();
          body.classList.remove("air-busy");
          safe(unpinComposerSeat, "unpinComposerSeat");
          body.style.removeProperty("overflow");
          body.style.removeProperty("overscroll-behavior");
          ["--air-feather-art", "--air-sakura-art", "--air-star-art", "--air-bird-art", "--air-ripple-art", "--air-book-art", "--air-ornament-art", "--air-petal-art"].forEach(function (p) {
            body.style.removeProperty(p);
          });
          document.querySelectorAll("[data-skin-owner='" + SKIN_OWNER + "']").forEach(function (el) { el.remove(); });
          // The stylesheet carries no data-skin-owner marker: remove it by its
          // own tag id, otherwise the skin's rules survive teardown (a hot
          // re-apply would then run on top of the previous build's CSS).
          var sheet = document.querySelector("style[data-plugin-css=" + JSON.stringify(CSS_TAG) + "]");
          if (sheet !== null && sheet.dataset.plugin === "@dsh-external/dsh-client-ui-skin-air") sheet.remove();
          if (document.title === AIR_TITLE) document.title = originalTitle;
        };
      }, "ui-skin-air: AIR summer-sky overlay and ornament");
    }

    exports.apply = apply;
    return module.exports;
  }
});
