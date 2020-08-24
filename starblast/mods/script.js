(function(){
  var namespace = ["name","author"];
  var ModInfo = function(data)
  {
    var state = ["down","private","active"][data.link.state||0];
    this.html = `<div class="ModTab" id='${data.name||"unkonwn"}'>
      <div style="float:left"><img src="${data.img||"img/default.png"}"></div>
      <table>
        <tr><td><h3><a class="${state}" title="This link is currently ${state}" ${(data.link.url)?("href='"+data.link.url+"'"):""} target="_blank">${data.name}<sup>${data.version||""}</sup></a></h3></th></tr>
        <tr><td><h5>${data.author.map(data => `<a ${(data.link)?("href='"+data.link+"'"):""} target="_blank">${(data.name||[]).join("/")}</a>`).join()}</h5></td></tr>
        ${(data.official)?("<tr "+(data.official<2)?"style='color:yellow'":""+" title='This "+(data.official<2)?"is currently":"used to be"+" an official mod in Modding Space'><td><p><i class='fa fa-fw fa-star'></i>Official mod</p></td></tr>"):""}
        <tr><td><p><b>Game Mode(s): </b>${data.modes||"Unspecified"}</p></td></tr>
        <tr><td><p>${data.description||"No description provided."}</p></td></tr>
      </table>
    </div>`;
  }
  function loadError()
  {
    alert("Fetch failed :(\nPlease reload the page and try again!");
  }
  function performSearch()
  {
    let data = [];
    for (let name of namespace)
    {
      let d = $("#"+name).val();
      (d) && data.push(name+"="+d);
    }
    data.unshift("search");
    window.open(encodeURI("?"+data.join("&")),"_self");
  }
  $("#search").on("click", performSearch);
  function processData(mods, response)
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
      for (let i in key) $("#"+i).val(key[i]||"");
      if ($.isEmptyObject(key)) window.history.pushState({path:`${window.location.protocol}//${window.location.host}${window.location.pathname}`},'',`${window.location.protocol}//${window.location.host}${window.location.pathname}`);
      else $('title')[0].innerHTML = "Search results - "+$('title')[0].innerHTML;
      let res = mods.filter(x => {
        let t=!key.author;
        if (!t)
          Search: for (let y of x.author)
            for (let z of y.name)
              if (t=z.toLowerCase().includes(key.author),t) break Search;
        return (!key.name || x.name.toLowerCase().includes(key.name)) && t;
      });
      res.map(mod => {$("#modsinfo").append(new ModInfo(mod).html)});
      $("#lastModified").append(new Date(response.getResponseHeader("last-Modified")).toString());
      $("#results").html((res.length)?`Found ${res.length} mod${(res.length>1)?"s":""}`:"No mods found");
    }
    else loadError();
  }
  $.getJSON("modsinfo.json").done((json,a,resp) => {processData(json.data,resp)}).fail(loadError);
  namespace.map(x => {$("#"+x).on("keydown",function(e){(e.which == 13 && e.ctrlKey) && performSearch()})});
  let states=["dark","light"];
  if (!window.matchMedia) document.querySelector("link").href=`icon_light.png`;
  else for (let state of states) if (window.matchMedia(`(prefers-color-scheme: ${state})`).matches) document.querySelector("link").href=`icon_${state}.png`;
  console.log('%c Stop!!', 'font-weight: bold; font-size: 100px;color: red; text-shadow: 3px 3px 0 rgb(217,31,38)');
  console.log('%cYou are accessing the Web Developing Area.\n\nPlease do not write/copy/paste/run any scripts here (unless you know what you\'re doing) to better protect yourself from loosing your map data, and even your other sensitive data.\n\nWe will not be responsible for any problems if you do not follow the warnings.', 'font-weight: bold; font-size: 15px;color: grey;');
})();
