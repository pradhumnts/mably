/*!
 * Mably — Early Offer popup loader
 *
 * Drop-in loader for the founding-pricing popup. Designed for the public
 * Framer landing at mably.io (or any third-party host) — loads the same
 * popup UI shipped inside the Mably app as an iframe with overlay.
 *
 * Install (auto-open once per visitor):
 *
 *   <script src="https://app.mably.io/embed/early-offer.js" async></script>
 *
 * Install (manual trigger):
 *
 *   <script src="https://app.mably.io/embed/early-offer.js" data-mably-early-offer="manual" async></script>
 *   <button onclick="MablyEarlyOffer.open()">Claim 75% off</button>
 *
 * Public API (window.MablyEarlyOffer):
 *   - open()                 → show the popup
 *   - close()                → hide it
 *   - reset()                → clear "don't show again" preference
 *   - isSuppressed()         → boolean
 *
 * Storage:
 *   localStorage["mably:early-offer:never"] = "1"  (set by "Don't show this again")
 */
(function () {
  if (typeof window === "undefined") return;
  if (window.__mablyEarlyOfferLoaded) return;
  window.__mablyEarlyOfferLoaded = true;

  var STORAGE_KEY = "mably:early-offer:never";
  var SESSION_DISMISSED_KEY = "mably:early-offer:dismissed";
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
    safeStorage("remove", SESSION_DISMISSED_KEY);
  }

  function wasDismissedThisSession() {
    try {
      return window.sessionStorage.getItem(SESSION_DISMISSED_KEY) === "1";
    } catch (e) {
      return false;
    }
  }

  function markDismissedThisSession() {
    try {
      window.sessionStorage.setItem(SESSION_DISMISSED_KEY, "1");
    } catch (e) {
      /* ignore */
    }
  }

  // --- DOM ---------------------------------------------------------------

  var overlayEl = null;
  var iframeEl = null;
  var closeBtnEl = null;
  var isOpen = false;
  var keydownHandler = null;

  function injectStyles() {
    if (document.getElementById("mably-early-offer-styles")) return;
    var style = document.createElement("style");
    style.id = "mably-early-offer-styles";
    style.textContent =
      ".mably-early-offer-overlay{position:fixed;inset:0;z-index:2147483600;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.85);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);opacity:0;transition:opacity 220ms ease;padding:16px;box-sizing:border-box}" +
      ".mably-early-offer-overlay[data-state=open]{opacity:1}" +
      ".mably-early-offer-frame-wrap{position:relative;width:100%;max-width:min(64rem,calc(100vw - 1rem));height:min(96vh,920px);display:flex;align-items:center;justify-content:center;transform:scale(0.96);transition:transform 220ms cubic-bezier(0.22,1,0.36,1)}" +
      ".mably-early-offer-overlay[data-state=open] .mably-early-offer-frame-wrap{transform:scale(1)}" +
      ".mably-early-offer-frame{width:100%;height:100%;border:0;background:transparent;border-radius:1.75rem;display:block;color-scheme:dark}" +
      ".mably-early-offer-fallback-close{position:absolute;top:-44px;right:-4px;padding:6px 12px;border-radius:9999px;background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.6);border:1px solid rgba(255,255,255,0.12);cursor:pointer;font:500 12px/1 system-ui,-apple-system,sans-serif;opacity:0;pointer-events:none;transition:opacity 200ms ease}" +
      ".mably-early-offer-frame-wrap[data-iframe-loaded=false] .mably-early-offer-fallback-close{opacity:1;pointer-events:auto}" +
      "html.mably-early-offer-no-scroll,body.mably-early-offer-no-scroll{overflow:hidden}";
    (document.head || document.documentElement).appendChild(style);
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
    if (isOpen) return;
    isOpen = true;
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
    markDismissedThisSession();
    if (keydownHandler) {
      window.removeEventListener("keydown", keydownHandler, true);
      keydownHandler = null;
    }
    var hideTimer = window.setTimeout(function () {
      if (overlayEl) overlayEl.style.display = "none";
    }, 240);
    // Store to allow reset of timer if rapidly toggled
    overlayEl.__mablyHideTimer = hideTimer;
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

  // --- Public API -------------------------------------------------------

  var api = {
    open: open,
    close: close,
    reset: reset,
    isSuppressed: isSuppressed,
  };
  window.MablyEarlyOffer = api;

  // --- Auto-open behaviour ----------------------------------------------

  function readBootMode() {
    try {
      var script = document.currentScript;
      if (script && script.dataset && script.dataset.mablyEarlyOffer) {
        return script.dataset.mablyEarlyOffer;
      }
    } catch (e) {
      /* ignore */
    }
    var nodes = document.querySelectorAll("script[data-mably-early-offer]");
    for (var i = 0; i < nodes.length; i++) {
      var v = nodes[i].getAttribute("data-mably-early-offer");
      if (v) return v;
    }
    return "auto";
  }

  function tryAutoOpen() {
    if (readBootMode() === "manual") return;
    if (isSuppressed()) return;
    if (wasDismissedThisSession()) return;
    // Short delay so the iframe has a chance to start loading before paint.
    window.setTimeout(open, 600);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", tryAutoOpen, { once: true });
  } else {
    tryAutoOpen();
  }
})();
