(function(){
  var ecp_data, query_index, resolution, title = "ECP Icon Viewer - ", name_regex = /^name\=/i, names = {
    ecp: "Elite Commander Pass (ECP)",
    sucp: "shared Unique Commander Pass (sUCP)",
    ucp: "Unique Commander Pass (UCP)"
  }, fetch = function(init) {
    $.getJSON("ecp.json").then(refresh).catch(function(e) {
      let fail = false, offline_data;
      try {offline_data = JSON.parse(localStorage.getItem("ecp-data"))}
      catch (e) {fail = true};
      (fail || !init) && alert("Fetch failed!");
      if (!fail) refresh(offline_data);
    })
  }, refresh = function (data) {
    // store for offline use
    localStorage.setItem("ecp-data", JSON.stringify(data));
    // parse to a data array with attribute 'type'
    ecp_data = [];
    for (let i in data) [].push.apply(ecp_data, data[i].map(function(e) {
      e.type = i;
      if (e.url) e.url = "https://starblast.io/ecp/"+e.url;
      return e
    }));
    // find the ecp info of the searching name
    query_index = search();
    let query_info = ecp_data[query_index];
    console.log(query_info);
    // load the ecp info to the screen
    $("#index").html((query_index+1) + "/" + ecp_data.length);
    $("#name").html(query_info.name);
    $("title")[0].innerHTML = title + query_info.name;
    $("#type").html(names[query_info.type] || "Unknown");
    // load the ecp image
    resolution = Number($("#custom-res").val() || localStorage.getItem("ecp-resolution")) || 200;
    localStorage.setItem("ecp-resolution", resolution);
    $("#custom-res").val(resolution);
    let ecp_canvas = document.createElement("canvas");
    ecp_canvas.width = resolution;
    ecp_canvas.height = resolution;
    let c2d = ecp_canvas.getContext("2d");
    if (query_info.url) {
      let img = new Image();
      img.crossOrigin = "Anonymous";
      img.src = query_info.url;
      img.onload = function() {
        c2d.drawImage(img, 0, 0, ecp_canvas.width, ecp_canvas.height);
        $("#badge-showcase")[0].src = ecp_canvas.toDataURL();
        var xhr = $.ajax({
          type: 'HEAD',
          url: img.src,
          success: function(msg) {
            var filetime = xhr.getResponseHeader('Last-Modified');
            $("#date").html("Last updated: " + new Date(filetime).toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'}));
          }
        });
      }
    }
    else {
      $("#date").html("Built-in");
      if (query_info.decoration) {
        let deco = query_info.decoration;
      }
    }
  }, search = function(name) {
    if (!name) {
      let queries = window.location.search.replace(/^\?/,"").split("&");
      name = (queries.find(function (query) {return name_regex.test(query)}) || "").replace(name_regex, "")
    }
    return ecp_data.findIndex(function(ecp) {return ecp.name.toLowerCase() === name.toLowerCase()}) || 0;
  }
  window.addEventListener("load", fetch);
})();
