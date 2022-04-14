(function(){
  let sendMessage = function(name) {
    window.parent.postMessage(JSON.stringify({
      name: name
    }), "*");
  }
  sendMessage("error");
  document.querySelector("#backtohome").addEventListener("click", function () {
    sendMessage("backtohome")
  })
})()
