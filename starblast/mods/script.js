var namespace = ["name","author"];
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
  alert("Fetch failed :(\nPlease reload the page and try again!");
}
$("#search").on("click", function(){
  let data = [];
  for (let name of namespace)
  {
    let d = $("#"+name).val();
    (d) && data.push(name+"="+d);
  }
  data.unshift("search");
  window.open(encodeURI("?"+data.join("&")),"_self");
});
function processData(mods)
{
  if (Array.isArray(mods))
  {
    let spc = decodeURI(window.location.search).toLowerCase().split("&"), key = {}, reg = namespace.map(x => new RegExp("^"+x+"=")), d=spc.shift().substring(1);
    switch(d)
    {
      case "search":
        spc.map(x => {
          for (let i=0;i<reg.length;i++)
          {
            if (reg[i].test(x))
            {
              key[namespace[i]] = x.replace(reg[i],"");
              return;
            }
          }
        });
        break;
    }
    for (let i in key) $("#"+i).val(key[i]);
    let res = mods.filter(x => {
      let t=!key.author;
      if (!t)
        Search: for (let y of x.author)
          for (let z of x.name)
            if (t=z.toLowerCase().includes(key.author),t) break Search;
      return (!key.name || x.name.toLowerCase().includes(key.name)) && t;
    });
    for (let mod of res) $("#modsinfo").append(new ModInfo(mod).html);
    $("#results").html((res.length)?`Found ${res.length} mod${(res.length>1)?"s":""}`:"No mods found");
  }
  else loadError();
}
$.getJSON("modsinfo.json").done((json) => {processData(json.data)}).fail(loadError);
