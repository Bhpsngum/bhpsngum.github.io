(function(){
  var mods = [], player_count = {}, player_count_region = {}, timer = new Map(), init = !1, count_interval = 500,
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
      <p><b>Times played:</b> ${getNum(stat.timesplayed)} (${Math.round(stat.timesplayed/(((stat.date_removed||Date.now())-stat.date_created)/1000/3600/24))} daily)</p>
      ${(stat.active && player_count[stat.mod_id])?("<p><b>Current players:</b> "+player_count[stat.mod_id]+"</p>"):""}`;
    let parent = $("#"+stat.mod_id), imgelement = $("#img-"+stat.mod_id), statelement = $("#stat-"+stat.mod_id), player_stat = $("#players-"+stat.mod_id);
    if (parent.length == 0) $('#modstats').append(`<div index = "${index}" class="modStatBox" id='${stat.mod_id}'>${img}<div id="stat-${stat.mod_id}">${statinfo}</div></div>`);
    else {
      parent.attr("index",index);
      if (imgelement.length == 0) parent.prepend(img);
      if (statelement.length == 0) $(`<div id="stat-${stat.mod_id}"${statinfo}</div>`).insertAfter("#img-"+stat.mod_id);
      else statelement.html(statinfo);
      let u = [];
      for (let i in (player_count_region[stat.mod_id]||{})) u.push(i);
      if (u.length > 0) {
        let playerstat = u.map(i => `<li>${i}: ${player_count_region[stat.mod_id][i]||0}</li>`).join("");
        if (player_stat.length == 0) $(`<ul id="players-${stat.mod.id}">${playerstat}</ul>`).insertAfter("#stat-"+stat.mod_id);
        else player_stat.html(playerstat);
      }
      else $("#players-"+stat.mod_id).remove();
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
    mods.forEach((mod, i) => modStatBox(mod, player_count[mod.mod_id]||0, i, timer.get(mod.mod_id)));
    let elist = $("#modstats>*");
    for (let i=0;i<elist.length-1;i++)
      for (let j=i+1;j<elist.length;j++)
        if (Number(elist[i].getAttribute("index")) > Number(elist[j].getAttribute("index"))) {
          $(elist[j]).insertBefore($(elist[i]));
          elist = $("#modstats>*");
        }
  }, count = function() {
    var request_update = !1;
    for (let i of timer.keys()) {
      timer.set(i, timer.get(i) - count_interval);
      if (timer.get(i) <= 0 && !request_update) {
        update();
        request_update = !0;
      }
    }
    loadInfos();
  }, update = function() {
    $.getJSON("https://starblast.io/modsinfo.json").then(function(modss) {
      $.getJSON("https://starblast.io/simstatus.json").then(function(players) {
        mods = modss[0];
        player_count = {};
        for (let i of players)
          let q = i.location;
          for (let j of i.systems) {
            if (j.mod_id && j.mode == "modding") {
              player_count[j.mod_id] = (player_count[j.mod_id]||0)+j.players;
              if (!player_count_region[j.mod_id]) player_count_region[j.mod_id] = {};
              player_count_region[j.mod_id][q] = (player_count_region[j.mod_id][q]||0) + j.players;
            }
          }
        let x = 0;
        for (let i of mods) {
          if (!i.featured && i.active) x+= 3600 * i.active_duration * 1000;
          i.date_removed = removed_time[i.mod_id];
        }
        let n = Date.now() % x, k = 0, w = 0, o = function(i, s) {
          if (!i.featured) w += 3600 * i.active_duration * 1e3;
          var O = k - n;
          if (O < 0) O += x;
          k = w;
          timer.set(i.mod_id, O);
        }
        mods.forEach((O,r) => O.active && o(O,r));
        mods.sort((a,b) => {
          if (!a.active || !b.active) return (Number(!a.active)||0) - (Number(!b.active)||0);
          if (a.featured || b.featured) return Number(!!b.featured) - Number(!!a.featured);
          let g = Math.max(...[...timer.values()].filter(i => i != null && !isNaN(i)));
          a.open = g === timer.get(a.mod_id);
          b.open = g === timer.get(b.mod_id);
          if (a.open || b.open) return Number(!!b.open) - Number(!!a.open);
          return (timer.get(a.mod_id)||0) - (timer.get(b.mod_id)||0);
        });
        loadInfos();
        if (!init) {
          setInterval(count, count_interval);
          init = !0;
        }
      });
    }).fail(e=>console.log(e));
  }
  update();
  setInterval(update, 5000);
})();
