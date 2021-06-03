addServiceWorker("sw.js");
window.addEventListener("load", function(){
  $("#init").css("font-family", "SBGlyphs");
  let it = setInterval(function () {
    if (document.fonts.check("12px 'SBGlyphs'")) {
      var ecp_data, query_index, osize, current_id = 0, resolution, size, title = " - Starblast ECP Icon Viewer", name_regex = /^name\=/i, names = {
        ecp: "Elite Commander Pass (ECP)",
        sucp: "shared Unique Commander Pass (sUCP)",
        ucp: "Unique Commander Pass (UCP)"
      }, fetch = function(init) {
        $.getJSON("ecp.json").then(function(data) {
          refresh(data, init)
        }).catch(function(e) {
          let fail = false, offline_data;
          try {offline_data = JSON.parse(localStorage.getItem("ecp-data"))}
          catch (e) {fail = true};
          (fail || !init) && alert("Fetch failed!");
          if (!fail) refresh(offline_data, init);
        })
      }, refresh = function (data, init) {
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
        // display the ecp info
        apply(search(), init)
      }, apply = function (index, init) {
        query_index = index;
        let query_info = ecp_data[index];
        // load the ecp info to the screen
        $("#index").html((query_index+1) + "/" + ecp_data.length);
        $("#name").html(query_info.name);
        $("#date").html("");
        $("#badge-showcase")[0].src = "";
        $("link[rel='icon']").attr("href","icon.png");
        $("title")[0].innerHTML = query_info.name + title;
        window.history.pushState({path: 'url'}, '', window.location.protocol + "//" + window.location.host + window.location.pathname + "?name=" + query_info.name.toLowerCase().replace(/\s/g, "_"));
        let ecp_type = names[query_info.type];
        $("#type").html("<a href='"+(ecp_type?("https://starblastio.fandom.com/wiki/"+ecp_type+"' target='_blank'>"):"javascript:void(0);'")+">"+(ecp_type || "Unknown")+"</a>");
        // load the ecp image
        applySize(init);
      }, search = function(name) {
        if (!name) {
          let queries = window.location.search.replace(/_/g, " ").replace(/^\?/,"").split("&");
          name = (queries.find(function (query) {return name_regex.test(query)}) || "").replace(name_regex, "").toLowerCase()
        }
        let i = ecp_data.findIndex(function(ecp) {return ecp.name.toLowerCase() === name});
        return i==-1?0:i;
      }, applySize = function(init) {
        let request_id = current_id++;
        $("#download").attr("disabled", true);
        let t = (init?localStorage.getItem("ecp-res-option"):$("#res-selection>option:selected").val()) || "default", query_info = ecp_data[query_index];
        if (t == "original") size = osize;
        else if (t == "default") size = 200;
        else {
          t = "custom";
          size = Math.max($("#custom-res").val()||localStorage.getItem("ecp-resolution"), 0) || 200;
        }
        $("#custom-res").attr("disabled", t != "custom");
        $("#apply-res").attr("disabled", t != "custom");
        $("#res-selection").val(t);
        localStorage.setItem("ecp-res-option", t);
        localStorage.setItem("ecp-res",size);
        $("#custom-res").val(size);
        let ecp_canvas = document.createElement("canvas");
        let c2d = ecp_canvas.getContext("2d");
        if (query_info.url) {
          let img = new Image();
          img.crossOrigin = "Anonymous";
          img.src = query_info.url;
          img.onload = function() {
            if (request_id == current_id - 1) {
              osize = img.width;
              if (t == "original") size = osize;
              ecp_canvas.width = size;
              ecp_canvas.height = size;
              c2d.drawImage(img, 0, 0, ecp_canvas.width, ecp_canvas.height);
              loadImage(ecp_canvas, query_info);
              var xhr = $.ajax({
                type: 'HEAD',
                url: img.src,
                success: function(msg) {
                  if (request_id == current_id - 1) {
                    var filetime = xhr.getResponseHeader('Last-Modified');
                    $("#date").html("Last updated: " + new Date(filetime).toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'}));
                  }
                }
              })
            }
          }
        }
        else {
          $("#date").html("Built-in");
          osize = 200;
          if (t == "original") size = osize;
          ecp_canvas.width = size;
          ecp_canvas.height = size;
          let c2d = ecp_canvas.getContext('2d');
          let deco = query_info.decoration;
          if (deco) {
            c2d.fillStyle = deco.fill;
            c2d.fillRect(0,0, ecp_canvas.width, ecp_canvas.height);
            c2d.textAlign = "center";
            c2d.textBaseline = "middle";
            c2d.fillStyle = deco.stroke;
            if (deco.custom) {
              for (u = deco.custom, l = .7 * ecp_canvas.height / 11, a = r = 0; r <= 10; a = r += 1)
              for (o = h = 0; h <= 7; o = h += 1) c = ecp_canvas.width / 2 + l * (a - 5), p = ecp_canvas.height / 2 + l * (o - 4), 1 === u[o][a] && c2d.fillRect(c - .4 * l, p - .4 * l, .8 * l, .8 * l);
            }
            else {
              c2d.font = (ecp_canvas.width/2) + "px 'SBGlyphs'";
              c2d.fillText(eval('"\\u{'+deco.unicode.toString(16)+'}"'), ecp_canvas.height/2, ecp_canvas.width/2);
            }
            c2d.stroke();
          }
          loadImage(ecp_canvas, query_info);
        }
      }, loadImage = function (canvas, info) {
        let link = canvas.toDataURL();
        $("link[rel='icon']").attr("href", link);
        $("#download-template").attr({
          href: link,
          download: info.id + (size!=osize?("_"+size+"px"):"")
        });
        $("#badge-showcase")[0].src = link
        $("#download").attr("disabled", false);
        localStorage.setItem("ecp-resolution", size);
        $("#custom-res").val(size);
      }
      $("#res-selection").on("change", function() {
        applySize()
      });
      $("#apply-res").on("click", function() {
        applySize()
      });
      var nav_key_actions = {
        prev: {
          handler: function() {
            apply((query_index>0?query_index:ecp_data.length)-1)
          },
          keyCode: 37
        },
        next: {
          handler: function() {
            apply(++query_index<ecp_data.length?query_index:0)
          },
          keyCode: 39
        },
        hideinfo: {
          handler: function() {
            $("#infobox").css("display", "none");
            $("#showinfo").css("display", "");
          },
          keyCode: 38
        },
        showinfo: {
          handler: function() {
            $("#infobox").css("display", "");
            $("#showinfo").css("display", "none");
          },
          keyCode: 40
        }
      }
      for (let i in nav_key_actions) {
        $("#" + i).on("click", nav_key_actions[i].handler);
      }
      $("#download").on("click", function() {
        $("#download-template")[0].click()
      });
      document.onkeydown = function (event) {
        if ($("input").is(":focus")) switch (event.keyCode) {
          case 13: /* Enter */
            if ($("#custom-res").is(":focus")) applySize();
            $("input").blur();
            break;
        }
        else switch (event.keyCode) {
          default:
            let handler = (Object.values(nav_key_actions).find(action => action.keyCode == event.keyCode)||{}).handler;
            if (typeof handler == "function") handler();
        }
      }
      fetch(true);
      $("#init").css("display", "none");
      clearInterval(it);
    }
  }, 500);
});
