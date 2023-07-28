(function(){
  var updated = false, audioAlert = new Audio('alert.mp3'), notif_box = $("#notif-enabled"), notif_enabled, available_mods = [], mods = [], origin_mods = [], player_count = {}, player_count_region = {}, timer = new Map(), init = !1,
  removed_time = {
    "prototypes": 1578454316626,
    "racing": 1592486063588,
    "escalation": 1689778537000
  },
  created_time = {
    "useries": 1528459800000,
    "racing": 1529679300000,
    "battleroyale": 1511530440000
  }, formatDate = function(date) {
    return new Date(date).toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'})
  }, sw, showText = function (text) {
    text = text || "";
    $("#welcome-text").css("display", text?"":"none").html(text)
  }, modStatBox = function(stat, count, time) {
    let img = `<img id="img-${stat.mod_id}" src='https://starblast.data.neuronality.com/modding/img/${stat.mod_id}.jpg' onerror="setTimeout(function(){this.src = this.src}.bind(this),5000)">`,
    statinfo = `<h3 style="text-align:center"><a style="text-decoration:none" href="https://starblast.fandom.com/wiki/${stat.title.replace(/\s/g,"_")}" target="_blank">${stat.title}</a> <sup>${stat.version}</sup></h3>${stat.new&&stat.active?'<b style="color:yellow;float:right">NEW!</b>':""}${!stat.active?'<b style="color:red;float:right">Removed</b>':""}`;
    if (stat.featured || stat.open) {
      statinfo+="<a href='https://starblast.io/' style='text-decoration: none'><b style='color:#69ff69'>"
      if (stat.featured) statinfo+="Featuring";
      else {
        stat.open = !0;
        statinfo+="Available";
      }
      statinfo+=" in Modding Space</b></a>";
    }
    else if (stat.active) statinfo += `<p><b>Next event:</b> ${formatTime(time)}</p>`;
    statinfo+=`<p><b>Author:</b> ${stat.author}</p>
      <p><b>Date released:</b> ${stat.date_created?formatDate(stat.date_created):"Unknown"}</p>
      ${stat.date_removed?("<p><b>Date removed:</b> "+formatDate(stat.date_removed)+"</p>"):""}
      <p><b>Times played:</b> ${getNum(stat.timesplayed)} (${Math.round(stat.timesplayed/(((stat.date_removed||Date.now())-stat.date_created)/1000/3600/24))} daily)</p>`;
    let parent = $("#"+stat.mod_id), imgelement = $("#img-"+stat.mod_id), statelement = $("#stat-"+stat.mod_id), player_stat = $("#players-"+stat.mod_id);
    if (parent.length == 0) $('#modstats').append(`<div class="modStatBox" id='${stat.mod_id}'>${img}<div id="stat-${stat.mod_id}">${statinfo}</div></div>`);
    else {
      if (imgelement.length == 0) parent.prepend(img);
      if (statelement.length == 0) $(`<div id="stat-${stat.mod_id}"${statinfo}</div>`).insertAfter("#img-"+stat.mod_id);
      else statelement.html(statinfo);
      let u = [];
      for (let i in (player_count_region[stat.mod_id]||{})) u.push(i);
      if (u.length > 0 && player_count[stat.mod_id]) {
        let c = "<td>:&nbsp;</td>", evt = "<tr id='total_players-"+stat.mod_id+"'>", totalplayers = "<td><b>Current players</b</td>"+c+"<td class='numbers'>"+player_count[stat.mod_id]+"</td>", getStat = function(t){return u.map(i=>[i,player_count_region[stat.mod_id][i]]).filter(i => i[1]).sort((a,b)=>b[1]-a[1]).map(i => `<tr ${$("#players-"+stat.mod_id).attr("hide") == "true"||t?"hidden":""}><td>${i[0]}</td>${c}<td class='numbers'>${i[1]}</td></tr>`).join("")};
        if (player_stat.length == 0) $(`<table class="playerstat" hide="true" onclick='let e = $(this), t = e.attr("hide") == "true";$("#players-${stat.mod_id}>tbody>tr:not(#total_players-${stat.mod_id})").prop("hidden",!t);e.attr("hide",!t)' style='cursor:pointer;' id="players-${stat.mod_id}">${evt}${totalplayers}</tr>${getStat(!0)}</table>`).insertAfter("#stat-"+stat.mod_id);
        else {
          let total_players = $("#total_players-"+stat.mod_id);
          if (total_players.length === 0) $("#players-"+stat.mod_id).prepend(evt+totalplayers+"</tr>");
          else total_players.html(totalplayers);
          $("#players-"+stat.mod_id+">tbody>tr:not(#total_players-"+stat.mod_id+")").remove();
          $(getStat()).insertAfter("#total_players-"+stat.mod_id);
        }
      }
      else player_stat.remove();
    }
  }, getNum = function(num) {
    num = num.toString();
    let str = [];
    for (let i=num.length-1;i>=0;i-=3) str.push(num.slice(Math.max(i-2,0),i+1));
    return str.reverse().join(" ");
  }, calcDayTime = function (date) {
    return date.getHours() * 36e5 + date.getMinutes() * 6e4 + date.getSeconds() * 1e3 + date.getMilliseconds()
  }, formatTime = function (ms) {
    ms = ms/1000;
    let t = Math.trunc(ms/3600), u = Math.trunc((ms-t*3600)/60);
    let timeLeft = [t,u,Math.trunc(ms-t*3600-u*60)].map(i => Math.max(i,0)).map(i => i<10?"0"+i.toString():i).join(":");
    let curDate = new Date(), destDate = new Date(curDate.getTime() + ms * 1000);
    let distance = Math.trunc(ms / 864e2);
    if (calcDayTime(destDate) < calcDayTime(curDate)) ++distance;
    let daysNext;
    switch (distance) {
      case 0: daysNext = "Today"; break;
      case 1: daysNext = "Tomorrow"; break;
      default: daysNext = `${distance} days later`;
    }
    return `${timeLeft} (${daysNext} at ${destDate.toLocaleTimeString()})`
  }, loadInfos = function() {
    mods.sort((a,b) => {
      if (!a.active || !b.active) return (Number(!a.active)||0) - (Number(!b.active)||0);
      if (a.featured || b.featured) return Number(!!b.featured) - Number(!!a.featured);
      if (a.open || b.open) return Number(!!b.open) - Number(!!a.open);
      return (timer.get(a.mod_id)||0) - (timer.get(b.mod_id)||0);
    });
    mods.forEach(mod => modStatBox(mod, player_count[mod.mod_id]||0, timer.get(mod.mod_id)));
    let modStats = $("#modstats");
    modStats.append($("#modstats>#welcome-text")[0] || '<p style="text-align:center;font-size:15pt" id="welcome-text">Loading data...</p>');
    mods.forEach(mod => modStats.append($("#modstats>.modStatBox#"+mod.mod_id)));
    let elist = $("#modstats>*");
    while (elist.length > mods.length + 1) $(Array.prototype.shift.call(list)).remove();
    if (mods.length == 0) showText("No mods shown");
    else showText()
  }, count = function() {
    setCountdown();
    checknewAvailableMods();
    loadInfos();
  }, setCountdown = function() {
    let x = 0;
    timer.clear();
    for (let i of origin_mods) if (!i.featured && i.active) x+= 3600 * i.active_duration * 1000;
    let n = Date.now() % x, k = 0, w = 0, o = function(i, s) {
      if (!i.featured) w += 3600 * i.active_duration * 1e3;
      var O = k - n;
      if (O < 0) O += x;
      k = w;
      timer.set(i.mod_id, O);
    }
    origin_mods.forEach((O,r) => O.active && o(O,r));
    mods.forEach(a => {a.open = a.active?Math.max(...[...timer.values()].filter(i => i != null && !isNaN(i))) === timer.get(a.mod_id):!1});
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
    $.getJSON("https://starblast.io/modsinfo.json").then(function(modss) {
      $.getJSON("https://starblast.io/simstatus.json").then(function(players) {
        mods = (modss||{})[0];
        mods = Array.isArray(mods) ? mods : [];
        for (let mod of mods) {
          if (mod.mod_id == "none") switch (mod.title) {
            case "Starblast Prototypes":
              mod.mod_id = "prototypes";
              break;
            default:
              break;
          }
        }
        origin_mods = [...mods];
        player_count = {};
        player_count_region = {};
        for (let i of players) {
          let q = i.location;
          for (let j of i.systems) {
            if (j.mod_id && j.mode == "modding") {
              player_count[j.mod_id] = (player_count[j.mod_id]||0)+j.players;
              if (!player_count_region[j.mod_id]) player_count_region[j.mod_id] = {};
              player_count_region[j.mod_id][q] = (player_count_region[j.mod_id][q]||0) + j.players;
            }
          }
        }
        for (let i of mods) {
          if (removed_time[i.mod_id]) i.date_removed = removed_time[i.mod_id];
          i.date_created = created_time[i.mod_id] || i.date_created;
        }
        setStatus(0);
        if (!init) {
          count();
          adjustwidth();
          setTimeout(adjustwidth, 1);
          setInterval(count, 1000);
          addServiceWorker("/sw.js", function(t){sw = t});
          init = !0;
        }
        queueNextUpdate();
      }).fail(function(e) {
        setStatus(1);
        queueNextUpdate();
      });
    }).fail(function(e) {
      setStatus(1);
      queueNextUpdate();
    });
  }, queueNextUpdate = function() {
    setTimeout(function(){updated = false}, 5000)
  }, showNotification = function (mod) {
    let title = `New mod ${mod.featured?"featuring":"available"} in Modding Space!`, options = {
      body: mod.title+"\nby "+mod.author,
      icon: `https://starblast.data.neuronality.com/modding/img/${mod.mod_id}.jpg`,
      tag: "newMod"
    }
    audioAlert.play();
    try {sw.showNotification(title, options)}
    catch(e) {
      try {new Notification(title, options)}
      catch(ex){alert(title+"\n"+options.body)}
    }
  }, checknewAvailableMods = function() {
    let check_mods = mods.filter(i=> i.open || i.featured);
    (available_mods.length > 0 && notif_enabled) && check_mods.forEach(mod => (available_mods.indexOf(mod.mod_id) == -1) && showNotification(mod));
    available_mods = check_mods.map(i=>i.mod_id);
  }, checknotifEnabled = function(init) {
    if (init) notif_enabled = localData.getItem("mod-notif") == "true";
    else notif_enabled = notif_box.is(":checked");
    if (notif_enabled) handleNotification(function(res){
      let allow_notif = res=="granted";
      notif_enabled = notif_enabled && allow_notif;
      !allow_notif && alert("You must allow Notifications in this site to use this feature!");
      applyNotif();
    });
    else applyNotif();
  }, handleNotification = function(func) {
    let notif = Notification.requestPermission, handler = typeof func == "function"?func:function(){};
    try {
      notif().then(handler);
    } catch(e) {
      handler(notif());
    }
  }, applyNotif = function() {
    localData.setItem("mod-notif",notif_enabled);
    notif_box.prop("checked",notif_enabled);
    let t = Number(notif_enabled), u = ["-slash",""], a = ["on","off"];
    $("#notif-box").prop("title","Turn "+a[t]+" new available mod notifications"+(Notification.permission == "granted"?"":"\n(Requires Notifications permissions)"));
    $("#notif-indicator").prop("class","fas fa-bell"+u[t]);
  }, img_size = 360, padding_ratio = 1/30, full_ratio = 1+4*padding_ratio, width_scale = 0.99, adjustwidth = function(){
    let g = $(window).width() * width_scale, x = Math.round(g/(img_size*full_ratio)), newImgSize = g/(x||1)/full_ratio, m = Math.trunc(newImgSize * padding_ratio);
    $(":root").css({
      '--width': Math.trunc(newImgSize)+"px",
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
  checknotifEnabled(!0);
  notif_box.on("change",function(){checknotifEnabled()});
  setInterval(checkUpdate,1)
})();
