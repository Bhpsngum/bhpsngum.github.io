window.addServiceWorker = function(url, handler) {
  try{navigator.serviceWorker.register(url).then(function(v){v.update().then(function(t){typeof handler == "function" && handler(t)})})}
  catch(e){}
}
