(function(){
  let joinData = function(array, isHeader) {
    let tag = isHeader ? "th" : "td"
    return "<tr>"+array.map(v => `<${tag}>${v}</${tag}>`).join("")+"</tr>"
  }, basicrev = function (j) {
    return j.replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/'/g,"&apos;").replace(/"/g,"&quot;");
  }
  let headers = joinData(["Icon", "Server Name", "Server Type", "Active Region(s)", "Description", "Public Invite?", "Invite Link", "How to join"], true);
  $.getJSON("servers.json").then(function (data){
    $("#clans-list").html(headers+data.sort((a,b) => a.name < b.name ? -1 : 1).map(clan => joinData([`<img src="${basicrev(clan.icon)}">`, basicrev(clan.name), `[${basicrev(clan.tag)}]`, clan.active_regions.join(", "), basicrev(clan.description || "No description"), clan.invite_open ? "yes" : "no", clan.invite_open ? `<a target="_blank" href = "${basicrev(clan.invite_link)}">${basicrev
      (clan.invite_link)}</a>` : "", clan.invite_open ? "" : (basicrev(clan.how_to_apply) || "Unknown")])))
  }).fail(e => alert("Failed! Please reload the page again!"))
})();
