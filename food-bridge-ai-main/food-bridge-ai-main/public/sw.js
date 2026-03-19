self.addEventListener("push", (event) => {
  let data = {
    title: "Food Bridge Notification",
    body: "You have a new update.",
    url: "/ngo-dashboard",
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch {
      // ignore parse errors and use defaults
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/logo.png",
      badge: "/logo.png",
      data: { url: data.url },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification?.data?.url || "/ngo-dashboard";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      const existing = windowClients.find((client) => client.url.includes(targetUrl));
      if (existing) return existing.focus();
      return clients.openWindow(targetUrl);
    }),
  );
});
