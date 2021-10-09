addServiceWorker("sw.js");
window.addEventListener("load", function(){
  $("#init").css("font-family", "SBGlyphs");
  let it = setInterval(function () {
    if (document.fonts.check("12px 'SBGlyphs'")) {
      var sizes = [{name: "preview", size: 112}, {name: "leaderboard", size: 30}, {name:"custom"}], finishes = ["zinc", "alloy", "titanium", "gold", "carbon"], lasers = ["Single", "Double", "Lightning", "Digital", "Alien", "Healing 1", "Healing 2"], ECP = window.initECPSetup({id: 0}), ecp_data, last_info, query_index, osize, current_id = 0, resolution, size, title = " - Starblast ECP Icon Viewer", name_regex = /^name\=/i, names = {
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
        // load finish and laser options
        $("#finish-choose").append(finishes.map(i => "<option value='"+i+"'>"+i[0].toUpperCase()+i.slice(1)+"</option>").join(""));
        $("#res-option").append(sizes.map(i => "<option value='"+i.name+"'>"+i.name[0].toUpperCase()+i.name.slice(1)+"</option>").join(""))
        $("#laser-choose").append(lasers.map((i,j) => "<option value='"+j+"'>"+i+"</option>").join(""));
        // find the ecp info of the searching name
        // display the ecp info
        apply(search(), init)
      }, apply = function (index, init) {
        query_index = index;
        let query_info = ecp_data[index];
        last_info = query_info;
        // load the ecp info to the screen
        $("#index").html((query_index+1) + "/" + ecp_data.length);
        window.history.pushState({path: 'url'}, '', window.location.protocol + "//" + window.location.host + window.location.pathname + "?name=" + query_info.name.toLowerCase().replace(/\s/g, "_"));
        updateInfo(query_info, init);
      }, updateInfo = function (query_info, init) {
        $("#name").html(query_info.name);
        $("#date").html("");
        $("#badge-showcase").attr('src', "loading.gif");
        $("link[rel='icon']").attr("href","icon.png");
        $("title")[0].innerHTML = query_info.name + title;
        let ecp_type = names[query_info.type];
        $("#type").html("<a style='text-decoration: none;cursor: pointer' href='"+(ecp_type?("https://starblastio.fandom.com/wiki/"+query_info.type.toUpperCase()+"' target='_blank'>"+ecp_type):"javascript:void(0);'>Unknown")+"</a>");
        // load the ecp image
        applySize(init)
      }, search = function(name) {
        if (!name) {
          let queries = window.location.search.replace(/_/g, " ").replace(/^\?/,"").split("&");
          name = (queries.find(function (query) {return name_regex.test(query)}) || "").replace(name_regex, "").toLowerCase()
        }
        let i = ecp_data.findIndex(function(ecp) {return ecp.name.toLowerCase() === name});
        return i==-1?0:i;
      }, applySize = function(init) {
        let request_id = ECP.id++;
        $("#download").attr("disabled", true);
        let query_info = last_info, laser, finish, loadBadge, size, size_preset;
        if (init) {
          loadBadge = localStorage.getItem("loadBadge") == "true";
          finish = localStorage.getItem("ecp-finish");
          laser = localStorage.getItem("ecp-laser");
          size = localStorage.getItem("ecp-res");
          size_preset = localStorage.getItem("ecp-res-option")
        }
        else {
          loadBadge = !!$("#loadBadge").is(":checked");
          finish = $("#finish-choose").val();
          laser = $("#laser-choose").val();
          size = $("#custom-res").val();
          size_preset = $("#res-option").val()
        }
        finish = finishes.find(f => f == finish) || "zinc";
        laser = Math.trunc(Math.min(Math.max(0, laser), lasers.length - 1)) || 0;
        size_preset = sizes.find(preset => size_preset == preset.name) || sizes[0];
        size = size_preset.size || Math.max(size, 0) || 200;
        localStorage.setItem("ecp-finish", finish);
        localStorage.setItem("ecp-laser", laser);
        localStorage.setItem("ecp-res", size);
        localStorage.setItem("loadBadge", loadBadge);
        localStorage.setItem("ecp-res-option", size_preset.name);
        $("#finish-choose").val(finish);
        $("#laser-choose").val(laser);
        $("#res-option").val(size_preset.name);
        $("#custom-res").val(size);
        $("#loadBadge").prop("checked", loadBadge);
        $("#custom-res").attr('disabled', !!size_preset.size);
        for (let id of ["laser-choose", "finish-choose"]) $("#"+id).attr('disabled', !loadBadge)
        if (loadBadge) ECP.loadBadge(size, query_info, finish, laser, request_id, loadImage);
        else ECP.loadIcon(size, query_info, request_id, loadImage)
      }, loadImage = function (canvas, info, request_id) {
        if (request_id == ECP.id - 1) {
          if (!info.url) $("#date").html("Built-in");
          else if (info.custom) $("#date").html("Custom upload");
          else {
            var xhr = $.ajax({
              type: 'HEAD',
              url: info.url,
              success: function(msg) {
                if (request_id == ECP.id - 1) {
                  var filetime = xhr.getResponseHeader('Last-Modified');
                  $("#date").html("Last updated: " + new Date(filetime).toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'}));
                }
              }
            })
          }
          let link = canvas.toDataURL();
          $("link[rel='icon']").attr("href", link);
          $("#download-template").attr({
            href: link,
            download: info.id
          });
          $("#badge-showcase").attr('src', link);
          $("#download").attr("disabled", false);
        }
      }, loadCustom = function(url) {
        $("#index").html("Unlisted");
        last_info = {
          id: "custom",
          url: url,
          name: "Your custom icon",
          type: "ecp",
          custom: "true"
        }
        query_index = null;
        window.history.pushState({path: 'url'}, '', window.location.protocol + "//" + window.location.host + window.location.pathname);
        updateInfo(last_info);
      }
      $("#apply-res").on("click", function() {
        applySize()
      });
      for (let id of ["loadBadge", "finish-choose", "laser-choose", "res-option"]) $("#"+id).on("change", function() {applySize()});
      $("#url-import").on("click", function() {
        let url = prompt("Insert your image URL here:");
        if (url != null) loadCustom(url)
      });
      $("#file-import").on("change", function(e){
        if (e.target.files && e.target.files[0]) {
          let file=e.target.files[0];
          if (file.type.match("image/")) {
            var reader = new FileReader();
            reader.onload = function (e) {
              loadCustom(e.target.result);
            }
            reader.readAsDataURL(file);
          }
          else alert("Invalid file format!");
          $("#file-import").val("");
        }
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
  addToolPage(null,"1%","1%",null,null,null,null,$("#infobox")[0])
});
