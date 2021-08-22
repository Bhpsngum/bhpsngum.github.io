(function(){
  let showError = function(text) {
    target.css("color", "red");
    target.html(text)
  }
  let showResults = function(html) {
    target.css("color","");
    target.html(html)
  }
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
      return uAr(cnext).forEach((ship, i) => getNextShipCodes(ship, nextLevel, [...path, [nextLevel, ship, i]]));
    }
    else {
      let next_ships = internals.ships[nextLevel];
      if (!next_ships) return;
      let current_ships = internals.ships[level];
      let model = code - level * 100 - 1;
      let alpha = Math.max(0, Math.round(model / Math.max(current_ships.length - 1, 1) * (next_ships.length - 2)));
      return next_ships.slice(alpha, alpha + 2).forEach((ship, i) => getNextShipCodes(ship, nextLevel, [...path, [nextLevel, ship, i]]));
    }
    return
  }

  let internals, mod_name, parsed_code, results;
  let shipInput = $("#ship-input");
  let shipSelect = $("#ship-select");

  let target = $("#results");
  let loadTree = function (){
    mod_name = $("#tree-select").val();
    let link;
    if (["vanilla", "kest"].indexOf(mod_name) != -1) link = "https://raw.githubusercontent.com/Bhpsngum/starblast/master";
    else link = "https://starblast.data.neuronality.com";
    link += "/mods/" + mod_name + ".js";
    if (mod_name) {
      $.get(link).then(function(mod_code){
        let game = {custom: {}}
        for (let i of ["addAlien","addAsteroid","addCollectible","setObject","setCustomMap","setUIComponent","removeObject"]) game[i] = function(){}
        Function("game", mod_code).call(game, game);
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
              internals.names.set(code, prs.name.replace(/_/g," "));
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
        shipSelect.html([...internals.names.entries()].sort((a,b)=>a[0]-b[0]).map(name => `<a id="${name[0]}" href="javascript:void 0" onclick="$('#ship-input').val('${name[1]}')">(${name[0]}) ${name[1]}</a>`).join(""));

        filter()
      }).catch(function(e){showError("Failed to get ship tree info")})
    }
  }

  let filter = function() {
    let input = shipInput;
    let filter = input.val().toUpperCase().replace(/[^0-9A-Z]/gi," ");
    let a = $("#ship-select>a");
    for (let e of a) $(e).css("display", e.id.indexOf(filter) > -1 || (e.textContent || e.innerText).toUpperCase().replace(/[^0-9A-Z]/gi," ").indexOf(filter) > -1 ? "" : "none")
  }

  let findPath = function () {
    let ship_name = shipInput.val();
    if (!ship_name || !mod_name) {
      if (!mod_name) showError("Please choose a ship tree to lookup");
      else showError("Please enter a ship to lookup")
    }
    else {
      results = [];

      parsed_code = [...internals.names.entries()].find(entry => entry[1].toLowerCase() === ship_name.toLowerCase());
      if (parsed_code) parsed_code = parsed_code[0];
      else parsed_code = Number(ship_name);

      let starting_ships = internals.ships[1];

      for (let i of starting_ships) getNextShipCodes(i, 1, [[1,i,null]]);

      let res_text = `<b>${results.length>0?results.length:"No"} result${results.length!=1?"s":""} found</b>`;

      res_text += results.map((path, i) => `<br></br><h3>Path ${i+1}</h3><table><tr><th>Tier</th>${path.map(v => "<th style='width:" + 85/path.length + "%'>" + v[0] + "</th>").join("")}</tr><tr><th>Ship name</th>${path.map(v => "<td>"+internals.names.get(v[1]).replace(/\w+/g,v=>v[0].toUpperCase()+v.slice(1))+"</td>").join("")}</tr><tr><th>Ship code</th>${path.map(v => "<td>"+v[1]+"</td>").join("")}</tr><tr><th>Upgrade option</th>${path.map(v => "<td>"+(v[2] == null ? ("Starting ship" + (starting_ships.length > 1 ? (" " + (starting_ships.indexOf(v[1]) + 1)) : "")) : (v[2] != 0?"0 (Right)":"9 (Left)"))+"</td>").join("")}</tr></table>`).join("");

      showResults(res_text);
    }
  }

  let locate = function(dir) {
    dir = Math.sign(dir) || 1;
    let cFocus = $(":focus")[0];
    let list = Array.prototype.filter.call(shipSelect.children(), e => $(e).css("display") != "none");
    if (list.length == 0) return;
    let placeholder = list[dir < 0 ? list.length - 1 : 0];
    let fIndex = list.indexOf(cFocus);
    if (fIndex == -1) cFocus = placeholder;
    else cFocus = list[fIndex + dir] || placeholder;
    cFocus.focus()
  }

  let focusControl = function(event) {
    if ([38,40].indexOf(event.keyCode) == -1) return;
    event.preventDefault();
    switch (event.keyCode) {
      case 38: // up
        locate(-1);
        break;
      case 40: // down
        locate(1);
        break;
    }
  }

  let queries = decodeURIComponent(location.search).slice(1).split("&").filter(i=>i).map(i=>{
    var t = i.split("=");
    return [t[0], t.slice(1, t.length).join("=")]
  }).reduce((a,b) => (a[b[0]] = b[1],a), {});

  if (queries.hidetitle == "true") $("#title").remove();
  $("#tree-select").on("change", loadTree);
  shipInput.on("focus", function(){
    shipSelect.css("display","");
    filter()
  });

  let shipChoose = $("#ship-choose");

  for (let event of ["click", "focus"]) $(document).on(event, "*", function(e) {
    e.stopPropagation();
    let display = ($.contains(shipChoose[0], e.target) && (e.type !== "click" || !$.contains(shipSelect[0], e.target))) ? "" : "none";
    shipSelect.css("display", display)
  });
  for (let event of ["propertychange", "input"]) shipInput.on(event, filter);
  shipChoose.on("keydown", focusControl);
  $("#lookup").on("click",findPath);
  $(window).on("keydown", function(event) {
    if (event.ctrlKey && event.keyCode == 13) findPath()
  })
})();
