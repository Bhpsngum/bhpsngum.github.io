window.addServiceWorker = function(handler) {
  try{navigator.serviceWorker.register('/sw.js').then(handler)}
  catch(e){}
}
