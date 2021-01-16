window.addServiceWorker = function(handler) {
  try{navigator.serviceWorker.register('/sw.js').then(function(v){v.update().then(function(t){typeof handler == "function" && handler(t)})})}
  catch(e){}
}
