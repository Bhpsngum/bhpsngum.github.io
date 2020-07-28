(function(){
  var StarblastMap = {
    map: $("#map"),
    sizeInput: $("#map_size"),
    Buttons: {
      export: $("#export"),
      clear: $("#clearMap"),
      randomMaze: $("#random"),
      import: $("#loadMap"),
      copy: $("#copyMap"),
      permalink: $("#permalink")
    },
    session: new Map(),
    data: [],
    history: [],
    future: [],
    pattern: new Map(),
    size: Math.min(Math.max(20,Number(localStorage.size)||20),200),
    buildData: function(dms) {
      (!dms) && this.pushSession("history",["n",this.data]);
      this.data = [];
      for (let i=0;i<this.size;i++) this.data.push(new Array(this.size).fill(0));
    },
    copy: function(type) {
      let map;
      switch (type)
      {
        case "plain":
          map = this.export("plain");
          break;
        case "url":
          map = Engine.permalink(this.export("url"));
          break;
      }
      Engine.copyToClipboard(map);
    },
    load: function(data,init,dismiss_history) {
      let prev = this.data;h=data||prev;check=true;
      if (Array.isArray(h))
      {
        let u=JSON.parse(JSON.stringify(h)).sort(),d=Math.max(h.length,u[u.length-1].length),oldSize = this.size;
        Engine.applySize("size",d);
        if (oldSize != this.size || init)
        {
          this.pattern = new Map();
          this.buildData(dismiss_history);
          let tb="";
          for (let i=0;i<this.size;i++)
          {
            tb+="<tr>";
            for (let j=0;j<this.size;j++)
            {
              let wh=Number((h[i]||[])[j])||0;
              if (wh!=0)
              {
                this.pattern.set(`${i}-${j}`,wh);
                this.data[i][j]=wh;
              }
              tb+=`<td id='p${i}-${j}' onclick = 'Misc.modify(${i},${j});' oncontextmenu='Misc.modify(${i},${j},0);' onmouseover='Misc.viewXY(${i},${j});' onmousedown='Misc.startTrail(${i},${j});' onmouseup='Misc.stopTrail()'><img class='ASFilter'src='Asteroid.png' draggable=false ondragstart="return false;" height='${wh*3}' width='${wh*3}'></td>`;
            }
            tb+="</tr>";
          }
          this.map.html(tb);
          this.map.css("width",(this.size*42).toString()+"px");
          if (!dismiss_history) this.pushSession("history",["n",prev]);
        }
        else
        {
          let session = new Map();
          for (let i=0;i<oldSize;i++)
            for (let j=0;j<oldSize;j++)
            {
              let gh=Number((h[i]||[])[j])||0;
              let data = this.updateCell(i,j,gh);
              if (data.changed) session.set(`${i}-${j}`,[data.prev,gh]);
            }
          if (!dismiss_history) this.pushSession("history",["m",session]);
        }
        this.sync();
        Engine.applyColor("as-color");
        this.future = [];
      }
      else check=false;
      return check;
    },
    create: function(dms)
    {
      this.buildData(dms);
      this.load(null,1,1);
    },
    clear: function() {
      let session = new Map();
      for (let i of this.pattern.keys())
      {
        let pos = i.split("-").map(x => Number(x));
        session.set(i,[this.pattern.get(i),0]);
        this.updateCell(...pos, 0);
      }
      this.pushSession("history",["m",session]);
      this.sync();
    },
    export: function (type) {
      let str=[],map=this.data;
      switch(type.toLowerCase())
      {
        case "plain":
          for (let i of map)
          {
            let d="";
            for (let j=0;j<i.length-1;j++) d+=i[j]||" ";
            d+=i[i.length-1]||" ";
            str.push(d);
          }
          return '"'+str.join('\\n"+\n"')+'";';
        case "url":
          let prevs,dups=0;
          for (let i=0;i<map.length;i++)
          {
            let d="",prev=map[i][0],dup=1,t=map[i],nqg = 0,cg = i == map.length -1;
            for (let j=1;j<t.length;j++)
            {
              let nq=0,c= j == t.length -1;
              if (t[j] === prev) dup++;
              else nq = 1;
              if (nq || c)
              {
                if (dup<4) d+=Array(dup).fill(prev).join("");
                else d+=prev+"t"+dup+"d";
                if (nq&&c) d+=t[j];
                prev=t[j];
                dup=1;
              }
            }
            if (prevs === void 0) prevs = d;
            if (prevs == d) dups++;
            else nqg = 1;
            if (nqg || cg)
            {
                if (dups==1) str.push(prevs);
                else str.push("l"+prevs+"n"+dups);
                if (nqg&&cg) str.push(d);
                prevs=d;
                dups=1;
            }
          }
          return str.join("e");
      }
    },
    import: function (type, data, init) {
      let map,fail = 0;
      switch (type)
      {
        case "plain":
          let parse;
          try {
            eval("parse=function(){return  "+data.replace(/^(var|let|const)/g,"")+"}");
            if (typeof parse() != 'string') throw "Not a string";
            else map=parse().split("\n");
          }
          catch(e){fail=1}
          break;
        case "url":
          let smap=decodeURI(data).split('e');
          map=[];
          for (let i of smap)
          {
            let repeat=false,qstr=i.replace(/l(.+)n\d+/,"$1");
            qstr=qstr.replace(/\dt\d+d/g,function(v){
              let qd="";
              for (let j=0;j<Number(v.replace(/\dt(\d+)d/g,"$1"));j++) qd+=v[0];
              return qd;
            });
            map.push(qstr);
            i.replace(/l.+n\d+/,function(v){repeat=true});
            if (repeat)
              for (let j=0;j<Number(i.replace(/l.+n(\d+)/,"$1"))-1;j++) map.push(qstr);
          }
          break;
      }
      if (fail) alert("Invalid Map!");
      else if (!this.load(map,init)) alert("Invalid Map!");
    },
    pushSession: function(frame,session)
    {
      let life = this[frame], i = ["history", "future"].indexOf(frame), u = [life.length - 1, 0], action = ["push", "unshift"];
      return (JSON.stringify(life[u[i]]||"") !== JSON.stringify(session)) && life[action[i]](session);
    },
    modify: function(x,y,num = this.Asteroids.size) {
      let br=Engine.Brush.size;
      for (let i=x-br;i<=x+br;i++)
        for (let j=y-br;j<=y+br;j++)
        {
          let data = this.updateCell(i,j,num);
          if (data.changed) this.session.set(`${i}-${j}`,[data.prev,num]);
        }
      this.future = [];
      this.sync();
    },
    updateCell: function(x,y,num) {
      let element=$(`#p${x}-${y} > img`),prev=this.data[x][y];
      if (element.length && this.data[x][y] != num)
      {
        element.width(num*3);
        element.height(num*3);
        if (num == 0) this.pattern.delete(`${x}-${y}`);
        else this.pattern.set(`${x}-${y}`,num);
        this.data[x][y]=num;
        return {changed: true, prev: prev};
      }
      else return {changed:false};
    },
    sync: function () {
      localStorage.setItem("map",JSON.stringify(this.data));
    },
    undo: function() {
      if (!this.history.length) return;
      let lastAction = this.history[this.history.length-1];
      switch(lastAction[0])
      {
        case "m":
          this.pushSession("future",lastAction);
          let actions = lastAction[1];
          for (let i of actions.keys())
          {
            let pos = i.split("-").map(x => Number(x));
            this.updateCell(...pos,actions.get(i)[0]);
          }
          break;
        case "n":
          this.pushSession("future",["n",this.data]);
          this.load(lastAction[1],null,1);
          break;
      }
      this.sync();
      this.history.splice(this.history.length-1,1);
    },
    redo: function() {
      if (!this.future.length) return;
      let futureAction = this.future[0];
      switch(futureAction[0])
      {
        case "m":
          this.pushSession("history",futureAction);
          let actions = futureAction[1];
          for (let i of actions.keys())
          {
            let pos = i.split("-").map(x => Number(x));
            this.updateCell(...pos,actions.get(i)[1]);
          }
          break;
        case "n":
          this.pushSession("history",["n",this.data]);
          this.load(futureAction[1],null,1);
          break;
      }
      this.sync();
      this.future.splice(0,1);
    },
    Asteroids: {
      changeSize: function (num) {
        let u=Engine.applySize("as_size",num);
        for (let i=0;i<=9;i++) $(`#asc${i}`).css({"border":"1px solid"});
        $(`#asc${u}`).css({"border":"3px solid"});
        Engine.applyColor("border-color");
      }
    },
    randomMaze: function (size)
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
    },
    viewXY: function (x,y) {
      let d= this.data[x][y],gl="No Asteroids";
      if (d) gl="Asteroid size: "+d.toString();
      $("#XY").html(`(${x+1};${y+1}). ${gl}`);
      (Engine.trail != -1) && this.modify(x,y,Engine.trail);
    }
  }, Engine = {
    trail: -1,
    applyColor: function (param,inp) {
      let css,defl = ["default","inherit","initial"].indexOf((inp||"").toLowerCase())!=-1;
      if (inp == void 0 || defl)
      {
        if ((localStorage[param]||"undefined") == "undefined"  || defl)
          switch(param.toLowerCase())
          {
            case "background-color":
            case "as-color":
              css="rgb(24,26,27)";
              break;
            case "border-color":
              css="rgb(102,102,102)";
              break;
          }
        else css=localStorage[param];
      }
      else css=inp;
      let elem="";
      switch (param.toLowerCase())
      {
        case "background-color":
          elem='body';
          break;
        case "border-color":
          elem='td';
          break;
        case "as-color":
          elem='#color-test';
          break;
      }
      let rp = (param=="as-color")?"color":param;
      $(elem).css(rp,css);
      rp = (rp=="border-color")?"border-block-start-color":rp;
      css=window.getComputedStyle($(elem)[0])[rp];
      (rp == "color") && $(".ASFilter").css("filter",`opacity(0.5) drop-shadow(${css} 0px 0px 0px)`);
      $("#"+param).val(css);
      localStorage.setItem(param,css);
      if (param == "background-color") $('body').css("color",css.replace(/\d+/g, function(v){return 255-Number(v)}));
      return css;
    },
    applySize: function (key,num) {
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
      if (key == "size")
      {
        size = Math.round(size/2) *2;
        StarblastMap.sizeInput.val(size);
        StarblastMap.size = size;
      }
      else StarblastMap.Asteroids.size = size;
      localStorage.setItem(key,size);
      return size;
    },
    Brush: {
      input: $("#brush_size"),
      size: 0,
      applySize: function (num = (Number(localStorage.brush)||0)) {
        let max=StarblastMap.size;
        let size=Math.round(num);
        size=Math.max(Math.min(max,size),0);
        this.input.val(size);
        this.size = size;
        localStorage.setItem("brush",size);
      },
    },
    copyToClipboard: function (text = "") {
        var dummy = document.createElement("textarea");
        document.body.appendChild(dummy);
        dummy.value = text;
        dummy.select();
        document.execCommand("copy");
        document.body.removeChild(dummy);
    },
    download: function (filename, text = "") {
      var element = document.createElement('a');
      element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
      element.setAttribute('download', filename);

      element.style.display = 'none';
      document.body.appendChild(element);

      element.click();

      document.body.removeChild(element);
    },
    permalink: function(newMap = "")
    {
      return `${window.location.protocol}//${window.location.host}${window.location.pathname}${(newMap)?"?":""}${encodeURI(newMap)}`;
    },
    setURL: function (newMap = "")
    {
      let url = this.permalink(newMap);
      window.history.pushState({path:url},'',url);
    },
    startTrail: function (x,y) {
      let e = window.event;
      switch (e.which) {
        case 1:
          this.trail=StarblastMap.Asteroids.size;
          StarblastMap.modify(x,y,this.trail);
          break;
        case 3:
          this.trail=0;
          StarblastMap.modify(x,y,0);
          break;
      }
    },
    stopTrail: function()
    {
      this.trail = -1;
      StarblastMap.pushSession("history",["m",StarblastMap.session]);
      StarblastMap.session = new Map();
    },
    menu: $("#menu")
  }
  Object.assign(StarblastMap.Asteroids,{
    color: Engine.applyColor("as-color"),
    size: Engine.applySize("as_size")
  });
  window.Misc = {
    startTrail: Engine.startTrail.bind(Engine),
    stopTrail: Engine.stopTrail.bind(Engine),
    viewXY: StarblastMap.viewXY.bind(StarblastMap),
    modify: StarblastMap.modify.bind(StarblastMap),
    changeASSize: StarblastMap.Asteroids.changeSize.bind(StarblastMap)
  }
  let querymap=window.location.search.replace(/^\?/,""),error=0;
  if (querymap === "") error = 1;
  else
  {
    if (confirm("Map pattern from URL detected!\nLoad the map?")) StarblastMap.import("url",querymap,1);
    else error=1;
    Engine.setURL();
  }
  if (error)
  {
    let fail = 0;
    try{
      let storageMap = JSON.parse(localStorage.map);
      if (Array.isArray(storageMap)) StarblastMap.data = storageMap;
      else throw "Nope";
    }
    catch(e){fail = 1}
    if (fail) StarblastMap.create(1);
    else StarblastMap.load(null,1,1);
  }
  let cas=`<tr><td id="asc0" onclick="Misc.changeASSize(0);" style="color:rgb(255,255,255);" onmouseover="viewinfo(null,'Remove asteroids in the map (Hotkey 0)')"><i class="fa fa-fw fa-eraser ASFilter"></i></td>`;
  for (let i=1;i<=9;i++) cas+=`<td id='asc${i}' onclick = 'Misc.changeASSize(${i});' onmouseover='viewinfo(null,"Asteroid size ${i} (Hotkey ${i})")'><img class='ASFilter' src='Asteroid.png' draggable=false ondragstart="return false;" height='${i*3}' width='${i*3}'></td>`;
  $("#asChoose").html(cas+"</tr>");
  Engine.Brush.applySize();
  StarblastMap.Asteroids.changeSize();
  StarblastMap.Buttons.randomMaze.on("mouseover", function() {
    viewinfo('RandomMazeGenerator', 'Generate Random Maze according to the current map size. By <a href = "https://github.com/rvan-der" target="_blank">@rvan_der</a>');
  });
  new ResizeSensor(Engine.menu[0], function(){
      StarblastMap.map.css("padding-top",Engine.menu.height()+"px")
  });
  StarblastMap.sizeInput.on("change",function(){
    Engine.applySize("size",StarblastMap.sizeInput.val());
    StarblastMap.create();
  });
  StarblastMap.Buttons.clear.on("click",StarblastMap.clear.bind(StarblastMap));
  Engine.Brush.input.on("change", function() {
    Engine.Brush.applySize($("#brush_size").val());
  });
  for (let i of ["border","background","as"])
  {
    Engine.applyColor(i+"-color");
    $("#"+i+"-color").on("change", function(){
      Engine.applyColor(i+"-color",$("#"+i+"-color").val());
    });
  }
  StarblastMap.Buttons.export.on("click",function() {
    var text=StarblastMap.export("plain");
    var d=new Date();
    var suff=d.getFullYear().toString()+(d.getMonth()+1).toString()+d.getDate().toString()+d.getHours().toString()+d.getMinutes().toString()+d.getSeconds().toString();
    Engine.download("starblast-map_" + suff, text);
  });
  StarblastMap.Buttons.randomMaze.on("click", function() {
    StarblastMap.load(StarblastMap.randomMaze(StarblastMap.size).split("\n"));
  });
  StarblastMap.Buttons.copy.on("click", StarblastMap.copy.bind(StarblastMap)("plain"));
  StarblastMap.Buttons.import.on("change", function(e) {
    let file=e.target.files[0];
    if (file.type.match("plain") || file.type.match("javascript")) {
      let fr = new FileReader();
      fr.onload = (function(reader)
      {
          return function()
          {
              StarblastMap.import("plain",reader.result);
          }
      })(fr);
      fr.readAsText(file);
    }
    else alert("Unsupported file format!");
    StarblastMap.Buttons.import.val("");
  });
  document.onkeydown = function(e)
  {
    let size=["brush_size","map_size","background-color","border-color","as-color"],check=[];
    for (let i of size) check.push($("#"+i).is(":focus"));
    if (!Math.max(...check))
    {
      if (e.ctrlKey == true) switch(e.which)
      {
        case 122:
        case 90:
          StarblastMap.undo();
          break;
        case 121:
        case 89:
          StarblastMap.redo();
          break;
        case 115:
        case 83:
          e.preventDefault();
          StarblastMap.Buttons.export.click();
          break;
      }
      else switch (e.which)
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
  }
  StarblastMap.Buttons.permalink.on("click", function(){
    let map = StarblastMap.export("url");
    Engine.setURL(map);
    StarblastMap.copy("url");
  });
  for (let i of ["brush_size","map_size","border-color","background-color"])
  $("#"+i).on("keypress",function(e){if (e.which == 13) $("#"+i).blur()});
  let states=["dark","light"];
  if (!window.matchMedia) document.querySelector("link").href=`icon_light.png`;
  else for (let state of states) if (window.matchMedia(`(prefers-color-scheme: ${state})`).matches) document.querySelector("link").href=`icon_${state}.png`;
}());
