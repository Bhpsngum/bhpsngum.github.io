let mapSize = $("#map_size"),trail=-1;
function change(element,num)
{
  let d=element.querySelector("img");
  let size=(num != void 0)?num:localStorage.as_size;
  size=isNaN(Number(size))?9:Number(size);
  d.height=size*3;
  d.width=size*3;
  let g=element.id;
  let u=JSON.parse(localStorage.array||1);
  if (Array.isArray(u))
  {
    let k=Number(g.replace(/p(\d+)-\d+/g,"$1")),
    l=Number(g.replace(/p\d+-(\d+)/g,"$1"))
    if (Array.isArray(u[k]))
    {
      u[k][l]=size;
      localStorage.setItem("array",JSON.stringify(u));
    }
    else modifyMap();
  }
  else modifyMap();
}
function changeASSize(num)
{
  localStorage.as_size=num;
  for (let i=1;i<=9;i++) document.querySelector(`#asc${i}`).style = "border: 1px solid rgb(102, 102, 102)";
}
function modifyMap()
{
  let d=[];
  for (let i=0;i<localStorage.size;i++)
  {
    d.push([]);
    for (let j=0;j<localStorage.size;j++) d[i].push(Number(document.querySelector(`#p${i}-${j}`).querySelector("img").width)/3);
  }
  localStorage.setItem("array",JSON.stringify(d));
}
function viewXY(element)
{
  let g=element.id;k=Number(g.replace(/p(\d+)-\d+/g,"$1")),
    l=Number(g.replace(/p\d+-(\d+)/g,"$1"));
  let d=Number(element.querySelector("img").width)/3,gl="No Asteroids";
  if (isNaN(d)) d=0;
  if (d) gl="Asteroid size: "+d.toString();
  $("#XY").html(`(${k+1};${l+1}). ${gl}`);
  if (trail != -1) change(element,trail);
}
function startTrail(element)
{
  let e = window.event;
  switch (e.which) {
    case 1:
      trail=Number(localStorage.as_size);
      if (isNaN(trail)) trail=-1;
      change(element,trail);
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
    $("#map_size").val(h.length);
    localStorage.setItem("size",h.length);
    for (let i=0;i<h.length;i++)
      for (let j=0;j<h.length;j++)
      {
        let check=h[i][j]||0;
        document.querySelector(`#p${i}-${j}`).querySelector("img").width=h[i][j]*3;
        document.querySelector(`#p${i}-${j}`).querySelector("img").height=h[i][j]*3;
      }
  }
  else check=false;
  if (check) localStorage.setItem("array",JSON.stringify(h));
  return check;
}
function changeMap(data,tf)
{
  let size=isNaN(Number(data))?20:Number(data);
  if (size>200) size=200;
  else if (size<20) size=20;
  mapSize.val(size);
  let tb="";
  localStorage.setItem("size",size)
  for (let i=0;i<size;i++)
  {
    tb+="<tr>"
    for (let j=0;j<size;j++) tb+=`<td id='p${i}-${j}' onclick = 'change(this);' oncontextmenu='change(this,0);return false;' onmouseover='viewXY(this);' onmousedown='startTrail(this);' onmouseup='stopTrail()'><img src='Asteroid.png' draggable=false height='0' width='0'></td>`;
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
      let u=parse().split("\n"),len=[];
      for (let i of u) len.push(i.length);
      if (Math.max(...len) != u.length) throw "Invalid";
      else
      {
        for (let i=0;i<u.length;i++)
        {
          let t=[];
          if (typeof u[i] != "string") throw "Not a string";
          else for (let j=0;j<u.length;j++)
          {
            let ms=Number(u[i][j]||0);
            if (isNaN(ms)) ms=0;
            t.push(ms);
          }
          map.push(t);
        }
      }
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
let cas="<tr>";
for (let i=1;i<=9;i++) cas+=`<td id='asc${i}' onclick = 'changeASSize(${i});this.style="border: 3px solid rgb(102, 102, 102)";'><img src='Asteroid.png' height='${i*3}' width='${i*3}'></td>`;
$("#asChoose").html(cas+"</tr>");
if (!isNaN(Number(localStorage.as_size)) && Number(localStorage.as_size))
document.querySelector("#asc"+Number(localStorage.as_size)).style= "border: 3px solid rgb(102, 102, 102)";
changeMap(localStorage.size||20,1);
loadMap();
mapSize.on("change",function(){changeMap(mapSize.val())});
$("#clearMap").on("click",function(){
  changeMap(localStorage.size);
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
