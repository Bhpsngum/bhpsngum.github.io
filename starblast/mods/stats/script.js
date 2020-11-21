(function(){
  var modStatBox = function(stat, count, index) {
    let img = `<img id="img-${stat.mod_id}"src='https://starblast.data.neuronality.com/modding/img/${stat.mod_id != "none"?stat.mod_id:"prototypes"}.jpg'>`,
    statinfo = `<h3 style="text-align:center">${stat.title} <sup>${stat.version}</sup></h3>
      ${stat.new?"<b style='color:yellow;float:right'>NEW!</b>":""}
      ${!stat.active?"<b style='color:red;float:right'>Removed</b>":""}</p>
      ${stat.featured?"<b style='color:green'>Featuring in Modding Space</b>":""}
      <p><b>Author:</b> ${stat.author}</p>
      <p><b>Times played:</b> ${getNum(stat.timesplayed)}</p>
      ${(stat.active && count)?("<p>"+count+" playing</p>"):""}`, parent = $("#"+stat.mod_id), imgelement = $("#img-"+stat.mod_id), statelement = $("#stat-"+stat.mod_id);
    if (parent.length == 0) $('#modstats').append(`<div index = "${index}" class="modStatBox" id='${stat.mod_id}'>${img}<div id="stat-${stat.mod_id}">${statinfo}</div></div>`);
    else {
      parent.attr("index",index);
      if (imgelement.length == 0) parent.prepend(img);
      if (statelement.length == 0) parent.append(`<div id="stat-${stat.mod_id}"${statinfo}</div>`);
      else statelement.html(statinfo);
    }
  }, getNum = function(num) {
    num = num.toString();
    let str = [];
    for (let i=num.length-1;i>=0;i-=3) str.push(num.slice(Math.max(i-2,0),i+1));
    return str.reverse().join(" ");
  } ,recall = function() {
    $.getJSON("https://starblast.io/modsinfo.json").then(function(mods) {
      $.getJSON("https://starblast.io/simstatus.json").then(function(players) {
        let player_count = {};
        for (let i of players)
          for (let j of i.systems) {
            if (j.mod_id && j.mode == "modding") {
              player_count[j.mod_id] = (player_count[j.mod_id]||0)+j.players;
            }
          }
        mods[0].sort((a,b) => {
          if (!a.active || !b.active) return (Number(!a.active)||0) - (Number(!b.active)||0);
          if (a.new || a.featured || b.new || b.featured) {
            let ap = Number(!!a.new) + Number(!!a.featured), bp = Number(!!b.new) + Number(!!b.featured);
            return bp-ap;
          }
          if ((player_count[a.mod_id] || 0 == 0) || (player_count[b.mod_id] || 0 == 0)) return (player_count[b.mod_id] || 0) - (player_count[a.mod_id] || 0);
          return (Number(b.date_created)||0) - (Number(a.date_created)||0);
        }).forEach((mod, i) => modStatBox(mod, player_count[mod.mod_id]||0, i));
        let elist = $("#modstats>*");
        for (let i=0;i<elist.length-1;i++)
          for (let j=i+1;j<elist.length;j++)
            if (Number(elist[i].getAttribute("index")) > Number(elist[j].getAttribute("index"))) {
              $(elist[j]).insertBefore($(elist[i]));
              elist = $("#modstats>*");
            }
      });
  }).fail(e=>console.log(e));
    setTimeout(recall,5000);
  }
  recall();
})();
