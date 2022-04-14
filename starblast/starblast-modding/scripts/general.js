(function(){
  let hash = window.location.hash.replace(/^#\/*/, "").replace("#", ".html#"), iframe = document.querySelector("#docpage");
  $.get("./" + hash).then(function(data, status, xhr) {
    console.log(xhr)
  })
  .catch(function(e){ iframe.src = "./404.html" });
  window.addEventListener("message", function (event) {
    if (false) return;
    try {
      let data = JSON.parse(event.data);
      window.location.hash = "#/" + data.path + (data.hash ? ("#" + data.hash) : "")
    }
    catch (e) {}
  });
})()
