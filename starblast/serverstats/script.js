(function(){
  var updated = false, servers = [], formatDate = function(date) {
    return new Date(date).toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'})
  }, showText = function (text) {
    text = text || "";
    $("#welcome-text").css("display", text?"":"none").html(text)
  }, serverStatBox = function(server, index) {
    // ...
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
    servers.forEach(serverStatBox);
    for (let i=0;i<elist.length-1;i++)
      for (let j=i+1;j<elist.length;j++) {
        let cur = $(elist[i]), next = $(elist[j]), index = Number(elist[i].getAttribute("index"));
        if ((cur.attr("class")||"").split(" ").indexOf("serverStatBox") == -1 && servers.findIndex() == -1) cur.remove();
        else if (index > Number(next.attr("index"))) next.insertBefore(cur);
        elist = $("#serverstats>*");
      }
    if ($("#serverstats>.serverStatBox").length == 0) showText("No servers are active right now.");
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
      if (!init) {
        loadInfos();
        adjustwidth();
        setTimeout(adjustwidth, 1);
        setInterval(loadInfos, 1000);
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
  }
  window.addEventListener("resize", adjustwidth);
  setInterval(checkUpdate,1)
})();
