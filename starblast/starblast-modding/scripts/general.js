(function(){
  let queue = [], domain = `${window.location.protocol}//${window.location.host}`, data = [], vSelect = $("#versions"), loadPage = function () {
    let hash = window.location.hash.replace(/^#\/*/, "").replace(/#/, ".html#").replace(/^latest\//, data[0] + "/"), iframe = document.querySelector("#docpage"), matches = (hash.match(/[^\/]+/) || [])[0] || "";
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
    })
  }, parseEvent = function (event) {
    let version = vSelect.val(), vData = data;
    if (event.origin != domain) return;
    try {
      let evt = JSON.parse(event.data), data = evt.data;
      switch (evt.name) {
        case "info":
          let newHash = `#/${data.path.replace(new RegExp("(^\/*)" + vData[0].replace(/\./g, "\\.") + "\/"), "$1latest/")}${data.hash ? ("#" + data.hash) : ""}`;
          let url = `${domain}${window.location.pathname}${newHash}`;
          if (newHash != window.location.hash) window.history.pushState({path: url}, '', url);
          let component = data.hash.match(/^([^:]+:)*([^]*)$/), namespace = component[1] || "", method = component[2];
          if (!namespace && data.title != "Home") {
            if (method) namespace = "method:";
            else namespace = "class:"
          }
          $("head > title").html(`${namespace.charAt(0).toUpperCase()}${namespace.slice(1)} ${data.title}${method ? ("#" + method) : ""} - starblast-modding Documentation (${version})`);
          break;
        case "error":
          $("head > title").html(`Page not found - starblast-modding Documentation (${version}})`);
          break;
        case "backtohome":
          window.location.hash = "";
          window.location.reload();
      }
    }
    catch (e) {}
  }
  $.getJSON("./versions.json").then(function (versionData) {
    data = versionData;
    vSelect.append(data.map((i, j) => `<option value="${i}">${i + (j == 0 ? " (latest)" : "")}</option>`).join(""));
    vSelect.on("change", function () {
      let selectedVal = vSelect.val();
      if (data.includes(selectedVal)) iframe.src = "./" + selectedVal
    });
    while (queue.length > 0) parseEvent(queue.shift());
    loadPage();
    window.addEventListener("popstate", loadPage);
  }).catch(e => window.location.reload());
  window.addEventListener("message", function (event) {
    if (!data) queue.push(event);
    else parseEvent(event)
  });
})()
