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
  document.body.style=`cursor: url('resources/Asteroid${applySize("as_size",num,1)*3}.png'),auto;`;
  for (let i=1;i<=9;i++) document.querySelector(`#asc${i}`).style = "border: 1px solid rgb(102, 102, 102)";
}
function viewXY(x,y) {
  let d=Math.round(($(`#p${x}-${y} > img`).width()||0)/3),gl="No Asteroids";
  if (d) gl="Asteroid size: "+d.toString();
  $("#XY").html(`(${x+1};${y+1}). ${gl}`);
  if (window.trail != -1) change(x,y,window.trail);
}
function startTrail(x,y) {
  let e = window.event;
  switch (e.which) {
    case 1:
      window.trail=applySize("as_size");
      change(x,y,window.trail);
      break;
    case 3:
      document.body.style='cursor: url("resources/Asteroid0.png"),auto;';
      window.trail=0;
      break;
  }
}
function stopTrail() {
  document.body.style=`cursor: url("resources/Asteroid${applySize("as_size")*3}.png"),auto;`;
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
          tb+=`<td id='p${i}-${j}' onclick = 'change(${i},${j});' oncontextmenu='change(${i},${j},0);return false;' onmouseover='viewXY(${i},${j});' onmousedown='startTrail(${i},${j});' onmouseup='stopTrail()'><img src='resources/Asteroid.png' draggable=false height='${wh*3}' width='${wh*3}'></td>`;
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
    }
  }
  catch(e){fail=1;}
  if (!fail)
  {
    (!loadMap(map)) && alert("Invalid map pattern!");
  }
  else alert("Invalid map pattern!");
}
function process() {
  syncMap(0);
  let str=[];
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
$("#brush_size").val(applyBrushSize());
let cas="<tr>";
for (let i=1;i<=9;i++) cas+=`<td id='asc${i}' onclick = 'changeASSize(${i});this.style="border: 3px solid rgb(102, 102, 102)";'><img src='resources/Asteroid.png' height='${i*3}' width='${i*3}'></td>`;
$("#asChoose").html(cas+"</tr>");
changeASSize();
document.querySelector("#asc"+applySize("as_size")).style= "border: 3px solid rgb(102, 102, 102)";
syncMap(2);
loadMap(null,null,null,1);
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
  $("#loadMap").val("");
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
let states=["dark","light"];
if (!window.matchMedia) document.querySelector("link").href=`icon_light.png`;
else for (let state of states) if (window.matchMedia(`(prefers-color-scheme: ${state})`).matches) document.querySelector("link").href=`icon_${state}.png`;
