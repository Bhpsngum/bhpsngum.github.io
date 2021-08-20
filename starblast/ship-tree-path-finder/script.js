(function(){
  let showError = function(text) {
    target.css("color", "red");
    target.html(text)
  }
  let showResults = function(html) {
    target.css("color","");
    target.html(html)
  }
  let target = $("#results");
  let findPath = function (){
    let ship_name = $("#ship-input").val();
    let mod_name = $("#tree-select").val();
    if (["vanilla", "kest"].indexOf(mod_name) != -1) link = "https://raw.githubusercontent.com/Bhpsngum/starblast/master";
    else link = "https://starblast.data.neuronality.com";
    link += "/mods/" + mod_name + ".js";
    let game = {custom: {}}
    for (let i of ["addAlien","addAsteroid","addCollectible","setObject","setCustomMap","setUIComponent","removeObject"]) game[i] = function(){}
    if (!ship_name || !mod_name) {
      if (!ship_name) showError("Please enter a ship to lookup");
      else showError("Please choose a ship tree to lookup")
    }
    else {
      showResults("Processing...");
      $.get(link).then(function(mod_code){
        Function("game", mod_code).call(game, game);
        let internals = game.custom.ships;
        let uAr = function(array, noSort) {
          let res = Array.from(new Set(array));
          if (noSort) return res;
          return res.sort(function(a,b){return a - b})
        }
        let getModel = function(code) {
          code = getNum(code);
          let t = internals.models.get(code);
          if (code != null) return t;
          return code%100
        }
        let getNum = function(num) {
          let n = Number(num);
          return isNaN(n)?num:n
        }

        let default_ships = (game.options.reset_tree)?[]:[
          ,
          [101],
          [201, 202],
          [301, 302, 303, 304],
          [401, 402, 403, 404, 405, 406],
          [501, 502, 503, 504, 505, 506, 507],
          [601, 602, 603, 604, 605, 606, 607, 608],
          [701, 702, 703, 704]
        ];
        let default_nexts = new Map(game.options.reset_tree?[]:[[302, [403, 404]]]);

        let default_options = {
          ships: default_ships,
          nexts: default_nexts,
          names: new Map(),
          models: new Map()
        }
        game.custom.ships = default_options;
        internals = game.custom.ships;
        if (Array.isArray(game.options.ships))
          for (let ship of game.options.ships)
          {
            try {
              let prs= JSON.parse(ship);
              let code = getNum(prs.typespec.code);
              let next = getNum(prs.typespec.next);
              let level = getNum(prs.typespec.level);
              if (!Array.isArray(internals.ships[level])) internals.ships[level] = [];
              internals.ships[level].push(code);
              internals.names.set(code, prs.name);
              if (prs.typespec.model !== code%100) internals.models.set(code, prs.typespec.model);
              let cnxt = uAr(Array.isArray(next)?next:[]);
              if (cnxt.length > 0) internals.nexts.set(code, cnxt)
            }
            catch(e){
              game.custom.ships = default_options;
              internals = game.custom.ships;
              break
            }
          }
        for (let i in internals.ships) {
          internals.ships[i] = uAr(internals.ships[i]).sort(function (a,b) {return getModel(a) - getModel(b)})
        }

        let results = [];

        let parsed_code = [...internals.names.entries()].find(entry => entry[1].toLowerCase() === ship_name.toLowerCase());
        if (parsed_code) parsed_code = parsed_code[0];
        else parsed_code = Number(ship_name);

        let submitPath = function(path) {
          if (path.length > 0) results.push([...path])
        }

        let getNextShipCodes = function (code, level, path) {
          code = getNum(code);
          if (code === parsed_code) return submitPath(path);
          let custom_next = internals.nexts.get(code);
          let nextLevel = Number(level) + 1;
          if (Array.isArray(custom_next)) {
            let cnext = [], ships = Object.values(internals.ships).flat();
            for (let type of custom_next) {
              if (ships.indexOf(type) != -1) cnext.push(type);
            }
            return uAr(cnext).forEach((ship, i) => getNextShipCodes(ship, nextLevel, [...path, [level, ship, i]]));
          }
          else {
            let next_ships = internals.ships[nextLevel];
            if (!next_ships) return;
            let current_ships = internals.ships[level];
            let model = code - level * 100 - 1;
            let alpha = Math.max(0, Math.round(model / Math.max(current_ships.length - 1, 1) * (next_ships.length - 2)));
            return next_ships.slice(alpha, alpha + 2).forEach((ship, i) => getNextShipCodes(ship, nextLevel, [...path, [level, ship, i]]));
          }
          return
        }

        for (let i of internals.ships[1]) getNextShipCodes(i, 1, [[1,i,null]]);

        console.log(results);

        let res_text = `<b>${results.length>0?results.length:"No"} result${results.length!=1?"s":""} found</b>`;

        res_text += results.map((path, i) => `<h3>Path ${i+1}</h3><table><tr><th>Tier</th>${path.map(v => "<th>" + v[0] + "</th>")}</tr><tr><th>Ship name</th>${path.map(v => "<tr>"+internals.name.get(v[1])+"</tr>")}</tr><tr><th>Ship code</th>${path.map(v => "<tr>"+v[1]+"</tr>")}</tr><tr><th>Upgrade option</th>${path.map(v => v[2] == null ? "Starting ship" : (v[2] == 0?"0 (Left)":"9 (Right)"))}</tr></table>`);

        showResults(res_text);
      }).catch(function(e){showError("Connection failed.")})
    }
  }

  let queries = decodeURIComponent(location.search).slice(1).split("&").filter(i=>i).map(i=>{
    var t = i.split("=");
    return [t[0], t.slice(1, t.length).join("=")]
  }).reduce((a,b) => (a[b[0]] = b[1],a), {})

  if (queries.hidetitle == "true") $("#title").remove();
  $("#lookup").on("click",findPath);
})();
