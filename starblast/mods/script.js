var ModInfo = function(data)
{
  return
  `<div class="ModTab" id='${data.name||"unkonwn"}'>
    <a href="${data.link.url}"><h4>${data.name}</h4></a>
    <h5 class="version">${data.version||""}</h5><br>
    <a href="${data.author.link||""}"><h6>${data.author.name}</h6></a>
  </div>`
}
function processData(json)
{
  console.log(json);
}
$.getJSON("modsinfo.json").done((json) => {processData(json.data)}).fail(() => {console.log("Fetch failed")});
