(function(){
  var ips_timeout = 2 * 3600, regions = ["Asia", "America", "Australia", "Brazil", "Europe"], servertypes = ["Public", "Modding"], updated = false, init, servers = [], IPs = {}, getTime = function(ms) {
    let days = Math.trunc(ms / 1000 / 60 / 60 / 24), text;
    if (days < 1) text = "<1 day";
    else if (days == 1) text = "1 day";
    else text = days + " days";
    return text
  }, saveLocal = function (name, value) {
    return localStorage.setItem(name, JSON.stringify(value))
  }, loadLocal = function (name, value) {
    let item = localStorage.getItem(name);
    try { return JSON.parse(item) } catch (e) { return item }
  }, showText = function (text) {
    text = text || "";
    $("#welcome-text").css("display", text?"":"none").html(text)
  }, setAdblocker = function (bool) {
    $("#adblocker").css("display", bool?"":"none")
  }, fetchLocation = function(ip, action) {
    $.get("https://ipwhois.app/json/"+ip+"?objects=country,country_flag,region").then(function (data) {
      IPs[ip] = `<img onerror="setTimeout(function(){this.src = this.src}.bind(this),5000)" src="${data.country_flag}"> ${data.region}, ${data.country}`;
      saveLocal("server-ips", IPs);
      setAdblocker(false);
      if ("function" == typeof action) action();
    }).catch(function(error) {
      if (error.status == 0) setAdblocker(true);
      else setAdblocker(false)
    })
  }, assignLocation = function(ID, ip) {
    $("#serverstats #location-"+ID).html("<b>Location:</b> "+ (IPs[ip] || "Unknown")).attr("title", "Server IP: "+ip);
  }, getLocation = function (server) {
    let serverID = getID(server), ip = String(server.address).split(":")[0], setLocation = function() { assignLocation(serverID, ip) }
    setLocation();
    if (!IPs[ip]) fetchLocation(ip, setLocation)
  }, getID = function(server) {
    return String(server.address).replace(/\./g, "-").replace(/\:/g, "_")
  }, serverStatBox = function(server) {
    server = server || {}
    let serverID = getID(server), html = `<img src='servericon.jpg' onerror="setTimeout(function(){this.src = this.src}.bind(this),5000)">
    <h3 style="text-align:center">Server ${(server.usage||{}).pid||0}-${(server.usage||{}).ppid||0} ${server.modding?'<img src="favicon.ico" class="modding-thumnail" title="This is a Modding server" onerror="setTimeout(function(){this.src = this.src}.bind(this),5000)">':""}</h3>
    <p><b>Region:</b> ${server.location}</p>
    <p class="location" id="location-${serverID}"></p>
    <p><b>Uptime:</b> ${getTime((server.usage||{}).elapsed || 0)}</p>
    <p><b>Players:</b> ${getNum(server.current_players)}</p>
    <p><b>Systems:</b> ${getNum(server.systems.length)}</p>`, el = $("#serverstats>.serverStatBox#"+serverID);
    if (!el[0]) {
      el = $(`<div id=${serverID} class="serverStatBox">${html}</div>`);
      $("#serverstats").append(el);
    }
    else el.html(html);
    getLocation(server)
  }, getNum = function(num) {
    num = num.toString();
    let str = [];
    for (let i=num.length-1;i>=0;i-=3) str.push(num.slice(Math.max(i-2,0),i+1));
    return str.reverse().join(" ");
  }, loadInfos = function() {
    servers.forEach(serverStatBox);
    $("#serverstats").prepend($("#serverstats>#welcome-text")[0] || '<p style="text-align:center;font-size:15pt" id="welcome-text">Loading data...</p>');
    let serverclone = servers.map(server => (server.id = getID(server), server)).concat({id: "welcome-text"}), elist = $("#serverstats>*");
    for (let el of elist) {
      let EL = $(el), index = serverclone.findIndex(server => server.id === EL.attr('id'));
      if (index == -1) EL.remove();
      else {
        let s = serverclone.splice(index, 1)[0];
        if (s.id != "welcome-text") EL.attr('class', 'serverStatBox').css("display", `var(--${s.location}-${servertypes[+!!s.modding]})`)
      }
    }
    checkEmpty()
  }, checkEmpty = function () {
    if (Array.prototype.filter.call($("#serverstats>*"), el => (el||{}).id != "welcome-text" && $(el).css("display") != "none").length == 0) showText("No servers.");
    else showText();
    adjustwidth()
  }, setStatus = function(n) {
    n = Number(n);
    let name = ["Online","Offline"], color = ["green","red"], desc = ["latest data fetched from Starblast's database", "offline data stored from latest successful fetch"], status = $("#status");
    if (n < name.length && n >= 0) {
      status.html(name[n]);
      status.prop({
        style: "color:"+color[n],
        title: "You are viewing "+desc[n]
      });
    }
  }, update = function() {
    $.getJSON("https://starblast.io/simstatus.json").then(function(simstatus) {
      servers = Array.from(simstatus || 0);
      setStatus(0);
      loadInfos();
      if (!init) {
        setInterval(adjustwidth, 1000);
        init = !0;
      }
      queueNextUpdate();
    }).fail(function(e) {
      setStatus(1);
      queueNextUpdate();
    });
  }, queueNextUpdate = function() {
    setTimeout(function(){updated = false}, 5000)
  }, img_size = 360, padding_ratio = 1/30, full_ratio = 1+4*padding_ratio, adjustwidth = function(){
    let g = $(window).width(), x = Math.round(g/(img_size*full_ratio)), t = g/(x||1)/full_ratio, m = Math.trunc(t*padding_ratio);
    $(":root").css({
      '--width': Math.trunc(t)+"px",
      '--padding': m+"px",
      '--margin': m+"px",
      '--border-radius':m+"px"
    });
  }, checkUpdate = function () {
    if (!updated) {
      updated = true;
      update()
    }
  }, checkSelections = function (init) {
    let selectedRegions = {}, selectedServerTypes = {};
    if (init) {
      selectedRegions = loadLocal('selected-regions') || {}
      selectedServerTypes = loadLocal('selected-server-types') || {}
    }
    let verify = init ? True : checked;
    for (let region of regions) {
      let res = verify(region, selectedRegions);
      selectedRegions[region] = res;
      $("#show"+region).prop("checked", res)
    }
    for (let servertype of servertypes) {
      let res = verify(servertype, selectedServerTypes);
      selectedServerTypes[servertype] = res;
      $("#show"+servertype).prop("checked", res)
    }
    let root = $(":root");
    for (let region of regions) {
      for (let servertype of servertypes) {
        let confirmed = selectedRegions[region] && selectedServerTypes[servertype];
        root.css("--"+region+"-"+servertype, confirmed?"inline-block":"none")
      }
    }
    if (!init) checkEmpty();
    saveLocal('selected-regions', selectedRegions);
    saveLocal('selected-server-types', selectedServerTypes)
  }, checked = function(name) {
    let el = $("#show"+name);
    return el.length == 0 || el.is(":checked")
  }, True = function (name, obj) {
    let val = obj[name];
    return val == null || !!val
  }
  try {
    IPs = loadLocal("server-ips") || {}
    let timestamp = Number(IPs.timestamp);
    if (!timestamp || Date.now() - timestamp > timeout) IPs = {timestamp: Date.now()}
    saveLocal("server-ips", IPs)
  } catch (e) {}
  for (let region of regions) {
    let id = "show" + region;
    $("#regions").append(`<input type='checkbox' id='${id}'><label for='${id}'>${region}</label>`);
    $("#"+id).on("click", function(){checkSelections()})
  }
  for (let servertype of servertypes) {
    let id = "show" + servertype;
    $("#servertypes").append(`<input type='checkbox' id='${id}'><label for='${id}'>${servertype}</label>`);
    $("#"+id).on("click", function(){checkSelections()})
  }
  checkSelections(true);
  window.addEventListener("resize", adjustwidth);
  setInterval(checkUpdate,1)
})();
