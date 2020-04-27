let mapSize = $("#map_size"),trail=-1;
if (isNaN(trail)) trail=-1;
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
  for (let i=1;i<=9;i++) document.querySelector(`#asc${i}`).style = "border: 1px solid rgb(240,240,240)";
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
  $("#XY").html(`(${k+1};${l+1})`);
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
function loadMap()
{
  let h=JSON.parse(localStorage.array||1);
  if (Array.isArray(h))
  {
    for (let i=0;i<h.length;i++)
      for (let j=0;j<h.length;j++)
        if (h[i][j])
        {
          document.querySelector(`#p${i}-${j}`).querySelector("img").width=h[i][j]*3;
          document.querySelector(`#p${i}-${j}`).querySelector("img").height=h[i][j]*3;
        }
  }
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
function process()
{
  modifyMap();
  let parsed=JSON.parse(localStorage.array||1);str='"';
  if (Array.isArray(parsed))
  {
    for (let i of parsed)
    {
      if (Array.isArray(i))
      {
        for (let j=0;j<i.length-1;j++) str+=i[j]||" ";
        str+=i[i.length-1]||" ";
      }
      else return "";
      str+='\\n"+\n"';
    }
  }
  else return "";
  return str.slice(0,-6)+'";';
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
for (let i=1;i<=9;i++) cas+=`<td id='asc${i}' onclick = 'changeASSize(${i});this.style="border: 3px solid rgb(240,240,240)";'><img src='Asteroid.png' height='${i*3}' width='${i*3}'></td>`;
$("#asChoose").html(cas+"</tr>");
if (!isNaN(Number(localStorage.as_size)) && Number(localStorage.as_size)) 
document.querySelector("#asc"+Number(localStorage.as_size)).style= "border: 3px solid rgb(240,240,240)";
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
  download("starblast-custommap_" + suff, text);
});
$("#copyMap").on("click",function() {
  copyToClipboard(process());
})
