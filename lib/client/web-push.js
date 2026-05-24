/**
 * @param {ArrayBuffer | null} buffer
 */
export function arrayBufferToBase64Url(buffer) {
  if (!buffer) return "";
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * @param {string} base64Url
 */
export function urlBase64ToUint8Array(base64Url) {
  const padding = "=".repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) {
    output[i] = raw.charCodeAt(i);
  }
  return output;
}

/**
 * @param {PushSubscription} subscription
 */
export function serializePushSubscription(subscription) {
  const json = subscription.toJSON();
  const keys = json.keys ?? {};
  return {
    endpoint: json.endpoint ?? subscription.endpoint,
    keys: {
      p256dh: keys.p256dh ?? "",
      auth: keys.auth ?? "",
    },
  };
}
