(function(){
  var mods = [], origin_mods = [], player_count = {}, player_count_region = {}, timer = new Map(), init = !1,
  removed_time = {
    "none": 1578454316626,
    "prototypes": 1578454316626,
    "racing": 1592486063588
  },
  modStatBox = function(stat, count, index, time) {
    let img = `<img id="img-${stat.mod_id}"src='https://starblast.data.neuronality.com/modding/img/${stat.mod_id != "none"?stat.mod_id:"prototypes"}.jpg'>`,
    statinfo = `<h3 style="text-align:center">${stat.title} <sup>${stat.version}</sup></h3>
      ${stat.new?"<b style='color:yellow;float:right'>NEW!</b>":""}
      ${!stat.active?"<b style='color:red;float:right'>Removed</b>":""}`;
    if (stat.featured || stat.open) {
      statinfo+="<a href='https://starblast.io/' style='text-decoration: none'><b style='color:green'>"
      if (stat.featured) statinfo+="Featuring";
      else {
        mods[index].open = !0;
        statinfo+="Available";
      }
      statinfo+=" in Modding Space</b></a>";
    }
    else if (stat.active) statinfo += `<p><b>Next event:</b> ${formatTime(time)}</p>`;
    statinfo+=`<p><b>Author:</b> ${stat.author}</p>
      <p><b>First released:</b> ${stat.date_created?new Date(stat.date_created).toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'}):"Unknown"}</p>
      <p><b>Times played:</b> ${getNum(stat.timesplayed)} (${Math.round(stat.timesplayed/(((stat.date_removed||Date.now())-stat.date_created)/1000/3600/24))} daily)</p>`;
    let parent = $("#"+stat.mod_id), imgelement = $("#img-"+stat.mod_id), statelement = $("#stat-"+stat.mod_id), player_stat = $("#players-"+stat.mod_id);
    if (parent.length == 0) $('#modstats').append(`<div index = "${index}" class="modStatBox" id='${stat.mod_id}'>${img}<div id="stat-${stat.mod_id}">${statinfo}</div></div>`);
    else {
      parent.attr("index",index);
      if (imgelement.length == 0) parent.prepend(img);
      if (statelement.length == 0) $(`<div id="stat-${stat.mod_id}"${statinfo}</div>`).insertAfter("#img-"+stat.mod_id);
      else stateelement.html() != statinfo && statelement.html(statinfo);
      let u = [];
      for (let i in (player_count_region[stat.mod_id]||{})) u.push(i);
      if (u.length > 0 && stat.active && player_count[stat.mod_id]) {
        let totalplayers = "<b>Current players:</b> "+player_count[stat.mod_id], playerstat = u.filter(i => player_count_region[stat.mod_id][i]).map(i => `<li>${i}: ${player_count_region[stat.mod_id][i]}</li>`).join(""), evt = "<p id='total_players-"+stat.mod_id+"'style='cursor:pointer;' onclick='let p = $(this).parent()[0]; if (p) {p = $(\"#\"+p.id+\">ul\"); p.prop(\"hidden\",!p.prop(\"hidden\"))}'>";
        if (player_stat.length == 0) $(`<div id="players-${stat.mod_id}">${evt}${totalplayers}</p><ul hidden="true">${playerstat}</ul></div>`).insertAfter("#stat-"+stat.mod_id);
        else {
          let total_players = $("#total_players-"+stat.mod_id);
          if (total_players.length === 0) $("#players-"+stat.mod_id).prepend(evt+totalplayers+"</p>");
          else total_players.html(totalplayers);
          let lists = $("#players-"+stat.mod_id+">ul");
          if (lists.length === 0) $("<ul hidden='true'>"+playerstat+"</ul>").insertAfter("#total_players-"+stat.mod_id);
          else lists.html() != playerstats && lists.html(playerstat);
        }
      }
      else player_stat.remove();
    }
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
    mods.sort((a,b) => {
      if (!a.active || !b.active) return (Number(!a.active)||0) - (Number(!b.active)||0);
      if (a.featured || b.featured) return Number(!!b.featured) - Number(!!a.featured);
      if (a.open || b.open) return Number(!!b.open) - Number(!!a.open);
      return (timer.get(a.mod_id)||0) - (timer.get(b.mod_id)||0);
    });
    mods.forEach((mod, i) => modStatBox(mod, player_count[mod.mod_id]||0, i, timer.get(mod.mod_id)));
    let elist = $("#modstats>*");
    for (let i=0;i<elist.length-1;i++)
      for (let j=i+1;j<elist.length;j++)
        if (Number(elist[i].getAttribute("index")) > Number(elist[j].getAttribute("index"))) {
          $(elist[j]).insertBefore($(elist[i]));
          elist = $("#modstats>*");
        }
  }, count = function() {
    setCountdown();
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
        style: "user-select:none;text-align:center;font-size:1.5vw;color:"+color[n],
        title: "You are viewing "+desc[n]
      });
    }
  }, update = function() {
    $.getJSON("https://starblast.io/modsinfo.json").then(function(modss) {
      $.getJSON("https://starblast.io/simstatus.json").then(function(players) {
        mods = modss[0];
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
        for (let i of mods) if (removed_time[i.mod_id]) i.date_removed = removed_time[i.mod_id];
        setStatus(0);
        if (!init) {
          count();
          $("#welcome-text").remove();
          setInterval(count, 500);
          init = !0;
        }
      });
    }).fail(e => setStatus(1));
  }
  update();
  setInterval(update, 5000);
})();
