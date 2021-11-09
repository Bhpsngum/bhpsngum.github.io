(function(){
  var ips_timeout = 2 * 24 * 3600, updated = false, init, servers = [], IPs = {}, getTime = function(ms) {
    let days = Math.trunc(ms / 1000 / 60 / 60 / 24), text;
    if (days < 1) text = "<1 day";
    else if (days == 1) text = "1 day";
    else text = days + " days";
    return text
  }, showText = function (text) {
    text = text || "";
    $("#welcome-text").css("display", text?"":"none").html(text)
  }, setAdblocker = function (bool) {
    $("#adblocker").css("display", bool?"":"none")
  }, fetchLocation = function(ip, action) {
    $.get("https://ipapi.co/"+ip+"/country_name/").then(function (data) {
      IPs[ip] = data;
      localStorage.setItem("server-ips", JSON.stringify(IPs));
      setAdblocker(false);
      if ("function" == typeof action) action();
    }).catch(function(error) {
      if (error.status == 0) setAdblocker(true);
      else setAdblocker(false);
      console.log(error);
    })
  }, assignLocation = function(ID, ip) {
    $("#serverstats #location-"+ID).html("<p class='location' title='Server IP: "+ip+"'><b>Location:</b> "+ (IPs[ip] || "Unknown")+"</p>");
  }, getLocation = function (server) {
    let serverID = getID(server), ip = String(server.address).split(":")[0], setLocation = function() { assignLocation(serverID, ip) }
    setLocation();
    if (!IPs[ip]) fetchLocation(ip, setLocation)
  }, getID = function(server) {
    return String(server.address).replace(/\./g, "-").replace(/\:/g, "_")
  }, serverStatBox = function(server, index) {
    let serverID = getID(server), html = `<img src='servericon.jpg' onerror="setTimeout(function(){this.src = this.src}.bind(this),5000)">
    <h3 style="text-align:center">Server ${index + 1} ${server.modding?'<img src="favicon.ico" class="modding-thumnail" title="This is a Modding server" onerror="setTimeout(function(){this.src = this.src}.bind(this),5000)">':""}</h3>
    <p><b>Region:</b> ${server.location}</p>
    <p id="location-${serverID}"></p>
    <p><b>Uptime:</b> ${getTime((server.usage||{}).elapsed || 0)}</p>
    <p><b>Players:</b> ${server.current_players}</p>
    <p><b>Systems:</b> ${server.systems.length}</p>`, el = $("#serverstats>.serverStatBox#"+serverID);
    if (!el[0]) el = $(`<div id=${serverID} class="serverStatBox">${html}</div>`);
    else el.html(html);
    $("#serverstats").append(el);
    getLocation(server)
  }, getNum = function(num) {
    num = num.toString();
    let str = [];
    for (let i=num.length-1;i>=0;i-=3) str.push(num.slice(Math.max(i-2,0),i+1));
    return str.reverse().join(" ");
  }, formatTime = function (ms) {
    ms = ms/1000;
    let t = Math.trunc(ms/3600), u = Math.trunc((ms-t*3600)/60);
    return [t,u,Math.trunc(ms-t*3600-u*60)].map(i => Math.max(i,0)).map(i => i<10?"0"+i.toString():i).join(":")
  }, loadInfos = function() {
    let serverStats = $("#serverstats");
    serverStats.append($("#serverstats>#welcome-text")[0] || '<p style="text-align:center;font-size:15pt" id="welcome-text">Loading data...</p>');
    servers.forEach(serverStatBox);
    let elist = $("#serverstats>*");
    while (elist.length > servers.length + 1) $(Array.prototype.shift.call(elist)).remove();
    if (servers.length == 0) showText("No servers are active right now.");
    else showText()
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
        adjustwidth();
        setTimeout(adjustwidth, 1);
        init = !0;
      }
      queueNextUpdate();
    }).fail(function(e) {
      setStatus(1);
      queueNextUpdate();
    });
  }, queueNextUpdate = function() {
    setTimeout(function(){updated = false}, 10000)
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
  }
  try {
    IPs = JSON.parse(localStorage.getItem("server-ips")) || {}
    let timestamp = Number(IPs.timestamp);
    if (!timestamp || Date.now() - timestamp > timeout) IPs = {}
    localStorage.setItem("server-ips", JSON.stringify(IPs))
  } catch (e) {}
  window.addEventListener("resize", adjustwidth);
  setInterval(checkUpdate,1)
})();
