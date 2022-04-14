(function(){
  let vSelect = $("#versions");
  $.getJSON("./versions.json").then(function (data) {
    vSelect.append(data.map((i, j) => `<option value="${i}">${i + (j == 0 ? " (latest)" : "")}</option>`).join(""));
    vSelect.on("change", function () {
      let selectedVal = vSelect.val();
      if (data.includes(selectedVal)) iframe.src = "./" + selectedVal
    });

    let hash = window.location.hash.replace(/^#\/*/, "").replace("#", ".html#"), iframe = document.querySelector("#docpage"), matches = (hash.match(/[^\/]+/) || [])[0] || "";;
    $.get("./" + hash).then(function(d, status, xhr) {
      if (xhr.getResponseHeader("Content-Type").includes("text/html")) {
        if (hash == "") {
          iframe.src = "./" + data[0];
          vSelect.val(data[0])
        }
        else {
          iframe.src = "./" + hash;
          vSelect.val(matches)
        }
      }
      else {
        iframe.src = "./404.html";
        vSelect.val(data.includes(matches) ? matches : data[0])
      }
    })
    .catch(function(e){
      iframe.src = "./404.html";
      vSelect.val(data.includes(matches) ? matches : data[0])
    });
  }).catch(e => window.location.reload());
  window.addEventListener("message", function (event) {
    if (event.origin != "https://bhpsngum.github.io") return;
    try {
      let evt = JSON.parse(event.data), data = evt.data;
      switch (evt.name) {
        case "info":
          let url = `${window.location.protocol}//${window.location.host}${window.location.pathname}#/${data.path}${data.hash ? ("#" + data.hash) : ""}`;
          window.history.pushState({path:url},'', url);
          $("head > title").html(data.title + ` - starblast-modding Documentation (${vSelect.val()})`);
          break;
        case "error":
          $("head > title").html(`Page not found - starblast-modding Documentation (${vSelect.val()})`);
          break;
        case "backtohome":
          window.location.hash = "";
          window.location.reload();
      }
    }
    catch (e) {}
  });
})()
