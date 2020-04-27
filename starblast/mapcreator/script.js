let mapSize = $("#map_size"),trail=-1;
function singlechange(x,y,num)
{
  let element=$(`#p${x}-${y} > img`);
  element.height(num*3);
  element.width(num*3);
  if (element.length)
  {
    let u=JSON.parse(localStorage.array||1);
    if (Array.isArray(u))
    {
      if (Array.isArray(u[x]))
      {
        u[x][y]=num;
        localStorage.setItem("array",JSON.stringify(u));
      }
      else modifyMap();
    }
    else modifyMap();
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
function modifyMap()
{
  let d=[];
  for (let i=0;i<Number(localStorage.size)||20;i++)
  {
    d.push([]);
    for (let j=0;j<Number(localStorage.size)||20;j++) d[i].push(Math.round(Number($(`#p${i}-${j} >img`).width())/3));
  }
  localStorage.setItem("array",JSON.stringify(d));
}
function viewXY(x,y)
{
  let d=Math.round(($(`#p${x}-${y} > img`).width()||0)/3),gl="No Asteroids";
  if (d) gl="Asteroid size: "+d.toString();
  $("#XY").html(`(${x+1};${y+1}). ${gl}`);
  if (trail != -1) change(x,y,trail);
}
function startTrail(x,y)
{
  let e = window.event;
  switch (e.which) {
    case 1:
      trail=Number(localStorage.as_size);
      if (isNaN(trail)) trail=-1;
      change(x,y,trail);
      break;
    case 3:
      trail=0;
      break;
  }
}
function stopTrail()
{
  trail = -1;
}
function loadMap(data)
{
  let h=JSON.parse(JSON.stringify(data)||(localStorage.array||1)),check=true;
  if (Array.isArray(h))
  {
    let d=h.length;
    if (d>200) d=200;
    else if (d<20) d=20;
    $("#map_size").val(d);
    changeMap(d);
    for (let i=0;i<d;i++)
      for (let j=0;j<d;j++)
      {
        let size=h[i][j]||0;
        $(`#p${i}-${j} > img`).width(Math.round(size)*3);
        $(`#p${i}-${j} > img`).height(Math.round(size)*3);
      }
  }
  else check=false;
  if (check) localStorage.setItem("array",JSON.stringify(h));
  return check;
}
function changeMap(data,tf)
{
  let size=data;
  if (size>200) size=200;
  else if (size<20) size=20;
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
  (!tf) && modifyMap();
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
    if (!loadMap(map)) alert("Invalid map pattern!");
    else localStorage.setItem("array",JSON.stringify(map));
  }
  else alert("Invalid map pattern!");
}
function process()
{
  modifyMap();
  let parsed=JSON.parse(localStorage.array||1);str=[];
  if (Array.isArray(parsed))
  {
    for (let i of parsed)
    {
      let d="";
      if (Array.isArray(i))
      {
        for (let j=0;j<i.length-1;j++) d+=i[j]||" ";
        d+=i[i.length-1]||" ";
      }
      else return "";
      str.push(d);
    }
  }
  else return "";
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
changeMap(Number(localStorage.size)||20,1);
loadMap();
mapSize.on("change",function(){changeMap(mapSize.val())});
$("#clearMap").on("click",function(){
  changeMap(Number(localStorage.size)||20);
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
  }
}
