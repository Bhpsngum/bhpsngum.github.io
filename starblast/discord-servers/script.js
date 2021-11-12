(function(){
  let joinData = function(array, isHeader, attr) {
    let tag = isHeader ? "th" : "td"
    return `<tr custom="${attr||""}">`+array.map(v => `<${tag}>${v}</${tag}>`).join("")+"</tr>"
  }, basicrev = function (j) {
    return String(j).replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/'/g,"&apos;").replace(/"/g,"&quot;");
  }, firstCap = function(str) {
    return str.slice(0,1).toUpperCase()+str.slice(1)
  }, saveLocal = function (name, value) {
    return localStorage.setItem(name, JSON.stringify(value))
  }, loadLocal = function (name, value) {
    let item = localStorage.getItem(name);
    try { return JSON.parse(item) } catch (e) { return item }
  }, showModal = function(title, text) {
    $("#modaltitle").html(title);
    $("#modalcontent").html(text);
    $("#blocker").css("display", "")
  }, hideModal = function() {
    $("#modaltitle").html("");
    $("#modalcontent").html("");
    $("#blocker").css("display", "none")
  }, checkSelections = function (init) {
    let selectedRegions = {}, selectedServerTypes = {};
    if (init) {
      selectedRegions = loadLocal('ds-selected-regions') || {}
      selectedServerTypes = loadLocal('ds-selected-server-types') || {}
    }
    let verify = init ? True : checked;
    for (let region of regions) {
      let res = verify(region, selectedRegions);
      selectedRegions[region] = res;
      $("#show"+region).prop("checked", res)
    }
    for (let servertype of servertypes) {
      let res = verify(servertype, selectedServerTypes);
      selectedServerTypes[servertype] = res;
      $("#show"+servertype).prop("checked", res)
    }
    for (let elem of $("#servers-list tr")) {
      let $elem = $(elem), custom = String($elem.attr("custom")), shown = custom == "headers";
      if (!shown) {
        custom = custom.split('&&').map(t => t.split("||"));
        let reg = custom[0], typ = custom[1];
        shown = reg.find(c => selectedRegions[c]) && typ.find(c => selectedServerTypes[c])
      }
      $elem.css("display", shown ? "table-row" : "none")
    }
    saveLocal('ds-selected-regions', selectedRegions);
    saveLocal('ds-selected-server-types', selectedServerTypes)
  }, checked = function(name) {
    let el = $("#show"+name);
    return el.length == 0 || el.is(":checked")
  }, True = function (name, obj) {
    let val = obj[name];
    return val == null || !!val
  }, servertypes = ["clan", "event", "mod", "group", "others"], regions = ["Asia-Australia", "America", "Brazil", "Europe", "Unspecified"];
  let headers = joinData(["Icon", "Server Name", "Server Type(s)", "Active Region(s)", "Description", "How to join"], true, "headers");
  $.getJSON("servers.json").then(function (data){
    let serversList = $("#servers-list");
    serversList.html(headers);
    for (let server of data.sort((a,b) => a.name < b.name ? -1 : 1)) {
      let servername = basicrev(server.name + (server.tag ? ` [${server.tag}]` : "")),
      how_to_join = basicrev(server.how_to_join),
      active_regions = server.active_regions.length == 0 ? ["Unspecified"] : server.active_regions,
      description = basicrev(server.description || "No description.");
      how_to_join = how_to_join ? (server.public_invite ? `<a target="_blank" href = "${how_to_join}">${how_to_join}</a>` : how_to_join) : "Unknown";
      serversList.append(joinData([`<img crossorigin="Anonymous" src="${basicrev(server.icon)}">`, servername, server.type.map(i => firstCap(basicrev(i))).join(", "), active_regions.map(basicrev).join(", "), description, how_to_join], false, server.active_regions.join("||")+"&&"+server.type.join("||")));
      $("#servers-list> :last-child> :nth-child(5)").on("click", function(){showModal("Description", description)});
      $("#servers-list> :last-child> :nth-child(6)").on("click", function(){showModal("How to join", how_to_join)})
    }
  }).fail(e => alert("Failed! Please reload the page again!"));
  for (let region of regions) {
    let id = "show" + region;
    $("#regions").append(`<input type='checkbox' id='${id}'><label for='${id}'>${region}</label>`);
    $("#"+id).on("change", function(){checkSelections()})
  }
  for (let servertype of servertypes) {
    let id = "show" + servertype;
    $("#servertypes").append(`<input type='checkbox' id='${id}'><label for='${id}'>${firstCap(servertype)}</label>`);
    $("#"+id).on("change", function(){checkSelections()})
  }
  for (let id of ["blocker", "close"]) $("#"+id).on("click", function(e) {
    if (e.target === e.currentTarget) hideModal()
  });
  checkSelections(true);
  addToolPage(null,"1%","1%",null)
})();
