var ModInfo = function(data)
{
  return `<div class="ModTab" id='${data.name||"unkonwn"}'>
    <table>
      <tr><td><h3><a href="${data.link.url}">${data.name}<sup>${data.version||""}</sup></a></h3></th></tr>
      <tr><td><h5><a href="${data.author.link||""}">${data.author.name}</a></h5></td></tr>
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
    for (let mod of mods) $("#modsinfo").append(ModInfo(mod));
  }
  else loadError();
}
$.getJSON("modsinfo.json").done((json) => {processData(json.data)}).fail(loadError);
