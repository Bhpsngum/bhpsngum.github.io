var ModInfo = function(data)
{
  var state = ["down","private","active"][data.link.state||0];
  this.html = `<div class="ModTab" id='${data.name||"unkonwn"}'>
    <div style="float:left"><img src="${data.img||"img/default.png"}"></div>
    <table>
      <tr><td><h3><a class="${state}" title="This link is currently ${state}" href="${data.link.url}">${data.name}<sup>${data.version||""}</sup></a></h3></th></tr>
      <tr><td><h5>${data.author.map(data => `<a href="${data.link||""}">${(data.name||[]).join("/")}</a>`).join()}</h5></td></tr>
      ${(data.official)?"<tr title='This is currently an official mod in Modding Space'><td><p>Official mod</p></td></tr>":""}
      <tr><td><p><b>Game Mode(s): </b>${data.modes||"Unspecified"}</p></td></tr>
      <tr><td><p>${data.description||"No description provided"}</p></td></tr>
    </table>
  </div>`;
}
function loadError()
{
  console.log("Fetch failed");
}
function processData(mods)
{
  if (Array.isArray(mods))
  {
    for (let mod of mods) $("#modsinfo").append(new ModInfo(mod).html);
  }
  else loadError();
}
$.getJSON("modsinfo.json").done((json) => {processData(json.data)}).fail(loadError);
