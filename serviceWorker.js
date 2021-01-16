window.addServiceWorker = function(handler) {
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').then(handler);
}
