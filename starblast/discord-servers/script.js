(function(){
  let joinData = function(array, isHeader) {
    let tag = isHeader ? "th" : "td"
    return "<tr>"+array.map(v => `<${tag}>${v}</${tag}>`).join("")+"</tr>"
  }, basicrev = function (j) {
    return String(j).replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/'/g,"&apos;").replace(/"/g,"&quot;");
  }, servertypes = ["server", "event", "mod", "others"], regions = ["Asia-Australia", "America", "Brazil", "Europe"];
  let headers = joinData(["Icon", "Server Name", "Server Type", "Active Region(s)", "Description", "How to join"], true);
  $.getJSON("servers.json").then(function (data){
    $("#servers-list").html(headers+data.sort((a,b) => a.name < b.name ? -1 : 1).map(server => {
      let servername = basicrev(server.name + (server.tag ? ` [${server.tag}]` : "")), servertype = basicrev(server.type);
      return joinData([`<img src="${basicrev(server.icon)}">`, servername, servertype.slice(0,1).toUpperCase()+servertype.slice(1), server.active_regions.join(", "), basicrev(server.description || "No description"), server.public_invite ? `<a target="_blank" href = "${basicrev(server.how_to_join)}">${basicrev
      (server.how_to_join)}</a>` : (basicrev(server.how_to_join) || "Unknown")])
    }).join(""))
  }).fail(e => alert("Failed! Please reload the page again!"))
})();
