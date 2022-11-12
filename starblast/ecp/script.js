addServiceWorker("sw.js");
window.addEventListener("load", function(){
  $("#init").css("font-family", "SBGlyphs");
  let it = setInterval(function () {
    if (document.fonts.check("12px 'SBGlyphs'")) {
      var updateSizeNeeded, sizes = [
        {name: "preview", size: 112},
        {name: "event", size: 30},
        {name: "leaderboard", size: function () {
          // take current window resolution
          let width = window.innerWidth, height = window.innerHeight, mobile_app = Math.max(width, height) < 800 && ("ontouchstart" in window);
          // calculate game screen resolution
          let screen_ratio = mobile_app ? 2 : 16 / 9;
          width = Math.round(Math.min(height * screen_ratio, width));
          // calculate scoreboard resolution
          width = width * 0.2; // 20% screen width
          height = height * 0.52; // 52% screen height
          // calculate icon ratio
          let ratio = 10 / 11;
          let icon_ratio = Math.min(Math.min(width, height) / ratio, Math.max(width, height));
          // finalize the result
          return Math.round(0.08 * icon_ratio)
        }},
        {name: "custom"}
      ], finishes = [
        {value: "zinc"},
        {value: "alloy"},
        {value: "titanium"},
        {value: "gold"},
        {value: "carbon"},
        {value: "fullcolor"},
        {value: "x27", name: "Electric Blue"}
      ], shadow_modes = [
        {value: "original"},
        {value: "arc-cut"},
        {value: "none"}
      ], lasers = ["Single", "Double", "Lightning", "Digital", "Alien", "Healing 1", "Healing 2"], ECP = window.initECPSetup({id: 0}), ecp_data, last_info, query_index, osize, current_id = 0, resolution, size, title = " - Starblast ECP Icon Viewer", name_regex = /^name\=/i, names = {
        ecp: "Elite Commander Pass (ECP)",
        sucp: "shared Unique Commander Pass (sUCP)",
        ucp: "Unique Commander Pass (UCP)"
      }, updateURL = function(query) {
        window.history.pushState({path: 'url'}, '', window.location.protocol + "//" + window.location.host + window.location.pathname + (query || ""))
      }, updateIcon = function(canvas) {
        let imgURL;
        if (!canvas) imgURL = 'icon.png';
        else if (canvas.width === canvas.height) imgURL = canvas.toDataURL();
        else {
          let iconCanvas = document.createElement("canvas"), height = canvas.height, width = canvas.width, dif = (width - height) / 2, size = Math.max(width, height), x = 0, y = 0;
          iconCanvas.width = iconCanvas.height = size;
          if (dif < 0) x = -dif;
          else y = dif;
          iconCanvas.getContext('2d').drawImage(canvas, x, y, width, height);
          imgURL = iconCanvas.toDataURL()
        }
        $("link[rel='icon']").attr("href", imgURL)
      }, fetch = function(init) {
        $.getJSON("ecp.json").then(function(data) {
          refresh(data, init)
        }).catch(function(e) {
          let fail = false, offline_data;
          try {offline_data = JSON.parse(localData.getItem("ecp-data"))}
          catch (e) {fail = true};
          (fail || !init) && alert("Fetch failed!");
          if (!fail) refresh(offline_data, init);
        })
      }, refresh = function (data, init) {
        // store for offline use
        localData.setItem("ecp-data", JSON.stringify(data));
        // parse to a data array with attribute 'type'
        ecp_data = [];
        for (let i in data) [].push.apply(ecp_data, data[i].map(function(e) {
          e.type = i;
          if (e.url) e.url = (e.active ? "https://starblast.io/ecp/": "./archives/") + e.url;
          return e
        }));
        // load finish and laser options
        $("#finish-choose").append(finishes.map(i => "<option value='"+i.value+"'>"+(i.name || (i.value[0].toUpperCase()+i.value.slice(1)))+"</option>").join(""));
        $("#shadow-mode").append(shadow_modes.map(i => "<option value='"+i.value+"'>"+(i.name || (i.value[0].toUpperCase()+i.value.slice(1)))+"</option>").join(""));
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
        $("#index").html("<p id='indexInput' contenteditable='true'>" + (query_index+1) + "</p><p>/" + ecp_data.length);
        $("#indexInput").on("blur", function(){ $("#indexInput").text(query_index + 1)});
        updateURL("?name=" + query_info.name.toLowerCase().replace(/[^0-9a-z]/gi, ""));
        updateInfo(query_info, init);
      }, updateInfo = function (query_info, init) {
        $("#name").html(query_info.name);
        $("#date").html("");
        $("#badge-showcase").attr('src', "loading.gif");
        updateIcon();
        $("#hidden-name").val($("#custom-name").val() || $("#name").html()).change();
        let ecp_type = names[query_info.type];
        $("#type").html("<a style='text-decoration: none;cursor: pointer' href='"+(ecp_type?("https://starblastio.fandom.com/wiki/"+query_info.type.toUpperCase()+"' target='_blank'>"+ecp_type):"javascript:void(0);'>Unknown")+"</a>");
        // load the ecp image
        applySize(init)
      }, search = function(name) {
        if (!name) {
          let queries = window.location.search.replace(/^\?/,"").split("&");
          name = (queries.find(function (query) {return name_regex.test(query)}) || "").replace(name_regex, "").toLowerCase().replace(/[^0-9a-z]/g, "")
        }
        let i = ecp_data.findIndex(function(ecp) {return ecp.name.toLowerCase().replace(/[^0-9a-z]/g, "") === name || ecp.id === name});
        return i==-1?0:i;
      }, applySize = function(init) {
        let request_id = ECP.id++;
        $("#download").attr("disabled", true);
        let query_info = last_info, laser, finish, loadBadge, size, size_preset, shadow_mode;
        if (init) {
          loadBadge = localData.getItem("loadBadge") == "true";
          finish = localData.getItem("ecp-finish");
          laser = localData.getItem("ecp-laser");
          size = localData.getItem("ecp-res");
          shadow_mode = localData.getItem("ecp-shadow");
          size_preset = localData.getItem("ecp-res-option")
        }
        else {
          loadBadge = !!$("#loadBadge").is(":checked");
          finish = $("#finish-choose").val();
          laser = $("#laser-choose").val();
          size = $("#custom-res").val();
          shadow_mode = $("#shadow-mode").val();
          size_preset = $("#res-option").val()
        }
        finish = (finishes.find(f => f.value == finish) || finishes[0]).value;
        laser = Math.trunc(Math.min(Math.max(0, laser), lasers.length - 1)) || 0;
        size_preset = sizes.find(preset => size_preset == preset.name) || sizes[0];
        updateSizeNeeded = "function" == typeof size_preset.size;
        size = (updateSizeNeeded ? size_preset.size() : size_preset.size) || Math.max(size, 0) || 200;
        shadow_mode = (shadow_modes.find(f => f.value == shadow_mode) || shadow_modes[0]).value;

        localData.setItem("ecp-finish", finish);
        localData.setItem("ecp-laser", laser);
        localData.setItem("ecp-res", size);
        localData.setItem("ecp-shadow", shadow_mode);
        localData.setItem("loadBadge", loadBadge);
        localData.setItem("ecp-res-option", size_preset.name);

        $("#finish-choose").val(finish);
        $("#laser-choose").val(laser);
        $("#res-option").val(size_preset.name);
        $("#shadow-mode").val(shadow_mode);
        $("#custom-res").val(size);
        $("#loadBadge").prop("checked", loadBadge);
        for (let id of ["custom-res", "apply-res"]) $("#"+id).attr('disabled', !!size_preset.size);
        for (let id of ["laser-choose", "finish-choose", "shadow-mode"]) $("#"+id).attr('disabled', !loadBadge);

        if (loadBadge) ECP.loadBadge(size, query_info, finish, laser, shadow_mode, request_id, loadImage);
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
          updateIcon(canvas);
          let link = canvas.toDataURL();
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
          name: '<input type="text" class="inline-input" id="custom-name" onchange="$(\'#hidden-name\').val(this.value).change()" placeholder="Custom icon name" value="Your custom icon">',
          type: "ecp",
          custom: "true"
        }
        query_index = null;
        updateURL();
        updateInfo(last_info);
      }
      $(window).on("resize", function(){
        if (updateSizeNeeded) applySize()
      });
      $("#apply-res").on("click", function() {
        applySize()
      });
      for (let id of ["loadBadge", "finish-choose", "laser-choose", "res-option", "shadow-mode"]) $("#"+id).on("change", function() {applySize()});
      $("#url-import").on("click", function() {
        let url = prompt("Insert your image URL here:");
        if (url) loadCustom(url)
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
      $("#warning").on("click", function(){
        alert("Sometimes the execution of scripts on pages using Starblast data in other tabs (main site, modding, shipeditor, standalone, serverlists, etc.) can block the fetching process on this page.\nPlease close those tabs and then hard-reload this page to try again.\nIf the above method doesn't work, restart the browser and retry.")
      });
      $("#hidden-name").on("change", function() {
        $("title").text(($("#hidden-name").val() || "Your custom icon") + title)
      })
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
      var focusIDs = [
        {id: 'custom-res', handler: applySize},
        {id: 'indexInput', handler: function (){ apply(Math.trunc(Math.min(Math.max(parseInt($("#"+this.id).text()), 1), ecp_data.length)) - 1 || 0)}},
        {id: 'custom-name', handler: function () {}},
        {id: 'res-option', handler: function () {}},
        {id: 'finish-choose', handler: function () {}},
        {id: 'laser-choose', handler: function () {}},
      ];
      $(document).on('keydown', function (event) {
        let focusID = focusIDs.find(id => $("#"+id.id).is(":focus"));
        if (focusID) {
          switch (event.keyCode) {
            case 13: // Enter
              focusID.handler();
              break;
          }
        }
        else switch (event.keyCode) {
          default:
            let handler = (Object.values(nav_key_actions).find(action => action.keyCode == event.keyCode)||{}).handler;
            if (typeof handler == "function") handler();
        }
      });
      fetch(true);
      $("#init").css("display", "none");
      clearInterval(it);
    }
  }, 500);
  addToolPage(null,"1%","1%",null,null,null,null,$("#infobox")[0])
});
