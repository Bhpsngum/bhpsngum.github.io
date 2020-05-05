window.maparray=[];window.trail=-1;
let mapSize = $("#map_size")
function applyBrushSize(num) {
  let max=applySize("size");
  let size=Math.round((num != void 0)?num:(Number(localStorage.brush)||0));
  size=Math.max(Math.min(max,size),0);
  localStorage.setItem("brush",size);
  return size;
}
function applySize(key,num,isApply) {
  let template= {
    as_size: {
      min:0,
      max:9
    },
    size: {
      min:20,
      max:200
    }
  }
  let size=Math.round((num != void 0)?num:(Number(localStorage[key])||template[key].min));
  size=Math.max(Math.min(template[key].max,size),template[key].min);
  (isApply) && localStorage.setItem(key,size);
  return size;
}
function singlechange(x,y,num) {
  let element=$(`#p${x}-${y} > img`);
  if (element.length)
  {
    if (!(Math.round(element.width()/3) == num && Math.round(element.width()/3) == num))
    {
      element.width(num*3);
      element.height(num*3);
      syncMap(2);
      window.maparray[x][y]=num;
      syncMap(1);
    }
  }
}
function checkMap(data) {
  if (Array.isArray(data))
  {
    for (let index of data)
    {
      if (!(Array.isArray(index) && (index.length||0)==data.length)) return false;
    }
  }
  else return false;
  return true;
}
function syncMap(num) {
  //0 to refresh both-side, 1 to push to server and 2 to pull from server
  switch(num)
  {
    case 0:
      window.maparray=[];
      for (let i=0;i<applySize("size");i++)
      {
        window.maparray.push([]);
        for (let j=0;j<applySize("size");j++) window.maparray[i].push(Math.round(($(`#p${i}-${j} >img`).width()||0)/3));
      }
      localStorage.setItem("array",JSON.stringify(window.maparray));
      break;
    case 1:
      if (!checkMap(window.maparray)) syncMap(0);
      else localStorage.setItem("array",JSON.stringify(window.maparray));
      break;
    case 2:
      let er=0,data;
      try {
        data=JSON.parse(localStorage.array);
      }
      catch(e){er=1;syncMap(0)};
      if (!er)
      {
        if (!checkMap(JSON.parse(localStorage.array))) syncMap(0);
        else window.maparray=data;
      }
      else window.maparray=data;
      break;
  }
}
function change(x,y,num) {
  let br=applyBrushSize();
  size=applySize("as_size",num);
  for (let i=x-br;i<=x+br;i++)
    for (let j=y-br;j<=y+br;j++)
      singlechange(i,j,size);
}
function changeASSize(num) {
  let u=applySize("as_size",num,1);
  for (let i=0;i<=9;i++) $(`#asc${i}`).css({"border":"1px solid","border-color":"inherit"});
  $(`#asc${u}`).css({"border":"3px solid","border-color":"inherit"});
}
function viewinfo(title,text) {
  $("#info").html(`<strong>${title?title+": ":""}</strong>${text||""}`);
}
function viewXY(x,y) {
  let d=Math.round(($(`#p${x}-${y} > img`).width()||0)/3),gl="No Asteroids";
  if (d) gl="Asteroid size: "+d.toString();
  $("#XY").html(`(${x+1};${y+1}). ${gl}`);
  if (window.trail != -1) change(x,y,window.trail);
}
function applyColor(param,inp)
{
  let css;
  if (inp == void 0 || (inp||"").toLowerCase()=="default")
  {
    if (localStorage[param] == void 0 || (inp||"").toLowerCase()=="default")
      switch(param.toLowerCase())
      {
        case "background-color":
          css="#181a1b";
          break;
        case "border-color":
          css="rgb(102,102,102)";
          break;
      }
    else css=localStorage[param];
  }
  else css=inp;
  let elem="";
  switch (param)
  {
    case "background-color":
      elem='body';
      break;
    case "border-color":
      elem='table';
      break;
  }
  let precol=$(elem).css(param);
  $(elem).css(param,css);
  if (precol != $(elem).css(param)) $("#"+param).val(css);
  else $(elem).precol(precol);
  localStorage.setItem(param,css);
}
function startTrail(x,y) {
  let e = window.event;
  switch (e.which) {
    case 1:
      window.trail=applySize("as_size");
      change(x,y,window.trail);
      break;
    case 3:
      window.trail=0;
      change(x,y,0);
      break;
  }
}
function stopTrail() {
  window.trail = -1;
}
function loadMap(data,size,alsize,initial)
{
  if (!data) syncMap(2);
  let h=(data)?data:window.maparray;check=true;
  if (Array.isArray(h))
  {
    let d=(size != void 0)?size:h.length;
    if (d>200) d=200;
    else if (d<20) d=20;
    mapSize.val(d);
    if (d != applySize("size") || initial)
    {
      localStorage.setItem("size",d);
      let tb="";
      for (let i=0;i<d;i++)
      {
        tb+="<tr>";
        for (let j=0;j<d;j++)
        {
          let wh=(alsize != void 0)?alsize:((size!= void 0)?0:(Number(h[i][j])||0));
          tb+=`<td id='p${i}-${j}' onclick = 'change(${i},${j});' oncontextmenu='change(${i},${j},0);' onmouseover='viewXY(${i},${j});' onmousedown='startTrail(${i},${j});' onmouseup='stopTrail()'><img src='Asteroid.png' draggable=false height='${wh*3}' width='${wh*3}'></td>`;
        }
        tb+="</tr>";
      }
      $("#map").html(tb);
      $("#map").css("width",(d*42).toString()+"px");
    }
    else
    {
      for (let i=0;i<d;i++)
        for (let j=0;j<d;j++)
        {
          let gh=(alsize != void 0)?alsize:(Number(h[i][j])||0);
          singlechange(i,j,gh);
        }
    }
  }
  else check=false;
  syncMap(0);
  return check;
}
function parseMap(data) {
  let fail=0,map=[];
  try {
    eval("parse=function(){return  "+data.replace(/^(var|let|const)/g,"")+"}");
    if (typeof parse() != 'string') throw "Not a string";
    else
    {
      map=parse().split("\n");
      if (map.length < 20 || map.length > 200) throw "Invalid map size";
    }
  }
  catch(e){fail=1;}
  if (!fail)
  {
    if (!loadMap(map))
    {
      alert("Invalid map pattern!");
      return false;
    }
  }
  else
  {
    alert("Invalid map pattern!");
    return false;
  }
  return true;
}
function process(type) {
  syncMap(0);
  let str=[];
  switch(type.toLowerCase())
  {
    case "plain":
      for (let i of window.maparray)
      {
        let d="";
        for (let j=0;j<i.length-1;j++) d+=i[j]||" ";
        d+=i[i.length-1]||" ";
        str.push(d);
      }
      return '"'+str.join('\\n"+\n"')+'";';
    case "url":
      let prevs,dups=0;
      for (let i=0;i<window.maparray.length;i++)
      {
        let d="",prev=window.maparray[i][0],dup=1;
        for (let j=1;j<window.maparray[i].length;j++)
        {
          if (window.maparray[i][j] == prev && j<window.maparray[i].length-1) dup++;
          else
          {
            if (j==window.maparray[i].length-1) dup++;
            if (dup<4) for (let g=0;g<dup;g++) d+=prev;
            else d+=prev+"t"+dup+"d";
            prev=window.maparray[i][j];
            dup=1;
          }
        }
        if (prevs === void 0) prevs = d;
        if (prevs == d && i<window.maparray.length-1) dups++;
        else
        {
            if (i==window.maparray.length-1) dups++;
            if (dups==1) str.push(prevs);
            else str.push("l"+prevs+"n"+dups);
            prevs=d;
            dups=1;
        }
      }
      return str.join("e");
  }
}
function copyToClipboard(text) {
    var dummy = document.createElement("textarea");
    document.body.appendChild(dummy);
    dummy.value = text;
    dummy.select();
    document.execCommand("copy");
    document.body.removeChild(dummy);
}
function download(filename, text) {
  var element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
  element.setAttribute('download', filename);

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}
function setMapURL(newMap)
{
  let url=window.location.protocol + "//" + window.location.host + window.location.pathname,clear=(newMap)?"?":"";
  window.history.pushState({path:url+clear+(newMap||"")},'',url+clear+(newMap||""));
}
applyColor("border-color");
applyColor("background-color");
let querymap=decodeURI(window.location.search.replace(/^\?/,"")),error=0;
if (querymap === "") error=1;
else
{
  if (confirm("Map pattern from URL detected!\nLoad the map?"))
  {
    let smap=querymap.split('e'),dmap=[];
    for (let i of smap)
    {
      let repeat=false,qstr=i.replace(/l(.+)n\d+/,"$1");
      qstr=qstr.replace(/\dt\d+d/g,function(v){
        let qd="";
        for (let j=0;j<Number(v.replace(/\dt(\d+)d/g,"$1"));j++) qd+=v[0];
        return qd;
      });
      dmap.push(qstr);
      i.replace(/l.+n\d+/,function(v){repeat=true});
      if (repeat)
        for (let j=0;j<Number(i.replace(/l.+n(\d+)/,"$1"))-1;j++) dmap.push(qstr);
    }
    if (dmap.length < 20 || dmap.length > 200)
    {
      alert("Invalid map pattern!");
      error=1;
    }
    else if (!loadMap(dmap,null,null,1))
    {
      alert("Invalid map pattern!");
      error=1;
    }
  }
  else error=1;
  setMapURL();
}
if (error)
{
  syncMap(2);
  loadMap(null,null,null,1);
}
let cas=`<tr><td id="asc0" onclick="changeASSize(0);" style="color:rgb(102,102,102);" onmouseover="viewinfo(null,'Remove asteroids in the map (Hotkey 0)')"><i class="fa fa-fw fa-eraser"></i></td>`;
for (let i=1;i<=9;i++) cas+=`<td id='asc${i}' onclick = 'changeASSize(${i});' onmouseover='viewinfo(null,"Asteroid size ${i} (Hotkey ${i})")'><img src='Asteroid.png' draggable=false height='${i*3}' width='${i*3}'></td>`;
$("#asChoose").html(cas+"</tr>");
$("#brush_size").val(applyBrushSize());
changeASSize();
mapSize.on("change",function(){loadMap(null,mapSize.val())});
$("#clearMap").on("click",function(){
  loadMap(null,null,0);
});
$("#brush_size").on("change", function() {
  let size=$("#brush_size").val(),max=applySize("size");
  if (size>max) size=max;
  else if (size<0) size=0;
  $("#brush_size").val(size);
  localStorage.setItem("brush",size);
});
for (let i of ["border","background"])
$("#"+i+"-color").on("change", function(){
  applyColor(i+"-color",$("#"+i+"-color").val());
});
$("#export").on("click",function() {
  var text=process("plain");
  var d=new Date();
  var suff=d.getFullYear().toString()+(d.getMonth()+1).toString()+d.getDate().toString()+d.getHours().toString()+d.getMinutes().toString()+d.getSeconds().toString();
  download("starblast-map_" + suff, text);
});
$("#copyMap").on("click",function() {
  copyToClipboard(process("plain"));
})
$("#loadMap").on("change", function(e) {
  let file=e.target.files[0];
  if (file.type.match("plain") || file.type.match("javascript")) {
    let fr = new FileReader();
    fr.onload = (function(reader)
    {
        return function()
        {
            parseMap(reader.result);
        }
    })(fr);
    fr.readAsText(file);
  }
  else alert("Unsupported file format!");
  $("#loadMap").val("");
});
document.onkeypress = function(e)
{
  let size=["brush_size","map_size","background-color","border-color"],check=[];
  for (let i of size) check.push($("#"+i).is(":focus"));
  if (!Math.max(...check))
  switch (e.which)
  {
    case 119:
    case 87:
      scrollBy(0,-40);
      break;
    case 115:
    case 83:
      scrollBy(0,40);
      break;
    case 100:
    case 68:
      scrollBy(40,0);
      break;
    case 97:
    case 65:
      scrollBy(-40,0);
      break;
    default:
      if (e.which>47 && e.which <58) $(`#asc${e.which-48}`).click();
  }
}
$("#permalink").on("click", function(){
  let check=process("url").replace(/[^123456789]/g,"");
  let done=(check==="")?applySize("size"):process("url");
  setMapURL(encodeURI(done));
  copyToClipboard(window.location.protocol + "//" + window.location.host + window.location.pathname + '?'+encodeURI(done));
});
for (let i of ["brush_size","map_size","border-color","background-color"])
$("#"+i).on("keypress",function(e){if (e.which == 13) $("#"+i).blur()});
let states=["dark","light"];
if (!window.matchMedia) document.querySelector("link").href=`icon_light.png`;
else for (let state of states) if (window.matchMedia(`(prefers-color-scheme: ${state})`).matches) document.querySelector("link").href=`icon_${state}.png`;
