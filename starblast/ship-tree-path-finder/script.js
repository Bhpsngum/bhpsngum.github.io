(function() {
    let showError = function(text) {
        target.css("color", "red");
        target.html(text)
    }
    let showResults = function(html) {
        target.css("color", "");
        target.html(html)
    }
    let uAr = function(array, noSort) {
        let res = Array.from(new Set(array));
        if (noSort) return res;
        return res.sort(function(a, b) { return a - b })
    }
    let getModel = function(code) {
        code = getNum(code);
        let t = internals.models.get(code);
        if (code != null) return t;
        return code % 100
    }
    let getNum = function(num) {
        let n = Number(num);
        return isNaN(n) ? num : n
    }

    let submitPath = function(path) {
        if (path.length > 0) results.push([...path])
    }

    let getNextShipCodes = function(code, level, path) {
        code = getNum(code);
        if (code === parsed_code) return submitPath(path);
        let custom_next = internals.nexts.get(code);
        let nextLevel = Number(level) + 1;
        if (Array.isArray(custom_next)) {
            let cnext = [],
                ships = Object.values(internals.ships).flat();
            for (let type of custom_next) {
                if (ships.indexOf(type) != -1) cnext.push(type);
            }
            return uAr(cnext).forEach((ship, i) => getNextShipCodes(ship, nextLevel, [...path, [nextLevel, ship, i]]));
        } else {
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
    let treeSelect = $("#tree-select");

    let target = $("#results");
    let loadTree = function(value, init = false) {
        mod_name = value || treeSelect.val();
        let link;
        switch (mod_name) {
            case "mcst_t7_ver":
            case "mcst_beta":
                link = "https://raw.githubusercontent.com/Bhpsngum/starblast-snippets/master";
                break;
            case "strawberry":
            case "vanilla":
            case "kest":
                link = "https://raw.githubusercontent.com/pmgl/starblast-modding/master";
                break;
            default:
                link = "https://starblast.data.neuronality.com";
        }
        link += "/mods/" + mod_name + ".js";
        if (mod_name) {
            showResults("Loading ship tree...");
            if (!init) {
                let newURL = new URL(location.href);
                newURL.searchParams.set("query", shipInput.val());
                newURL.searchParams.set("mod", mod_name);

                newURL = newURL.toString();
                window.history.pushState({ path: newURL }, '', newURL);
            }
            $.get(link).then(function(mod_code) {
                let game = { custom: {} }
                for (let i of ["addAlien", "addAsteroid", "addCollectible", "setObject", "setCustomMap", "setUIComponent", "removeObject"]) game[i] = function() {}
                Function("game", mod_code).call(game, game);

                let default_specs = [
                    [101, "Fly"],
                    [201, "Delta-Fighter"],
                    [202, "Trident"],
                    [301, "Pulse-Fighter"],
                    [302, "Side-Fighter", [403, 404]],
                    [303, "Shadow X-1"],
                    [304, "Y-Defender"],
                    [401, "Vanguard"],
                    [402, "Mercury"],
                    [403, "X-Warrior"],
                    [404, "Side-Interceptor"],
                    [405, "Pioneer"],
                    [406, "Crusader"],
                    [501, "U-Sniper"],
                    [502, "FuryStar"],
                    [503, "T-Warrior"],
                    [504, "Aetos"],
                    [505, "Shadow X-2"],
                    [506, "Howler"],
                    [507, "Bat-Defender"],
                    [601, "Advanced-Fighter"],
                    [602, "Scorpion"],
                    [603, "Marauder"],
                    [604, "Condor"],
                    [605, "A-Speedster"],
                    [606, "Rock-Tower"],
                    [607, "Barracuda"],
                    [608, "O-Defender"],
                    [701, "Odyssey"],
                    [702, "Shadow X-3"],
                    [703, "Bastion"],
                    [704, "Aries"]
                ];

                let default_options = {
                    ships: game.options.reset_tree ? [] : Array(8).fill(0).map((i, j) => default_specs.filter(s => Math.trunc(s[0] / 100) === j).map(i => i[0])),
                    nexts: new Map(game.options.reset_tree ? [] : default_specs.filter(s => s[2]).map(i => [i[0], i[2]])),
                    names: new Map(game.options.reset_tree ? [] : default_specs.map(i => [i[0], i[1]])),
                    models: new Map(),
                    levels: new Map(game.options.reset_tree ? [] : default_specs.map(i => [i[0], { level: Math.trunc(i[0] / 100), model: i[0] % 100 }]))
                }
                game.custom.ships = default_options;
                internals = game.custom.ships;
                if (Array.isArray(game.options.ships))
                    for (let ship of game.options.ships) {
                        try {
                            let prs = JSON.parse(ship);
                            let code = getNum(prs.typespec.code);
                            let next = getNum(prs.typespec.next);
                            let level = getNum(prs.typespec.level);
                            if (!Array.isArray(internals.ships[level])) internals.ships[level] = [];
                            internals.ships[level].push(code);
                            internals.names.set(code, prs.name.replace(/_/g, " "));
                            internals.levels.set(code, { level: prs.level, model: prs.model });
                            if (prs.typespec.model !== (code % 100)) internals.models.set(code, prs.typespec.model);
                            let cnxt = uAr(Array.isArray(next) ? next : []);
                            if (cnxt.length > 0) internals.nexts.set(code, cnxt)
                        } catch (e) {
                            game.custom.ships = default_options;
                            internals = game.custom.ships;
                            break
                        }
                    }
                for (let i in internals.ships) {
                    internals.ships[i] = uAr(internals.ships[i]).sort(function(a, b) {
                        let al = internals.levels.get(a) || {},
                            bl = internals.levels.get(b) || {};
                        return getNum(al.model) - getNum(bl.model);
                    })
                }
                shipSelect.html([...internals.names.entries()].sort(function(a, b) {
                    let al = internals.levels.get(a[0]) || {},
                        bl = internals.levels.get(b[0]) || {};
                    let t = getNum(al.level) - getNum(bl.level);
                    if (t != 0) return t;
                    return getNum(al.model) - getNum(bl.model);
                }).map(name => {
                    let levels = internals.levels.get(name[0]);
                    return `<a id="${name[0]}" href="javascript:void 0" onclick="$('#ship-input').val('${name[1]}')">(L${getNum(levels.level)} - M${getNum(levels.model)}) ${name[1]}</a>`
                }).join(""));

                filter();

                if (shipInput.val()) findPath(init);
                else showResults("Ship tree successfully loaded.");
            }).catch(function(e) { showError("Failed to get ship tree info"); })
        }
    }

    let filter = function() {
        let input = shipInput;
        let filter = input.val().toUpperCase().replace(/[^0-9A-Z]/gi, " ");
        let a = $("#ship-select>a");
        for (let e of a) $(e).css("display", e.id.indexOf(filter) > -1 || (e.textContent || e.innerText).toUpperCase().replace(/[^0-9A-Z]/gi, " ").indexOf(filter) > -1 ? "" : "none")
    }

    let findPath = function(init = false) {
        let ship_name = shipInput.val();
        if (!ship_name || !mod_name) {
            if (!mod_name) showError("Please choose a ship tree to lookup");
            else showError("Please enter a ship to lookup")
        } else {
            if (!init) {
                let newURL = new URL(location.href);
                newURL.searchParams.set("query", ship_name || "");
                newURL.searchParams.set("mod", mod_name || "");

                newURL = newURL.toString();
                window.history.pushState({ path: newURL }, '', newURL);
            }
            results = [];

            parsed_code = [...internals.names.entries()].find(entry => entry[1].toLowerCase() === ship_name.toLowerCase());
            if (parsed_code) parsed_code = parsed_code[0];
            else parsed_code = Number(ship_name);

            let starting_ships = internals.ships[1];

            for (let i of starting_ships) getNextShipCodes(i, 1, [
                [1, i, null]
            ]);

            let res_text = `<b>${results.length>0?results.length:"No"} result${results.length!=1?"s":""} found</b>`;

            res_text += results.map((path, i) => `<br></br><h3>Path ${i+1}</h3><table><tr><th>Level</th>${path.map(v => "<th style='width:" + 85/path.length + "%'>" + v[0] + "</th>").join("")}</tr><tr><th>Ship name</th>${path.map(v => "<td>"+internals.names.get(v[1]).replace(/\w+/g,v=>v[0].toUpperCase()+v.slice(1))+"</td>").join("")}</tr><tr><th>Ship code</th>${path.map(v => "<td>"+v[1]+"</td>").join("")}</tr><tr><th>Upgrade option</th>${path.map(v => "<td>"+(v[2] == null ? ("Starting ship" + (starting_ships.length > 1 ? (" " + (starting_ships.indexOf(v[1]) + 1)) : "")) : (v[2] != 0?"0 (Right)":"9 (Left)"))+"</td>").join("")}</tr></table>`).join("");

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
        if ([38, 40].indexOf(event.keyCode) == -1) return;
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

    let queries = decodeURIComponent(location.search).slice(1).split("&").filter(i => i).map(i => {
        var t = i.split("=");
        return [t[0], t.slice(1, t.length).join("=")]
    }).reduce((a, b) => (a[b[0]] = b[1], a), {});

    if (queries.hidetitle == "true") $("#title").remove();
    treeSelect.on("change", () => loadTree());

    shipInput.on("focus", function() {
        if (shipSelect.children().length > 0) {
            shipSelect.addClass("show");
            filter();
        }
    });

    let shipChoose = $("#ship-choose");

    for (let event of ["click", "focus"]) {
        $(document).on(event, "*", function(e) {
            e.stopPropagation();
            let display = ($.contains(shipChoose[0], e.target) && (e.type !== "click" || !$.contains(shipSelect[0], e.target))) ? "" : "none";
            if (display === "" && shipSelect.children().length > 0) {
                shipSelect.addClass("show");
            } else {
                shipSelect.removeClass("show");
            }
        });
    }

    for (let event of ["propertychange", "input"]) {
        shipInput.on(event, filter);
    }
    shipChoose.on("keydown", focusControl);
    $("#lookup").on("click", () => findPath());
    $(window).on("keydown", function(event) {
        if ((event.ctrlKey || event.metaKey) && event.keyCode == 13) findPath();
    });
    addToolPage(null, "1%", "1%", null);

    let search = new URL(location.href).searchParams;

    if (search.has("mod")) {
        let mod_name = search.get("mod").toLowerCase();
        let available_values = [...treeSelect[0].options].slice(1).map(e => e.value);
        if (available_values.includes(mod_name)) {
            treeSelect.val(mod_name);
            let hasQuery = search.has("query");
            if (hasQuery) shipInput.val(search.get("query"));
            loadTree(mod_name, true);
        }
    }
})();
