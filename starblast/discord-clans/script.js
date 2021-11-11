(function(){
  let joinData = function(array, isHeader) {
    let tag = isHeader ? "th" : "td"
    return "<tr>"+array.map(v => `<${tag}>${v}</${tag}>`).join("")+"</tr>"
  }
  let headers = joinData(["Icon", "Clan Name", "Clan Tag", "Active Region(s)", "Description", "Public Invite?", "Invite Link", "How to join"], true);
  $.getJSON("clans.json").then(function (data){
    $("#clans-list").html(headers+data.sort((a,b) => a.name < b.name ? -1 : 1).map(clan => joinData([`<img src="${clan.icon}">`, clan.name, `[${clan.tag}]`, clan.active_regions.join(", "), clan.description || "No description", clan.invite_open ? "yes" : "no", clan.invite_open ? `<a target="_blank" href = "${clan.invite_link}">${clan.invite_link}</a>` : "", clan.invite_open ? "" : (clan.how_to_apply || "Unknown")])))
  }).fail(e => alert("Failed! Please reload the page again!"))
})();
