/* Mably Web Push — project chat notifications */

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data?.text?.() ?? "" };
  }

  const title = typeof data.title === "string" ? data.title : "Mably";
  const options = {
    body: typeof data.body === "string" ? data.body : "New message",
    icon: typeof data.icon === "string" ? data.icon : "/images/Logo-SVG.svg",
    badge: "/images/Logo-SVG.svg",
    tag: typeof data.tag === "string" ? data.tag : "mably-chat",
    renotify: true,
    data: {
      url: typeof data.url === "string" ? data.url : "/",
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification?.data?.url;
  if (!url || typeof url !== "string") return;

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      const path = url.replace(/^https?:\/\/[^/]+/i, "");
      for (const client of windowClients) {
        if (client.url.includes(path.split("?")[0]) && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
