(function(){
  let joinData = function(array, isHeader, attr) {
    let tag = isHeader ? "th" : "td"
    return `<tr custom="${attr||""}">`+array.map(v => `<${tag}>${v}</${tag}>`).join("")+"</tr>"
  }, basicrev = function (j) {
    return j.replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/'/g,"&apos;").replace(/"/g,"&quot;");
  }, rev = function(k){
    return k.replace(/<|>|'|"|(\[(.+)\]\((.+)\))/g,function(a,b,c,d){
      let s = "";
      if (a.length > 1) {
        s+=`<a href="${encodeURL(d)}">`;
        a=c;
      }
      return s+basicrev(a)+(s?"</a>":"");
    }).replace(/\*\*([^\*]+)\*\*/g, (a, b) => "<b>" + basicrev(b) + "</b>");
  }, encodeURL = function (url) {
    return url.replace(/"/g,"%22").replace(/'/g,"%27").replace(/</g,"%3C").replace(/>/g,"%3E")
  }, encodeHTML = function (str, key, flags, replacer, isDescriptive) {
    let result;
    if (!key) result = rev(str);
    else {
      let t = [], f = 0, link = /\[(.+)\]\((.+)\)/g;
      str.replace(link,function(a,b,c,i){t.push(["none",str.slice(f,i)],["link",a]);f=i+a.length});
      if (f<str.length) t.push(["none",str.slice(f,str.length)]);
      t = t.filter(i=>i[1]);
      for (let i=0;i<t.length;i++) {
        if (t[i][0] == "none") {
          let tx = [], fx = 0, st = t[i][1];
          st.replace(key,flags,function(a,j){tx.push(["none",st.slice(fx,j)],["result",a]);fx=j+a.length});
          if (fx<st.length) tx.push(["none",st.slice(fx,st.length)]);
          t[i][1] = tx.map(i=>i[0]=="result"&&typeof replacer=="function"?replacer(rev(i[1])):rev(i[1])).join("");
        }
        else t[i][1] = t[i][1].replace(link,function(a,b,c){return `<a href="${encodeURL(b)}">${basicrev(a)}</a>`});
      }
      result = t.map(i=>i[1]).join("");
    }
    return isDescriptive ? result.replace(/\n/g,"<br>") : result
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
      let servername = encodeHTML(server.name + (server.tag ? ` [${server.tag}]` : "")),
      how_to_join = encodeHTML(server.how_to_join),
      active_regions = server.active_regions.length == 0 ? ["Unspecified"] : server.active_regions,
      description = server.description || "No description.";
      how_to_join = how_to_join ? (server.public_invite ? `<a target="_blank" href = "${how_to_join}">${how_to_join}</a>` : how_to_join) : "Unknown";
      serversList.append(joinData([`<img crossorigin="Anonymous" src="${encodeHTML(server.icon)}">`, servername, server.type.map(i => firstCap(encodeHTML(i))).join(", "), active_regions.map(basicrev).join(", "), encodeHTML(description), how_to_join], false, server.active_regions.join("||")+"&&"+server.type.join("||")));
      $("#servers-list> :last-child> :nth-child(5)").on("click", function(){showModal("Description", encodeHTML(description, null, null, null, true))});
      $("#servers-list> :last-child> :nth-child(6)").on("click", function(){showModal("How to join", how_to_join)})
    }
  }).fail(e => alert("Failed! Please reload the page!"));
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
