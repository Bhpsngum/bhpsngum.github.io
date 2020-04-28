window.maparray=[];window.trail=-1;
let mapSize = $("#map_size")
function singlechange(x,y,num)
{
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
function checkMap(data)
{
  if (Array.isArray(data))
  {
    for (let index of data)
    {
      let check=Array.isArray(index) && (index.length||0)==data.length;
      if (!check) return check;
    }
  }
  return true;
}
function syncMap(num)
{
  //0 to refresh both-side, 1 to push to server and 2 to pull from server
  switch(num)
  {
    case 0:
      window.maparray=[];
      for (let i=0;i<(Number(localStorage.size)||20);i++)
      {
        window.maparray.push([]);
        for (let j=0;j<(Number(localStorage.size)||20);j++) window.maparray[i].push(Math.round(($(`#p${i}-${j} >img`).width()||0)/3));
      }
      localStorage.setItem("array",JSON.stringify(window.maparray));
      break;
    case 1:
      if (!checkMap(window.maparray)) syncMap(0);
      else localStorage.setItem("array",JSON.stringify(window.maparray));
      break;
    case 2:
      window.maparray=JSON.parse(localStorage.array);
      (!checkMap(window.maparray)) && syncMap(0);
      break;
  }
}
function change(x,y,num)
{
  let br=Number(localStorage.brush)||0,
  size=(num != void 0)?num:(Number(localStorage.as_size)||0);
  for (let i=x-br;i<=x+br;i++)
    for (let j=y-br;j<=y+br;j++)
      singlechange(i,j,size);
}
function changeASSize(num)
{
  localStorage.as_size=num;
  for (let i=1;i<=9;i++) document.querySelector(`#asc${i}`).style = "border: 1px solid rgb(102, 102, 102)";
}
function viewXY(x,y)
{
  let d=Math.round(($(`#p${x}-${y} > img`).width()||0)/3),gl="No Asteroids";
  if (d) gl="Asteroid size: "+d.toString();
  $("#XY").html(`(${x+1};${y+1}). ${gl}`);
  if (window.trail != -1) change(x,y,window.trail);
}
function startTrail(x,y)
{
  let e = window.event;
  switch (e.which) {
    case 1:
      window.trail=Number(localStorage.as_size);
      if (isNaN(window.trail)) window.trail=-1;
      change(x,y,window.trail);
      break;
    case 3:
      window.trail=0;
      break;
  }
}
function stopTrail()
{
  window.trail = -1;
}
function loadMap(data,initial)
{
  if (!data) syncMap(0);
  let h=(data)?data:window.maparray;check=true;
  if (Array.isArray(h))
  {
    let d=h.length;
    if (d>200) d=200;
    else if (d<20) d=20;
    $("#map_size").val(d);
    localStorage.setItem("size",d);
    changeMap(null,initial);
    for (let i=0;i<d;i++)
      for (let j=0;j<d;j++)
      {
        let size=Number(h[i][j])||0;
        $(`#p${i}-${j} > img`).width(Math.round(size)*3);
        $(`#p${i}-${j} > img`).height(Math.round(size)*3);
      }
  }
  else check=false;
  if (check) syncMap(1);
  return check;
}
function changeMap(data,initial)
{
  let size=((data)?data.length:Number(localStorage.size))||20;
  if (size>200) size=200;
  else if (size<20) size=20;
  if (size != (Number(localStorage.size)||20) || initial)
  {
    mapSize.val(size);
    let tb="";
    localStorage.setItem("size",size)
    for (let i=0;i<size;i++)
    {
      tb+="<tr>"
      for (let j=0;j<size;j++) tb+=`<td id='p${i}-${j}' onclick = 'change(${i},${j});' oncontextmenu='change(${i},${j},0);return false;' onmouseover='viewXY(${i},${j});' onmousedown='startTrail(${i},${j});' onmouseup='stopTrail()'><img src='Asteroid.png' draggable=false height='0' width='0'></td>`;
      tb+="</tr>"
    }
    $("#map").html(tb);
    $("#map").css("width",(size*42).toString()+"px");
  }
  else
  {
    for (let i=0;i<size;i++)
      for (let j=0;j<size;j++) singlechange(i,j,0);
  }
}
function parseMap(data)
{
  let fail=0,map=[];
  try {
    eval("parse=function(){return  "+data.replace(/^(var|let|const)/g,"")+"}");
    if (typeof parse() != 'string') throw "Not a string";
    else
    {
      map=parse().split("\n");
    }
  }
  catch(e){fail=1;}
  if (!fail)
  {
    (!loadMap(map)) && alert("Invalid map pattern!");
  }
  else alert("Invalid map pattern!");
}
function process()
{
  syncMap(0);
  for (let i of window.maparray)
  {
    let d="";
    for (let j=0;j<i.length-1;j++) d+=i[j]||" ";
    d+=i[i.length-1]||" ";
    str.push(d);
  }
  return '"'+str.join('\\n"+\n"')+'";';
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
$("#brush_size").val(localStorage.brush||0);
let cas="<tr>";
for (let i=1;i<=9;i++) cas+=`<td id='asc${i}' onclick = 'changeASSize(${i});this.style="border: 3px solid rgb(102, 102, 102)";'><img src='Asteroid.png' height='${i*3}' width='${i*3}'></td>`;
$("#asChoose").html(cas+"</tr>");
if (!isNaN(Number(localStorage.as_size)) && Number(localStorage.as_size))
document.querySelector("#asc"+Number(localStorage.as_size)).style= "border: 3px solid rgb(102, 102, 102)";
syncMap(2);
loadMap(null,1);
mapSize.on("change",function(){changeMap(mapSize.val())});
$("#clearMap").on("click",function(){
  changeMap();
});
$("#brush_size").on("change", function() {
  let size=$("#brush_size").val(),max=Number(localStorage.size)||20;
  if (size>max) size=max;
  else if (size<0) size=0;
  $("#brush_size").val(size);
  localStorage.setItem("brush",size);
});
$("#export").on("click",function() {
  var text=process();
  var d=new Date();
  var suff=d.getFullYear().toString()+(d.getMonth()+1).toString()+d.getDate().toString()+d.getHours().toString()+d.getMinutes().toString()+d.getSeconds().toString();
  download("starblast-map_" + suff, text);
});
$("#copyMap").on("click",function() {
  copyToClipboard(process());
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
});
document.onkeypress = function(e)
{
  if (!($("#brush_size").is(":focus") || $("#map_size").is(":focus")))
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
$("#brush_size").on("keypress",function(e){if (e.which == 13) $("#brush_size").blur()});
mapSize.on("keypress",function(e){if (e.which == 13) mapSize.blur()});
