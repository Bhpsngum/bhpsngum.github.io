window.maparray=[];window.trail=-1;
let mapSize = $("#map_size")
function applyBrushSize(num) {
  let max=applySize("size");
  let size=Math.round((num != void 0)?num:(Number(localStorage.brush)||0));
  size=Math.max(Math.min(max,size),0);
  $("#brush_size").val(size);
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
  if (key == "size") size = Math.round(size/2) *2;
  if (isApply)
  {
    if (key == "size") $("#map_size").val(size);
    localStorage.setItem(key,size);
  }
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
        case "as-color":
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
    case "as-color":
      elem='#color-test';
      break;
  }
  let rp = (param=="as-color")?"color":param,precol = $(elem).css(rp);
  $(elem).css(rp,css);
  css=$(elem).css(rp);
  if (precol != css)
  {
    if (rp == "color")
    {
      $(".ASFilter").css("filter",`opacity(0.5) drop-shadow(${css} 0px 0px 0px)`);
      $("#color-test").css("color",css);
    }
    $("#"+param).val(css);
    localStorage.setItem(param,css);
    if (param == "background-color") $('body').css("color",css.replace(/\d+/g, function(v){return 255-Number(v)}));
  }
  else
  {
    $(elem).css(precol);
    $("#"+param).val(precol);
  }
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
    let u=JSON.parse(JSON.stringify(h)).sort(),d=(size != void 0)?size:Math.max(h.length,u[u.length-1].length);
    if (d>200) d=200;
    else if (d<20) d=20;
    mapSize.val(d);
    if (d != applySize("size") || initial)
    {
      applySize("size",d,1);
      let tb="";
      for (let i=0;i<d;i++)
      {
        tb+="<tr>";
        for (let j=0;j<d;j++)
        {
          let wh=(alsize != void 0)?alsize:((size!= void 0)?0:(Number(((h[i] != void 0)?h[i]:[])[j])||0));
          tb+=`<td id='p${i}-${j}' onclick = 'change(${i},${j});' oncontextmenu='change(${i},${j},0);' onmouseover='viewXY(${i},${j});' onmousedown='startTrail(${i},${j});' onmouseup='stopTrail()'><img class='ASFilter'src='Asteroid.png' draggable=false height='${wh*3}' width='${wh*3}'></td>`;
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
          let gh=(alsize != void 0)?alsize:(Number(((h[i] != void 0)?h[i]:[])[j])||0);
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
function randomMaze(size)
{
  'use strict'

  var MAP_SIZE = size;

  var CELLS = MAP_SIZE / 2;
  var DIRECTIONS = ['north', 'south', 'east', 'west'];

  function Cell() {
    this.visited = false;
    this.walls = {'north': true, 'south': true, 'east': true, 'west': true};
    this.neighbours = {'north': null, 'south': null, 'east': null, 'west': null};
  }

  Cell.prototype.carveTo = function(direction){
    this.walls[direction] = false;
    this.neighbours[direction].walls[inverseDirection(direction)] = false;
    this.neighbours[direction].visited = true;
  }


  function inverseDirection(direction){
    switch (direction){
      case 'north':
        return 'south';
      case 'south':
        return 'north';
      case 'east':
        return 'west';
      case 'west':
        return 'east';
      default:
        return (undefined);
    }
  }


  function mod(x, n){
    return ((x % n) + n) % n
  }

  function initCellMap(){
    var cellMap = [];

    for (var i = 0; i < CELLS; i++){
      cellMap[i] = []
      for (var j = 0; j < CELLS; j++){
        cellMap[i].push(new Cell());
      }
    }

    for (var i = 0; i < CELLS; i++){
      for (var j = 0; j < CELLS; j++){
        cellMap[i][j].neighbours['north'] = cellMap[mod(i - 1, CELLS)][j];
        cellMap[i][j].neighbours['south'] = cellMap[mod(i + 1, CELLS)][j];
        cellMap[i][j].neighbours['east'] = cellMap[i][mod(j + 1, CELLS)];
        cellMap[i][j].neighbours['west'] = cellMap[i][mod(j - 1, CELLS)];
      }
    }
    return (cellMap);
  }

  function isSurrounded(cell){
    for (var i = 0; i < 4; i++){
      if (!cell.neighbours[DIRECTIONS[i]].visited){
        return (false);
      }
    }
    return (true);
  }

  function selectRandomDirection(cell){

    var i = Math.floor(Math.random() * 4);
    var inc = 1;
    if (Math.random() >= 0.5){
      inc = -1;
    }
    while (cell.neighbours[DIRECTIONS[i]].visited){
      i = mod(i + inc, 4);
    }
    return (DIRECTIONS[i]);
  }

  function walk(start){

    var current = start;
    var direction;
    var count = 0;
    while (!isSurrounded(current) && count < (CELLS * CELLS) / 5){
      direction = selectRandomDirection(current);
      current.carveTo(direction);
      current = current.neighbours[direction];
      count++;
    }
  }

  function selectNewStart(cMap){

    var modeI = Math.floor(Math.random() * 2);
    var modeJ = Math.floor(Math.random() * 2);
    var incI = 1;
    var incJ = 1;
    var limI = CELLS;
    var limJ = CELLS;
    if (modeI){
      incI = -1;
      limI = -1;
    }
    if (modeJ){
      incJ = -1;
      limJ = -1;
    }
    for (var i = modeI * (CELLS - 1); i !== limI; i += incI){
      for (var j = modeJ * (CELLS - 1); j !== limJ; j += incJ){
        if (cMap[i][j].visited && !isSurrounded(cMap[i][j])){
          return (cMap[i][j]);
        }
      }
    }
    return (undefined);
  }

  function generateMaze(){
    var cellMap;
    var maze = "";
    var line1;
    var line2;
    var start;

    cellMap = initCellMap();

    cellMap[Math.floor(CELLS / 2)][Math.floor(CELLS / 2)].visited = true;
    while (true){
      start = selectNewStart(cellMap);
      if (start === undefined){
        break;
      }
      walk(start);
    }

    for (var i = 0; i < CELLS ; i++){
      line1 = "";
      line2 = "";
      for (var j = 0; j < CELLS; j++){
        line1 += " ";
        line1 += cellMap[i][j].walls['east'] ? "9" : " ";
        line2 += cellMap[i][j].walls['south'] ? "9" : " ";
        line2 += "9";
      }
      line1 += "\n";
      if (i < CELLS - 1){
        line2 += "\n";
      }
      maze += line1;
      maze += line2;
    }
    return (maze);
  }

  return generateMaze();
}
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
let cas=`<tr><td id="asc0" onclick="changeASSize(0);" style="color:rgb(255,255,255);" onmouseover="viewinfo(null,'Remove asteroids in the map (Hotkey 0)')"><i class="fa fa-fw fa-eraser ASFilter"></i></td>`;
for (let i=1;i<=9;i++) cas+=`<td id='asc${i}' onclick = 'changeASSize(${i});' onmouseover='viewinfo(null,"Asteroid size ${i} (Hotkey ${i})")'><img class='ASFilter' src='Asteroid.png' draggable=false height='${i*3}' width='${i*3}'></td>`;
$("#asChoose").html(cas+"</tr>");
$("#brush_size").val(applyBrushSize());
changeASSize();
$("#random").on("mouseover", function() {
  viewinfo('RandomMazeGenerator', 'Generate Random Maze according to the current map size. By <a id="author_random" href = "#">@rvan_der</a>')
  $("#author_random").on("click", function() {
    window.open("https://github.com/rvan-der", "_blank");
  });
});
new ResizeSensor($('#menu')[0], function(){
    $("#map").css("padding-top",$("#menu").height()+"px")
});
mapSize.on("change",function(){loadMap(null,applySize("size",Number(mapSize.val())))});
$("#clearMap").on("click",function(){
  loadMap(null,null,0);
});
$("#brush_size").on("change", function() {
  applyBrushSize($("#brush_size").val());
});
for (let i of ["border","background","as"])
{
  applyColor(i+"-color");
  $("#"+i+"-color").on("change", function(){
    applyColor(i+"-color",$("#"+i+"-color").val());
  });
}
$("#export").on("click",function() {
  var text=process("plain");
  var d=new Date();
  var suff=d.getFullYear().toString()+(d.getMonth()+1).toString()+d.getDate().toString()+d.getHours().toString()+d.getMinutes().toString()+d.getSeconds().toString();
  download("starblast-map_" + suff, text);
});
$("#random").on("click", function() {
  while (!loadMap(randomMaze(applySize("size")).split("\n"))) loadMap(randomMaze(applySize("size")).split("\n"));
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
  let size=["brush_size","map_size","background-color","border-color","as-color"],check=[];
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
  setMapURL(encodeURI(process("url")));
  copyToClipboard(window.location.protocol + "//" + window.location.host + window.location.pathname + '?'+encodeURI(process("url")));
});
for (let i of ["brush_size","map_size","border-color","background-color"])
$("#"+i).on("keypress",function(e){if (e.which == 13) $("#"+i).blur()});
let states=["dark","light"];
if (!window.matchMedia) document.querySelector("link").href=`icon_light.png`;
else for (let state of states) if (window.matchMedia(`(prefers-color-scheme: ${state})`).matches) document.querySelector("link").href=`icon_${state}.png`;
