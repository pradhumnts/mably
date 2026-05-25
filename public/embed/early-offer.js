/*!
 * Mably — Early Offer popup loader
 *
 * Drop-in loader for the founding-pricing popup. Designed for the public
 * Framer landing at mably.io (or any third-party host) — loads the same
 * popup UI shipped inside the Mably app as an iframe with overlay, plus
 * the same bottom-right sticky CTA used in-app.
 *
 * Behaviour:
 *   - Popup auto-opens on every page load (unless "Don't show again" set).
 *   - Closing the popup reveals the sticky CTA bottom-right.
 *   - Clicking the sticky CTA re-opens the popup.
 *   - "Don't show again" suppresses future auto-opens; the sticky remains.
 *
 * Install (default — popup + sticky, opens immediately):
 *
 *   <script src="https://app.mably.io/embed/early-offer.js" async></script>
 *
 * Install (open after the visitor scrolls 40% of the page):
 *
 *   <script src="https://app.mably.io/embed/early-offer.js" data-mably-early-offer-on-scroll="40" async></script>
 *
 *   The value is the scroll-depth percentage (0-100, default 40). Sticky
 *   CTA still shows immediately so users can open the popup early.
 *
 * Install (sticky-only, no auto-open at all):
 *
 *   <script src="https://app.mably.io/embed/early-offer.js" data-mably-early-offer="manual" async></script>
 *
 * Public API (window.MablyEarlyOffer):
 *   - open()                          → show the popup
 *   - close()                         → hide it (reveals the sticky)
 *   - reset()                         → clear "don't show again" preference
 *   - isSuppressed()                  → boolean
 *   - showSticky()                    → force-show the sticky CTA
 *   - hideSticky()                    → hide the sticky CTA
 *   - armScrollTrigger(percent)       → open the popup once when scrolled N%
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
      // Overlay: 70% black + blur backdrop. Iframe wrap is sized so the
      // iframe's inner viewport hits Tailwind's `lg` breakpoint (>=1024px),
      // which is what makes the popup render in its landscape two-column
      // layout. Mobile viewports stay below the breakpoint and naturally
      // fall back to the portrait single-column layout.
      //
      // pointer-events is OFF by default — only enabled while data-state is
      // "open" so the host page stays fully clickable when the popup is
      // closing or closed.
      ".mably-early-offer-overlay{position:fixed;inset:0;z-index:2147483600;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.70);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);opacity:0;transition:opacity 220ms ease;padding:16px;box-sizing:border-box;pointer-events:none}" +
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

  function lockScroll(lock) {
    var html = document.documentElement;
    var body = document.body;
    if (!body) return;
    if (lock) {
      html.classList.add("mably-early-offer-no-scroll");
      body.classList.add("mably-early-offer-no-scroll");
    } else {
      html.classList.remove("mably-early-offer-no-scroll");
      body.classList.remove("mably-early-offer-no-scroll");
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
    // Reveal the sticky CTA so the visitor can re-open the popup later.
    showSticky();
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

  function currentScrollPercent() {
    var docEl = document.documentElement;
    var body = document.body || {};
    var scrollTop =
      window.pageYOffset ||
      window.scrollY ||
      docEl.scrollTop ||
      body.scrollTop ||
      0;
    var viewport = window.innerHeight || docEl.clientHeight || 0;
    var fullHeight = Math.max(
      docEl.scrollHeight || 0,
      body.scrollHeight || 0,
      docEl.offsetHeight || 0,
      body.offsetHeight || 0
    );
    var scrollable = fullHeight - viewport;
    // Page isn't scrollable (yet, or at all) → report 0% so the trigger stays
    // armed and waits for an actual scroll event, instead of mistakenly
    // assuming the user is already past the threshold.
    if (scrollable <= 0) return 0;
    return (scrollTop / scrollable) * 100;
  }

  function armScrollTrigger(percent) {
    disarmScrollTrigger();
    var threshold = Math.max(0, Math.min(100, Number(percent) || 40));
    scrollTriggerArmed = true;

    var ticking = false;
    function check() {
      if (!scrollTriggerArmed) return;
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        ticking = false;
        if (!scrollTriggerArmed) return;
        // Only fire after the user has actually moved past the threshold
        // (scrollTop must be > 0). Prevents the popup from opening on first
        // paint when the document has been rendered but not yet scrolled.
        var docEl = document.documentElement;
        var body = document.body || {};
        var scrollTop =
          window.pageYOffset ||
          window.scrollY ||
          docEl.scrollTop ||
          body.scrollTop ||
          0;
        if (scrollTop <= 0) return;
        if (currentScrollPercent() >= threshold) {
          disarmScrollTrigger();
          if (!isOpen) open();
        }
      });
    }

    scrollTriggerHandler = check;
    window.addEventListener("scroll", scrollTriggerHandler, { passive: true });
    window.addEventListener("resize", scrollTriggerHandler, { passive: true });
    // Some Framer / scroll-container setups dispatch scroll on document
    // instead of window — listen on both, capture phase catches both.
    document.addEventListener("scroll", scrollTriggerHandler, {
      passive: true,
      capture: true,
    });
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
  }

  // --- Public API -------------------------------------------------------

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
    var mode = readBootMode();
    // Always mount the sticky (kept hidden until popup is closed).
    ensureStickyMounted();
    if (mode === "manual") {
      // Reveal sticky after a beat so its entrance animation reads cleanly.
      window.setTimeout(showSticky, 250);
      return;
    }
    if (isSuppressed()) {
      // Don't auto-open, but keep the sticky so users can re-engage.
      window.setTimeout(showSticky, 250);
      return;
    }
    var scrollPercent = readScrollTriggerPercent();
    if (scrollPercent != null) {
      // Show the sticky right away so visitors have an entry point before
      // they hit the scroll threshold; arm the trigger for auto-open.
      window.setTimeout(showSticky, 250);
      armScrollTrigger(scrollPercent);
      return;
    }
    // Auto-open the popup immediately; sticky appears when user closes it.
    window.setTimeout(open, 600);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
