import { urlBase64ToUint8Array } from "@/lib/client/web-push";

/**
 * @param {ServiceWorkerRegistration} registration
 */
async function waitUntilServiceWorkerActivated(registration) {
  if (registration.active) return registration;

  const worker = registration.installing || registration.waiting;
  if (worker) {
    await new Promise((resolve, reject) => {
      const onState = () => {
        if (worker.state === "activated") {
          worker.removeEventListener("statechange", onState);
          resolve();
        } else if (worker.state === "redundant") {
          worker.removeEventListener("statechange", onState);
          reject(new Error("Service worker failed to activate"));
        }
      };
      worker.addEventListener("statechange", onState);
      onState();
    });
    return registration;
  }

  await navigator.serviceWorker.ready;
  return registration;
}

/**
 * @param {PushSubscription} subscription
 * @param {string} vapidPublicKey
 */
function subscriptionMatchesVapidKey(subscription, vapidPublicKey) {
  const existing = subscription.options?.applicationServerKey;
  if (!existing) return true;

  const expected = urlBase64ToUint8Array(vapidPublicKey);
  const a = new Uint8Array(existing);
  if (a.length !== expected.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== expected[i]) return false;
  }
  return true;
}

/**
 * @param {unknown} err
 */
export function formatPushSubscribeError(err) {
  const msg = err instanceof Error ? err.message : String(err ?? "Unknown error");
  if (/push service error/i.test(msg) || /registration failed/i.test(msg)) {
    return "Could not connect to your browser’s push service. Reload the page, turn off ad blockers for this site, then try Enable again.";
  }
  if (/not allowed|denied|permission/i.test(msg)) {
    return "Notifications are blocked. Allow them in your browser’s site settings, then reload.";
  }
  return msg;
}

/**
 * @param {string} vapidPublicKey
 * @returns {Promise<PushSubscription>}
 */
export async function ensurePushSubscription(vapidPublicKey) {
  const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
  if (applicationServerKey.length !== 65) {
    throw new Error("Invalid VAPID public key. Regenerate keys and restart the server.");
  }

  const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  await waitUntilServiceWorkerActivated(reg);

  let sub = await reg.pushManager.getSubscription();

  if (sub && !subscriptionMatchesVapidKey(sub, vapidPublicKey)) {
    try {
      await sub.unsubscribe();
    } catch {
      /* ignore */
    }
    sub = null;
  }

  const trySubscribe = () =>
    reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey,
    });

  if (!sub) {
    try {
      sub = await trySubscribe();
    } catch (firstErr) {
      const stale = await reg.pushManager.getSubscription();
      if (stale) {
        try {
          await stale.unsubscribe();
        } catch {
          /* ignore */
        }
      }
      try {
        sub = await trySubscribe();
      } catch (secondErr) {
        throw new Error(formatPushSubscribeError(secondErr));
      }
      if (!sub) {
        throw new Error(formatPushSubscribeError(firstErr));
      }
    }
  }

  return sub;
}
