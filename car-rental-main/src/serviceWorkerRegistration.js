// This optional code is used to register a service worker.
// register() is called in index.js to enable Progressive Web App capabilities.

export function register(config) {
  if ("serviceWorker" in navigator) {
    const swUrl = `${process.env.PUBLIC_URL}/service-worker.js`;

    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register(swUrl)
        .then((registration) => {
          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (installingWorker == null) {
              return;
            }
            installingWorker.onstatechange = () => {
              if (installingWorker.state === "installed") {
                if (navigator.serviceWorker.controller) {
                  console.log(
                    "New content is available and will be used when all tabs for this page are closed."
                  );
                  if (config && config.onUpdate) {
                    config.onUpdate(registration);
                  }
                } else {
                  console.log("Content is cached for offline use.");
                  if (config && config.onSuccess) {
                    config.onSuccess(registration);
                  }
                }
              }
            };
          };
        })
        .catch((error) => {
          console.error("Error during service worker registration:", error);
        });
    });
  }
}

export function unregister() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error(error.message);
      });
  }
}
