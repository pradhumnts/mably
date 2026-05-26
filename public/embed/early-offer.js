/*!
 * Mably — Early Offer popup loader
 *
 * Drop-in loader for the founding-pricing popup. Designed for the public
 * Framer landing (or any third-party host) — loads the same popup UI
 * shipped inside the Mably app as an iframe with overlay.
 *
 * Behaviour:
 *   - Popup auto-opens once on every page load.
 *   - Closing the popup is a one-way action: no sticky CTA, no re-open
 *     trigger. Use the inline embed (`/embed/early-offer?mode=inline`)
 *     for persistent on-page visibility after dismissal.
 *   - "Don't show again" sets localStorage and suppresses future auto-opens.
 *
 * Install (default — opens on page load, no sticky, no scroll trigger):
 *
 *   <script src="https://app.mably.io/embed/early-offer.js" async></script>
 *
 * Install (manual — never auto-open; you wire a button to MablyEarlyOffer.open()):
 *
 *   <script src="https://app.mably.io/embed/early-offer.js" data-mably-early-offer="manual" async></script>
 *
 * Install (drop a host element's z-index to 0 when the popup closes — useful
 * for Framer pages where the inline embed sits inside a positioned wrapper):
 *
 *   <script src="https://app.mably.io/embed/early-offer.js"
 *           data-mably-early-offer-zero-on-close=".framer-7mg9ub-container"
 *           async></script>
 *
 * Public API (window.MablyEarlyOffer):
 *   - open()                          → show the popup
 *   - close()                         → hide it
 *   - reset()                         → clear "don't show again" preference
 *   - isSuppressed()                  → boolean
 *   - showSticky() / hideSticky()     → opt-in sticky CTA (no longer mounted by default)
 *   - armScrollTrigger(percent)       → opt-in scroll-based open
 *   - diagnose()                      → log + return current state (debugging)
 *
 * Debug helpers:
 *   - Visit `?mably-eo-reset=1` on any embedding page to clear the
 *     "Don't show again" preference before boot runs.
 *   - Call `MablyEarlyOffer.diagnose()` in the browser console to see
 *     which boot path ran.
 *
 * Storage:
 *   localStorage["mably:early-offer:never"] = "1"  (set by "Don't show this again")
 */
(function () {
  if (typeof window === "undefined") return;
  if (window.__mablyEarlyOfferLoaded) return;
  window.__mablyEarlyOfferLoaded = true;

  var STORAGE_KEY = "mably:early-offer:never";
  var MESSAGE_SOURCE = "mably-early-offer";

  // Resolve the origin of this script so the iframe + redirects use the
  // exact same host this loader came from (works across sandbox/prod).
  function getScriptOrigin() {
    try {
      var current = document.currentScript;
      if (current && current.src) {
        return new URL(current.src).origin;
      }
    } catch (e) {
      /* fallthrough */
    }
    var scripts = document.getElementsByTagName("script");
    for (var i = scripts.length - 1; i >= 0; i--) {
      var src = scripts[i].src || "";
      if (src.indexOf("/embed/early-offer.js") !== -1) {
        try {
          return new URL(src).origin;
        } catch (e) {
          /* ignore */
        }
      }
    }
    return "";
  }

  var APP_ORIGIN = getScriptOrigin();
  var IFRAME_URL = APP_ORIGIN + "/embed/early-offer?mode=popup";

  function safeStorage(method, key, value) {
    try {
      if (method === "get") return window.localStorage.getItem(key);
      if (method === "set") return window.localStorage.setItem(key, value);
      if (method === "remove") return window.localStorage.removeItem(key);
    } catch (e) {
      return null;
    }
  }

  function isSuppressed() {
    return safeStorage("get", STORAGE_KEY) === "1";
  }

  function suppress() {
    safeStorage("set", STORAGE_KEY, "1");
  }

  function reset() {
    safeStorage("remove", STORAGE_KEY);
  }

  // --- DOM ---------------------------------------------------------------

  var overlayEl = null;
  var iframeEl = null;
  var closeBtnEl = null;
  var stickyEl = null;
  var isOpen = false;
  var stickyForceHidden = false;
  var keydownHandler = null;

  function injectStyles() {
    if (document.getElementById("mably-early-offer-styles")) return;
    var style = document.createElement("style");
    style.id = "mably-early-offer-styles";
    style.textContent =
      // Overlay: full-viewport modal frame at 70% black + blur backdrop.
      // Fixed position, top:0 left:0 width:100vw height:100vh — when the
      // popup is open this layer fully covers and inerts the host page.
      // Iframe wrap is sized so its inner viewport hits Tailwind's `md`
      // breakpoint (>=768px), which is what makes the popup render in its
      // landscape two-column layout. Mobile viewports stay below and fall
      // back to portrait single-column.
      //
      // pointer-events is OFF by default — only enabled while data-state is
      // "open" so the host page stays fully clickable when the popup is
      // closing or closed.
      ".mably-early-offer-overlay{position:fixed;top:0;left:0;width:100vw;height:100vh;inset:0;z-index:2147483600;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.70);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);opacity:0;transition:opacity 220ms ease;padding:16px;box-sizing:border-box;pointer-events:none;overscroll-behavior:contain;touch-action:none}" +
      ".mably-early-offer-overlay[data-state=open]{opacity:1;pointer-events:auto}" +
      ".mably-early-offer-frame-wrap{position:relative;width:100%;max-width:min(64rem,calc(100vw - 1rem));height:min(96vh,520px);display:flex;align-items:center;justify-content:center;transform:scale(0.96);transition:transform 220ms cubic-bezier(0.22,1,0.36,1);pointer-events:none}" +
      "@media (max-width: 767px){.mably-early-offer-frame-wrap{height:min(96vh,720px)}}" +
      ".mably-early-offer-overlay[data-state=open] .mably-early-offer-frame-wrap{transform:scale(1);pointer-events:auto}" +
      ".mably-early-offer-frame{width:100%;height:100%;border:0;background:transparent;border-radius:1.75rem;display:block;color-scheme:dark}" +
      "html.mably-early-offer-no-scroll,body.mably-early-offer-no-scroll{overflow:hidden}" +
      ".mably-early-offer-fallback-close{position:absolute;top:-44px;right:-4px;padding:6px 12px;border-radius:9999px;background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.6);border:1px solid rgba(255,255,255,0.12);cursor:pointer;font:500 12px/1 system-ui,-apple-system,sans-serif;opacity:0;pointer-events:none;transition:opacity 200ms ease}" +
      ".mably-early-offer-frame-wrap[data-iframe-loaded=false] .mably-early-offer-fallback-close{opacity:1;pointer-events:auto}" +
      // Sticky CTA (mirrors components/billing/early-pricing-offer-sticky-cta.jsx)
      ".mably-eo-sticky{position:fixed;bottom:1.5rem;right:1.5rem;z-index:2147483590;max-width:min(calc(100vw - 3rem),17rem);cursor:pointer;border-radius:9999px;padding:1px;border:0;text-align:left;font-family:ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background-image:linear-gradient(100deg,#e8c9a0 0%,#fde8d4 22%,#b8d4f5 50%,#f5e6d3 78%,#e8c9a0 100%);background-size:220% 100%;box-shadow:0 0 16px rgba(251,191,36,0.12),0 8px 24px rgba(0,0,0,0.3);transition:transform 300ms cubic-bezier(0.22,1,0.36,1),box-shadow 300ms ease,opacity 240ms ease;opacity:0;transform:translateY(12px) scale(0.96);pointer-events:none}" +
      ".mably-eo-sticky[data-state=visible]{opacity:1;transform:translateY(0) scale(1);pointer-events:auto;animation:mably-eo-border-flow 5s ease-in-out infinite,mably-eo-glow-pulse 3.5s ease-in-out infinite}" +
      ".mably-eo-sticky[data-state=visible]:hover{transform:translateY(0) scale(1.02);box-shadow:0 0 20px rgba(251,191,36,0.16),0 10px 28px rgba(0,0,0,0.36)}" +
      ".mably-eo-sticky[data-state=visible]:active{transform:translateY(0) scale(0.98)}" +
      ".mably-eo-sticky:focus-visible{outline:2px solid rgba(255,255,255,0.4);outline-offset:2px}" +
      ".mably-eo-sticky-inner{display:flex;align-items:center;gap:0.75rem;border-radius:9999px;padding:0.625rem 1rem 0.625rem 0.75rem;background:#0a0a0f;color:#fff;line-height:1.2}" +
      ".mably-eo-sticky-badge{flex-shrink:0;width:2.25rem;height:2.25rem;border-radius:9999px;background:linear-gradient(to right,#f5d9b8,#fde8d4,#b8d4f5);display:flex;align-items:center;justify-content:center;color:rgba(0,0,0,0.8);animation:mably-eo-sparkle-pulse 2.2s ease-in-out infinite}" +
      ".mably-eo-sticky-badge svg{width:1rem;height:1rem;display:block}" +
      ".mably-eo-sticky-text{min-width:0;flex:1 1 auto}" +
      ".mably-eo-sticky-label{display:block;font-size:0.875rem;font-weight:700;letter-spacing:-0.005em}" +
      ".mably-eo-sticky-sub{display:block;font-size:10px;font-weight:600;letter-spacing:0.15em;margin-top:2px;color:rgba(255,255,255,0.55);text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}" +
      "@keyframes mably-eo-border-flow{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}" +
      "@keyframes mably-eo-glow-pulse{0%,100%{filter:brightness(1)}50%{filter:brightness(1.06)}}" +
      "@keyframes mably-eo-sparkle-pulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.08);opacity:0.92}}" +
      "@media (prefers-reduced-motion: reduce){.mably-eo-sticky,.mably-eo-sticky-badge{animation:none !important}.mably-eo-sticky{transition:opacity 240ms ease}}";
    (document.head || document.documentElement).appendChild(style);
  }

  // Lucide "Sparkles" icon — keep identical to the in-app StickyCta.
  var SPARKLES_SVG =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>' +
    '<path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/>' +
    "</svg>";

  function ensureStickyMounted() {
    if (stickyEl) return;
    injectStyles();
    stickyEl = document.createElement("button");
    stickyEl.type = "button";
    stickyEl.className = "mably-eo-sticky";
    stickyEl.setAttribute(
      "aria-label",
      "Claim 75% off — Early Pricing · Only 50 Spots"
    );
    stickyEl.setAttribute("data-state", "hidden");
    stickyEl.innerHTML =
      '<span class="mably-eo-sticky-inner">' +
      '<span class="mably-eo-sticky-badge">' +
      SPARKLES_SVG +
      "</span>" +
      '<span class="mably-eo-sticky-text">' +
      '<span class="mably-eo-sticky-label">Claim 75% off</span>' +
      '<span class="mably-eo-sticky-sub">Early Pricing · Only 50 Spots</span>' +
      "</span>" +
      "</span>";
    stickyEl.addEventListener("click", function () {
      open();
    });
    document.body.appendChild(stickyEl);
  }

  function showSticky() {
    ensureStickyMounted();
    if (stickyForceHidden) return;
    if (isOpen) return;
    stickyEl.setAttribute("data-state", "visible");
  }

  function hideSticky() {
    if (!stickyEl) return;
    stickyEl.setAttribute("data-state", "hidden");
  }

  // Tracks elements we paused for the scroll lock so we can restore their
  // original `overflow` when the popup closes. Framer Sites in particular
  // scroll a direct child of <body>, so just locking <html>/<body> isn't
  // enough — we also freeze any directly-scrollable child.
  var scrollLockState = null;

  function isScrollable(el) {
    if (!el || el.nodeType !== 1) return false;
    if (el.scrollHeight - el.clientHeight <= 0) return false;
    var style = window.getComputedStyle ? window.getComputedStyle(el) : null;
    if (!style) return el.scrollHeight > el.clientHeight;
    var overflowY = style.overflowY;
    return overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay";
  }

  function lockScroll(lock) {
    var html = document.documentElement;
    var body = document.body;
    if (!body) return;
    if (lock) {
      if (scrollLockState) return;
      var entries = [];
      function freeze(el) {
        if (!el) return;
        entries.push({
          el: el,
          overflow: el.style.overflow,
        });
        el.style.overflow = "hidden";
      }
      freeze(html);
      freeze(body);
      // Walk direct children of body — Framer's #main and similar wrappers
      // live here. We only freeze ones that are actually scrollable.
      if (body.children) {
        for (var i = 0; i < body.children.length; i++) {
          var child = body.children[i];
          if (isScrollable(child)) freeze(child);
        }
      }
      html.classList.add("mably-early-offer-no-scroll");
      body.classList.add("mably-early-offer-no-scroll");
      scrollLockState = entries;
    } else {
      html.classList.remove("mably-early-offer-no-scroll");
      body.classList.remove("mably-early-offer-no-scroll");
      if (scrollLockState) {
        for (var j = 0; j < scrollLockState.length; j++) {
          var entry = scrollLockState[j];
          entry.el.style.overflow = entry.overflow;
        }
        scrollLockState = null;
      }
    }
  }

  function ensureMounted() {
    if (overlayEl) return;

    injectStyles();

    overlayEl = document.createElement("div");
    overlayEl.className = "mably-early-offer-overlay";
    overlayEl.setAttribute("role", "dialog");
    overlayEl.setAttribute("aria-modal", "true");
    overlayEl.setAttribute("aria-label", "Mably founding pricing");
    overlayEl.setAttribute("data-state", "closed");

    var wrap = document.createElement("div");
    wrap.className = "mably-early-offer-frame-wrap";
    wrap.setAttribute("data-iframe-loaded", "false");

    iframeEl = document.createElement("iframe");
    iframeEl.className = "mably-early-offer-frame";
    iframeEl.src = IFRAME_URL;
    iframeEl.setAttribute("title", "Mably early pricing offer");
    iframeEl.setAttribute("loading", "eager");
    iframeEl.setAttribute(
      "allow",
      "clipboard-write; payment; top-navigation; top-navigation-by-user-activation"
    );
    iframeEl.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
    iframeEl.setAttribute("scrolling", "auto");
    iframeEl.style.colorScheme = "dark";
    iframeEl.addEventListener("load", function () {
      wrap.setAttribute("data-iframe-loaded", "true");
    });

    // Fallback close shown only if the iframe never loads (network/CSP issues).
    // The card has its own X inside; this is just so the visitor never gets stuck.
    closeBtnEl = document.createElement("button");
    closeBtnEl.type = "button";
    closeBtnEl.className = "mably-early-offer-fallback-close";
    closeBtnEl.setAttribute("aria-label", "Close founding pricing offer");
    closeBtnEl.textContent = "Close";
    closeBtnEl.addEventListener("click", function () {
      close();
    });

    wrap.appendChild(iframeEl);
    wrap.appendChild(closeBtnEl);
    overlayEl.appendChild(wrap);

    overlayEl.addEventListener("click", function (e) {
      if (e.target === overlayEl) close();
    });

    document.body.appendChild(overlayEl);
  }

  function open() {
    ensureMounted();
    hideSticky();
    disarmScrollTrigger();
    if (isOpen) return;
    isOpen = true;
    // Cancel any in-flight hide timer from a previous close — otherwise it
    // can fire `display:none` on a freshly-opened popup.
    if (overlayEl.__mablyHideTimer) {
      window.clearTimeout(overlayEl.__mablyHideTimer);
      overlayEl.__mablyHideTimer = null;
    }
    overlayEl.style.display = "flex";
    // Force reflow before flipping the state to ensure transition fires.
    void overlayEl.offsetWidth;
    overlayEl.setAttribute("data-state", "open");
    lockScroll(true);

    keydownHandler = function (e) {
      if (e.key === "Escape") {
        e.stopPropagation();
        close();
      }
    };
    window.addEventListener("keydown", keydownHandler, true);
  }

  function applyZeroZIndexOnClose() {
    var selector = readDataAttr("mablyEarlyOfferZeroOnClose");
    if (!selector) return;
    try {
      var nodes = document.querySelectorAll(selector);
      for (var i = 0; i < nodes.length; i++) {
        // setProperty with !important makes this stick even when the host's
        // own stylesheet has !important rules of its own.
        nodes[i].style.setProperty("z-index", "0", "important");
      }
    } catch (e) {
      /* ignore — selector might be invalid */
    }
  }

  function close() {
    if (!overlayEl || !isOpen) return;
    isOpen = false;
    overlayEl.setAttribute("data-state", "closed");
    lockScroll(false);
    if (keydownHandler) {
      window.removeEventListener("keydown", keydownHandler, true);
      keydownHandler = null;
    }
    // The overlay is already non-interactive via CSS as soon as data-state
    // is not "open" — the timer just removes the element from the layout
    // after the fade-out finishes so it can't leak any focus.
    if (overlayEl.__mablyHideTimer) {
      window.clearTimeout(overlayEl.__mablyHideTimer);
    }
    overlayEl.__mablyHideTimer = window.setTimeout(function () {
      if (overlayEl && !isOpen) overlayEl.style.display = "none";
      if (overlayEl) overlayEl.__mablyHideTimer = null;
    }, 240);
    // Optional: drop the z-index of a configured host element so it sits in
    // normal flow once the popup is dismissed (e.g. for stacking the inline
    // embed beneath other Framer elements after the popup is gone).
    applyZeroZIndexOnClose();
  }

  // --- Cross-frame messaging --------------------------------------------

  window.addEventListener("message", function (event) {
    var data = event && event.data;
    if (!data || typeof data !== "object") return;
    if (data.source !== MESSAGE_SOURCE) return;

    if (data.kind === "close") {
      close();
    } else if (data.kind === "never-show") {
      suppress();
      close();
    } else if (data.kind === "navigate" && typeof data.href === "string") {
      // Iframe already tried window.top.location for top-level redirect, but
      // sandbox policies sometimes block it — do it from here as a fallback.
      try {
        window.top.location.href = data.href;
      } catch (e) {
        window.location.href = data.href;
      }
    }
  });

  // --- Scroll trigger ---------------------------------------------------

  var scrollTriggerArmed = false;
  var scrollTriggerHandler = null;

  var scrollPollTimer = null;

  /**
   * Largest "scroll percentage" observed across window scroll, the document
   * scrolling element, and any in-page scroll container we can find. Framer
   * sites in particular often scroll a div inside <body> (not the window), so
   * we have to look at multiple sources to get a meaningful reading.
   */
  function maxScrollPercent() {
    var docEl = document.documentElement;
    var body = document.body || {};

    var best = 0;

    function consider(scrollTop, scrollHeight, clientHeight) {
      if (!scrollTop) return; // not scrolled (or 0)
      var scrollable = scrollHeight - clientHeight;
      if (scrollable <= 0) return;
      var pct = (scrollTop / scrollable) * 100;
      if (pct > best) best = pct;
    }

    // Window / documentElement scroll
    var winScroll = window.pageYOffset || window.scrollY || 0;
    var viewport = window.innerHeight || docEl.clientHeight || 0;
    consider(
      winScroll,
      Math.max(docEl.scrollHeight || 0, body.scrollHeight || 0),
      viewport
    );

    // documentElement / body scroll properties (some browsers report here)
    consider(docEl.scrollTop || 0, docEl.scrollHeight || 0, docEl.clientHeight || 0);
    consider(body.scrollTop || 0, body.scrollHeight || 0, body.clientHeight || 0);

    // In-page scroll containers (Framer #main and friends). Walk the body's
    // direct descendants — that's enough to catch the common single-wrapper
    // pattern without scanning the whole tree on every tick.
    if (body && body.children) {
      for (var i = 0; i < body.children.length; i++) {
        var el = body.children[i];
        if (!el) continue;
        consider(el.scrollTop || 0, el.scrollHeight || 0, el.clientHeight || 0);
      }
    }

    return best;
  }

  var scrollSentinels = [];
  var scrollObserver = null;
  var scrollResizeHandler = null;
  var scrollThreshold = 40;

  function pickScrollContainers() {
    // Body is always a candidate (for window-scrolled pages). On top of that,
    // any scrollable direct child (Framer #main, etc.) gets its own sentinel.
    var containers = [];
    var body = document.body;
    if (!body) return containers;
    containers.push(body);
    var seen = {};
    for (var i = 0; i < body.children.length; i++) {
      var el = body.children[i];
      if (!el || el.tagName === "SCRIPT" || el.tagName === "STYLE") continue;
      if (el.scrollHeight - el.clientHeight <= 0) continue;
      var style = window.getComputedStyle
        ? window.getComputedStyle(el)
        : null;
      if (
        style &&
        (style.overflowY === "auto" ||
          style.overflowY === "scroll" ||
          style.overflowY === "overlay")
      ) {
        var k = el.tagName + ":" + i;
        if (!seen[k]) {
          containers.push(el);
          seen[k] = true;
        }
      }
    }
    return containers;
  }

  function makeSentinel(container) {
    var sentinel = document.createElement("div");
    sentinel.setAttribute("aria-hidden", "true");
    sentinel.className = "mably-eo-scroll-sentinel";
    sentinel.style.cssText =
      "position:absolute;left:0;width:1px;height:1px;pointer-events:none;opacity:0;z-index:-1;top:0";
    // Containing block for absolute children needs to be the container itself.
    // Ensure it has a positioning context — if not, give it one (relative is
    // visually a no-op).
    var cs = window.getComputedStyle
      ? window.getComputedStyle(container)
      : null;
    if (cs && cs.position === "static") {
      sentinel.dataset.mablyAddedPos = "1";
      container.style.position = "relative";
    }
    container.appendChild(sentinel);
    return sentinel;
  }

  function positionSentinel(sentinel, container) {
    var scrollable = container.scrollHeight - container.clientHeight;
    if (scrollable <= 0) {
      sentinel.style.top = "999999px"; // effectively never intersect
      return;
    }
    var pos = (scrollThreshold / 100) * scrollable;
    sentinel.style.top = Math.max(0, pos) + "px";
  }

  function setupScrollSentinels() {
    if (typeof IntersectionObserver === "undefined") return false;
    var containers = pickScrollContainers();
    if (containers.length === 0) return false;

    scrollObserver = new IntersectionObserver(
      function (entries) {
        for (var i = 0; i < entries.length; i++) {
          if (entries[i].isIntersecting) {
            disarmScrollTrigger();
            if (!isOpen) open();
            return;
          }
        }
      },
      // Shrink the root to a sliver at the very top of the viewport so the
      // sentinel "intersects" only when it crosses the top edge — i.e. the
      // user has scrolled at least past the sentinel's position.
      { rootMargin: "0px 0px -100% 0px" }
    );

    for (var i = 0; i < containers.length; i++) {
      var c = containers[i];
      var s = makeSentinel(c);
      positionSentinel(s, c);
      scrollSentinels.push({ container: c, sentinel: s });
      scrollObserver.observe(s);
    }

    scrollResizeHandler = function () {
      for (var j = 0; j < scrollSentinels.length; j++) {
        positionSentinel(scrollSentinels[j].sentinel, scrollSentinels[j].container);
      }
    };
    window.addEventListener("resize", scrollResizeHandler, { passive: true });

    return true;
  }

  function teardownScrollSentinels() {
    if (scrollObserver) {
      scrollObserver.disconnect();
      scrollObserver = null;
    }
    for (var i = 0; i < scrollSentinels.length; i++) {
      var entry = scrollSentinels[i];
      if (entry.sentinel && entry.sentinel.parentNode) {
        entry.sentinel.parentNode.removeChild(entry.sentinel);
      }
      if (entry.sentinel && entry.sentinel.dataset.mablyAddedPos === "1") {
        try {
          entry.container.style.position = "";
        } catch (e) {
          /* ignore */
        }
      }
    }
    scrollSentinels = [];
    if (scrollResizeHandler) {
      window.removeEventListener("resize", scrollResizeHandler);
      scrollResizeHandler = null;
    }
  }

  function armScrollTrigger(percent) {
    disarmScrollTrigger();
    scrollThreshold = Math.max(0, Math.min(100, Number(percent) || 40));
    scrollTriggerArmed = true;

    var ticking = false;
    function check() {
      if (!scrollTriggerArmed) return;
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        ticking = false;
        if (!scrollTriggerArmed) return;
        if (maxScrollPercent() >= scrollThreshold) {
          disarmScrollTrigger();
          if (!isOpen) open();
        }
      });
    }

    scrollTriggerHandler = check;

    // Listen broadly. Scroll events don't bubble, but capture-phase on
    // document still receives them from any descendant element.
    window.addEventListener("scroll", scrollTriggerHandler, { passive: true });
    window.addEventListener("resize", scrollTriggerHandler, { passive: true });
    document.addEventListener("scroll", scrollTriggerHandler, {
      passive: true,
      capture: true,
    });

    // Belt-and-braces polling fallback (every 400ms). Some custom scroll
    // containers don't dispatch a `scroll` event we can see (touch-driven,
    // transform-based, intersection-observer-driven sites), so we also
    // periodically read the scroll position directly, reposition sentinels,
    // and pick up any scroll containers that didn't exist at boot.
    scrollPollTimer = window.setInterval(function () {
      if (scrollSentinels.length === 0) {
        setupScrollSentinels();
      } else if (scrollResizeHandler) {
        scrollResizeHandler();
      }
      check();
    }, 400);

    // IntersectionObserver fallback — works for transform-based / virtual
    // scroll containers where neither scroll events nor scrollTop properties
    // reflect the user's actual scroll position.
    setupScrollSentinels();
  }

  function disarmScrollTrigger() {
    if (!scrollTriggerArmed) return;
    scrollTriggerArmed = false;
    if (scrollTriggerHandler) {
      window.removeEventListener("scroll", scrollTriggerHandler);
      window.removeEventListener("resize", scrollTriggerHandler);
      document.removeEventListener("scroll", scrollTriggerHandler, true);
      scrollTriggerHandler = null;
    }
    if (scrollPollTimer) {
      window.clearInterval(scrollPollTimer);
      scrollPollTimer = null;
    }
    teardownScrollSentinels();
  }

  // --- Public API -------------------------------------------------------

  var bootStateForDiagnose = null;

  function diagnose() {
    var info = {
      version: "1.0",
      bootState: bootStateForDiagnose,
      suppressed: isSuppressed(),
      isOpen: isOpen,
      scrollTriggerArmed: scrollTriggerArmed,
      scrollThreshold: scrollThreshold,
      scrollPercent: maxScrollPercent ? maxScrollPercent() : null,
      scrollSentinels: scrollSentinels.length,
      stickyVisible: stickyEl ? stickyEl.getAttribute("data-state") : null,
      origin: APP_ORIGIN,
      iframeUrl: IFRAME_URL,
    };
    try {
      // eslint-disable-next-line no-console
      console.info("[MablyEarlyOffer] diagnose:", info);
    } catch (e) {
      /* ignore */
    }
    return info;
  }

  var api = {
    open: open,
    close: close,
    reset: reset,
    isSuppressed: isSuppressed,
    showSticky: function () {
      stickyForceHidden = false;
      showSticky();
    },
    hideSticky: function () {
      stickyForceHidden = true;
      hideSticky();
    },
    armScrollTrigger: armScrollTrigger,
    diagnose: diagnose,
  };
  window.MablyEarlyOffer = api;

  // --- Boot mode + auto-open ---------------------------------------------

  function readDataAttr(name) {
    try {
      var script = document.currentScript;
      if (script && script.dataset && script.dataset[name] != null) {
        return script.dataset[name];
      }
    } catch (e) {
      /* ignore */
    }
    var attr = "data-" + name.replace(/[A-Z]/g, function (m) {
      return "-" + m.toLowerCase();
    });
    var nodes = document.querySelectorAll("script[" + attr + "]");
    for (var i = 0; i < nodes.length; i++) {
      var v = nodes[i].getAttribute(attr);
      if (v != null) return v;
    }
    return null;
  }

  function readBootMode() {
    return readDataAttr("mablyEarlyOffer") || "auto";
  }

  function readScrollTriggerPercent() {
    var raw = readDataAttr("mablyEarlyOfferOnScroll");
    if (raw == null) return null;
    var n = Number(raw);
    if (!isFinite(n) || n < 0) return 40;
    return Math.min(100, n);
  }

  function boot() {
    // URL escape hatch for testing: visit any page with `?mably-eo-reset=1`
    // to clear the "Don't show again" preference before boot runs.
    try {
      if (/[?&]mably-eo-reset=1\b/.test(window.location.search || "")) {
        safeStorage("remove", STORAGE_KEY);
      }
    } catch (e) {
      /* ignore */
    }

    var mode = readBootMode();
    bootStateForDiagnose = {
      mode: mode,
      readyState: document.readyState,
      currentScriptSeen: !!document.currentScript,
    };

    if (mode === "manual") {
      bootStateForDiagnose.path = "manual";
      // No auto-open. Host page wires a button to MablyEarlyOffer.open().
      return;
    }
    if (isSuppressed()) {
      bootStateForDiagnose.path = "suppressed";
      // User opted out via "Don't show again" on a previous visit.
      return;
    }
    bootStateForDiagnose.path = "auto-open";
    // Open the popup once on page load. After close there's no sticky and
    // no re-open trigger — embedders use the inline widget for persistent
    // visibility.
    window.setTimeout(open, 600);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
