// Only run in those 2 domains
// * starblast.io
// * starblast.data.neuronality.com

const getJSON = async function (url) {
  return await (await fetch(url)).json();
}

window.checkCustomHack = async function () {
  var files = [["rankings", "ratings"], ["invasion", "s1"]];
  let data = await getJSON("https://bhpsngum.github.io/starblast/ecp/ecp.json");
  let ecp = data.ecp.filter(i => i.active).map(i => (i.id = i.id.match(/^[a-z0-9]+/)[0], i));
  ecp.push(...[data.sucp, data.ucp].flat().map(i => (i.id = "http://starblast.io/ecp/" + i.url, i)));
  ecp = ecp.map(i => i.id);
  let finish = ["zinc", "gold", "alloy", "carbon", "titanium"];
  let laser = Array(4).fill(0).map((v,i) => i.toString());
  let sus = [];
  let tasks = [];
  for (let file of files) tasks.push((async function () {
    let infos = await getJSON("https://starblast.io/" + file[0] + ".json");
    infos = Object.values(infos[file[1]]).flat().map(i => {
      let {name, id, custom} = i;
      delete i.name;
      delete i.custom;
      delete i.id;
      return {
        name,
        id,
        custom,
        [file[0]]: i
      }
    });
    for (let info of infos) {
      let custom = info.custom;
      info.customStatus = {
        badge: !custom || ecp.indexOf(custom.badge) != -1,
        finish: !custom || finish.indexOf(custom.finish) != -1,
        laser: !custom || laser.indexOf(custom.laser) != -1
      }
      if (Object.values(info.customStatus).indexOf(false) != -1) {
        let mem = sus.find(i => i.id === info.id);
        if (mem) Object.assign(mem, info);
        else sus.push(info);
      }
    }
  })());

  try {
    await Promise.allSettled(tasks);
  }
  finally {
    for (let player of sus) {
      let customStatus = player.customStatus;
      delete player.customStatus;
      console.log(`Name: ${player.name}\nID: ${player.id}\nCustomization check:\n${["badge", "finish", "laser"].map(i => "- " + i[0].toUpperCase() + i.slice(1) + ": %c" + (customStatus[i] ? "OK" : "HACKED") + " -> " + player.custom[i] + "%c").join("\n")}`, ...Object.values(customStatus).map(i => ["color: " + (i ? "green" : "red"), "color: inherit"]).flat());
      console.log(player);
      console.log("\n");
    }
  }
}
