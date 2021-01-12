(function(){
  var namespace = ["name","author"], domain = `${window.location.protocol}//${window.location.host}${window.location.pathname}`, key = {}, modsinfo, lastDate;
  var ModInfo = function(data,key)
  {
    var state = ["down","private","active"][data.link.state||0], name=(data.name+((data.abbreviation)?` (${data.abbreviation})`:""));
    this.html = `<div class="ModTab" id='${data.name||"unknown"}'>
      <div style="float:left"><img src="${data.img||"img/default.png"}"></div>
      <table>
        <tr><td><h3><a class="${state}" title="This link is currently ${state}" ${encodeURI((data.link.url)?("href='"+data.link.url+"'"):"")} target="_blank">${(encodeHTML(key.name?name.replace(key.name,"gi",function(v){return `<mn>${v}</mn>`}):name)}${displayVer(data)}</a></h3></th></tr>
        <tr><td><h5>${data.author.map(data => `<a ${encodeURI((data.link)?("href='"+data.link+"'"):"")} target="_blank">${(data.name||[]).map(data => encodeHTML(key.author?data.replace(key.author,"gi",function(v){return `<ma>${v}</ma>`}):data)).join("/")}</a>`).join()}</h5></td></tr>
        ${(data.official || data.event)?("<tr "+((data.official<2 && data.event<2)?"style='color:yellow'":"")+" title='This "+((data.official<2 && data.event<2)?"is currently":"used to be")+" an official "+((data.event)?"event":"mod in Modding Space")+"'><td><p><i class='fa fa-fw fa-star'></i>Official "+((data.event)?"event":"mod")+"</p></td></tr>"):""}
        <tr><td><p><b>Game Mode(s): </b>${data.modes||"Unspecified"}</p></td></tr>
        <tr><td><p>${encodeHTML(data.description||"No description provided.")}</p></td></tr>
      </table>
    </div>`;
  }
  function displayVer(mod) {
    if (!mod.version) return "";
    if (mod.event) return encodeHTML(" - "+mod.version);
    return `<sup>${encodeHTML(mod.version)}</sup>`;
  }
  function loadError()
  {
    let oldmodsinfo, oldDate, oldfail = 0;
    if (modsinfo && lastDate)
    {
      oldmodsinfo = modsinfo;
      oldDate = lastDate;
    }
    else {
      oldDate = localStorage.getItem("lastDate")||"Unknown";
      try {oldmodsinfo = JSON.parse(localStorage.getItem("modsinfo"))}
      catch(e){oldmodsinfo = {}}
    }
    processData(oldmodsinfo, null, oldDate);
    $("#status").html("You are accessing the local data due to internet connection problem");
    $("#status").prop("style","color:red;float:left");
    $("#refresh-ico").prop("class","fa fa-fw fa-refresh");
    $("#refresh-text").html("Refresh");
  }
  function processKey(a)
  {
    return a.toLowerCase();
  }
  function performSearch()
  {
    let data = [];
    for (let name of namespace)
    {
      let d = $("#"+name).val();
      if (d)
      {
        data.push(name+"="+d);
        key[name] = d;
      }
    }
    data.unshift("search");
    if (data.length > 1)
    {
      window.history.pushState({url:domain+encodeURI("?"+data.join("&"))},'',domain+encodeURI("?"+data.join("&")));
      fetch();
    }
  }
  $("#search").on("click", performSearch);
  $("#home").on("click",showAll);
  $("#refresh").on("click", function() {
    $("#refresh-ico").prop("class","fa fa-fw fa-refresh fa-spin");
    $("#refresh-text").html("Refreshing...");
    fetch();
  });
  function showAll()
  {
    key = {};
    window.history.pushState({path:domain},'',domain);
    fetch();
  }
  function encodeHTML(str) {
    return str.replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/'/g,"&apos;").replace(/"/g,"&quot;").replace(/\[(.+)\]\((.+)\)/g,"<a href='$2' target='_blank'>$1</a>");
  }
  function processData(mods, Aqua, response)
  {
    if (Array.isArray(mods))
    {
      try {
        mods.forEach(function(mod) {
          for (let i in mod)
            if (typeof mod[i] == "string") mod[i] = mod[i];
        });
        modsinfo = mods;
        localStorage.setItem("modsinfo",JSON.stringify(mods));
        $("#modsinfo").html("");
        let spc = decodeURI(window.location.search).split("&"), d=spc.shift().substring(1);
        if ($.isEmptyObject(key))
        {
          switch(d.toLowerCase())
          {
            case "search":
              spc.map(x => {
                for (let i=0;i<namespace.length;i++)
                {
                  let u=namespace[i];
                  if (x.toLowerCase().startsWith(u+"=") && !key[u])
                  {
                    key[u] = x.replace(u+"=","bi","");
                    return;
                  }
                }
              });
              break;
          }
        }
        for (let name of namespace) $("#"+name).val(key[name]||"");
        if ($.isEmptyObject(key))
        {
          $('title')[0].innerHTML = "Starblast Mods Archive";
          window.history.pushState({path:domain},'',domain);
          $("#mainp").html("");
        }
        else
        {
          $('title')[0].innerHTML = "Search results - Starblast Mods Archive";
          let main = $("<button></button>");
          main.on("click",showAll);
          main.html("View all");
          $("#mainp").html(main);
        }
        let res = mods.filter(x => {
          let aKey = processKey(key.author||""), t=!aKey;
          if (!t)
            Search: for (let y of x.author)
              for (let z of y.name)
                if (t=processKey(z).includes(aKey),t) break Search;
          return (!key.name || processKey(x.name+" "+x.abbreviation).includes(processKey(key.name))) && t;
        });
        let type = ["event"], quan = {};
        res.map(mod => {
          let t = false;
          for (let i of type) {
            if (t=mod[i],t) quan[i] = ++quan[i] || 1;
          }
          if (!t) quan.mod = ++quan.mod || 1;
          $("#modsinfo").append(new ModInfo(mod,key).html);
        });
        try {
          lastDate = new Date(response.getResponseHeader("last-Modified")).toString();
          localStorage.setItem("lastDate",lastDate);
        }
        catch(e){e}
        $("#lastModified").html("<b>Last Updated: </b>"+(lastDate||"Unknown"));
        $("#status").html("You are accessing the data that are loaded from our database");
        $("#status").prop("style","color:green;float:left");
        $("#refresh-ico").prop("class","fa fa-fw fa-refresh");
        $("#refresh-text").html("Refresh");
        let text, u = [], checkcount = false;
        for (let i in quan){
          if (quan[i]) u.push(`${quan[i]} ${i}${(quan[i]>1)?"s":""}`);
          checkcount = checkcount || !!quan[i];
        }
        if (checkcount) text = "Found " + u.slice(0,u.length-1).join(", ") + ((u.length>1)?" and ":"") + u.slice(-1);
        else text = "No mods or events found";
        $("#results").html(text);
      }
      catch(e){alert("Fetch failed :(\nPlease reload the page and try again!")}
    }
    else loadError();
  }
  function fetch()
  {
    $.getJSON("modsinfo.json").done(processData).fail(loadError);
  }
  fetch();
  namespace.map(x => {$("#"+x).on("keydown",function(e){(e.which == 13 && e.ctrlKey) && performSearch()})});
  console.log('%c Stop!!', 'font-weight: bold; font-size: 100px;color: red; text-shadow: 3px 3px 0 rgb(217,31,38)');
  console.log('%cYou are accessing the Web Developing Area.\n\nPlease do not write/copy/paste/run any scripts here (unless you know what you\'re doing) to better protect yourself from loosing your map data, and even your other sensitive data.\n\nWe will not be responsible for any problems if you do not follow the warnings.', 'font-weight: bold; font-size: 15px;color: grey;');
})();
