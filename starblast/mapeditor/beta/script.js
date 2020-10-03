(function(){
  var StarblastMap = {
    map: $("#map")[0],
    sizeInput: $("#map_size"),
    Buttons: {
      export:
      {
        text: $("#exportText"),
        image: $("#exportImage")
      },
      clear: $("#clearMap"),
      randomMaze: $("#random"),
      import: $("#loadMap"),
      copy: {
        text: $("#copyText"),
        image: $("#copyImage")
      },
      permalink: $("#permalink"),
      undo: $("#undo"),
      redo: $("#redo")
    },
    Coordinates: {
      lastVisited: [-1,-1],
      lastViewed: [-1,-1],
      view: function (x,y) {
        if (this.lastViewed[0]!=x || this.lastViewed[1]!=y)
        {
          let d= StarblastMap.data[y][x],gl="No Asteroids";
          if (d) gl="Asteroid size: "+d.toString();
          $("#XY").html(`(${y};${x}). ${gl}`);
          this.lastViewed = [x,y];
        }
        if (this.lastVisited[0]!=x || this.lastVisited[1]!=y)
        {
          if (Engine.Trail.state == 0) StarblastMap.modify(x,y,0);
          else if (Engine.Trail.state == 1) StarblastMap.modify(x,y);
          if (Engine.Trail.state != -1) this.lastVisited = [x,y];
        }
      },
      get: function (pos) {
        return Math.max(Math.min(~~((pos-4)/40),StarblastMap.size-1),0);
      }
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
    background: {
      options: $("#bgI-menu"),
      clear: $("#bgI-clear"),
      urlImport: $("#bgI-url"),
      upload: $("#bgI-input"),
      globalIndicator: $("#bgI-global"),
      apply: function(url,...con) {
        let elems = ['body','#map'];
        url = url || this.image;
        con.map((c,i) => $(elems[i]).css("background-image",(c&&url)?`url(${url})`:""));
      },
      checkGlobal: function() {
        let sign=["times","check"], u = this.globalIndicator.is(":checked");
        this.global = u;
        $("#bgI-global-ind").prop("class","fas fa-fw fa-"+sign[Number(u)]);
        localStorage.setItem("global-background-image",u);
        $("#bgI-global1")[0].onmouseover = function(){Engine.info.view(null,"Adjust background image for "+(u?"map only":"the whole tool"))}
        StarblastMap.background.apply(null,this.global,!this.global);
      },
      check: function(url, forced, init) {
        url = (forced)?(url||""):(url || localStorage.getItem("background-image") || "");
        if (url) {
          let img = new Image();
          img.onload = function() {
            StarblastMap.background.options.css("display","block");
            StarblastMap.background.image = url;
            localStorage.setItem("background-image",url);
            StarblastMap.background.apply(url,this.global,!this.global);
          }
          img.onerror = function() {
            alert("An error occured!\nPlease try again later!");
          }
          img.src = url;
        }
        else if (forced || init) {
          this.options.css("display","none");
          localStorage.setItem("background-image","");
          this.image = "";
          StarblastMap.background.apply(null,this.global,!this.global);
        }
      }
    },
    copy: async function(type) {
      let map;
      switch (type)
      {
        case "plain":
          map = new Blob([this.export("plain")],{type:"text/plain"});
          break;
        case "url":
          map = new Blob([Engine.permalink(this.export("url"))],{type:"text/plain"});
          break;
        case "image":
          const t = await window.fetch(this.export("image"));
          map = await t.blob();
          break;
      }
      Engine.copyToClipboard(map);
    },
    download: function (type) {
      let map;
      switch (type)
      {
        case "plain":
          map = 'data:text/plain;charset=utf-8,' + encodeURIComponent(this.export("plain"));
          break;
        case "image":
          map = this.export("image");
          break;
      }
      Engine.download(null,map);
    },
    load: function(data,init,dismiss_history) {
      let prev = this.data,h=data||prev;check=true;
      if (Array.isArray(h))
      {
        let u=JSON.parse(JSON.stringify(h)).sort(),d=Math.max(h.length,u[u.length-1].length),oldSize = this.size;
        StarblastMap.applySize(d);
        if (oldSize != this.size || init)
        {
          this.pattern = new Map();
          this.buildData(dismiss_history);
          let c2d = this.map.getContext('2d');
          c2d.clearRect(0,0,this.map.width, this.map.height);
          this.map.width = this.size*40+8;
          this.map.height = this.size*40+8;
          c2d.beginPath();
          for (let i=0;i<this.size;i++)
          {
            for (let j=0;j<this.size;j++)
            {
              let wh=Number((h[i]||[])[j])||0;
              if (wh!=0)
              {
                this.pattern.set(`${i}-${j}`,wh);
                this.data[i][j]=wh;
              }
            }
          }
          c2d.stroke();
          Engine.applyColor("border-color");
          Engine.applyColor("as-color");
          $("#mapBox").css("width",(this.size*40+8).toString()+"px");
          (!dismiss_history) && this.pushSession("history",["n",prev]);
        }
        else
        {
          let session = new Map();
          for (let i=0;i<oldSize;i++)
            for (let j=0;j<oldSize;j++)
            {
              let gh=Number((h[i]||[])[j])||0;
              let data = this.Asteroids.modify(i,j,gh);
              if (data.changed) session.set(`${i}-${j}`,[data.prev,gh]);
            }
          (!dismiss_history) && this.pushSession("history",["m",session]);
        }
        this.sync();
        Engine.Brush.applySize();
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
        this.Asteroids.modify(...pos, 0);
      }
      this.pushSession("history",["m",session]);
      this.sync();
    },
    export: function (type, data) {
      let str=[],map=data||this.data;
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
          str = LZString.compressToEncodedURIComponent(str.join("e"));
          let str1 = LZString.compressToEncodedURIComponent(map.map(i=>i.join("")).join("e"));
          return `map=${(str.length<=str1.length)?str:str1}`;
        case "image":
          let clone = document.createElement('canvas');
          let c2d = clone.getContext('2d');
          clone.width = this.map.width;
          clone.height = this.map.height;
          c2d.drawImage(this.map, 0, 0);
          c2d.fillStyle = Engine.applyColor("background-color");
          c2d.globalCompositeOperation = "destination-over";
          c2d.fillRect(0,0,clone.width,clone.height);
          return clone.toDataURL();
      }
    },
    import: function (type, data, init, exportData) {
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
          data = LZString.decompressFromEncodedURIComponent(data);
        case "url-old":
          let smap=data.split('e');
          map=[];
          for (let i of smap)
          {
            let repeat=false,qstr=i.replace(/l(.+)n\d+/,"$1");
            qstr=qstr.replace(/\dt\d+d/g,function(v){
              let qd="";
              for (let j=0;j<Number(v.replace(/\dt(\d+)d/g,"$1"));j++) qd+=v[0];
              return qd;
            }).split("").map(i=>Number(i)||0);
            map.push(qstr);
            i.replace(/l.+n\d+/,function(v){repeat=true});
            if (repeat)
              for (let j=0;j<Number(i.replace(/l.+n(\d+)/,"$1"))-1;j++) map.push(qstr);
          }
          fail = map.length != Math.max(...map.map(i => i.length)) || map.length != Math.min(...map.map(i => i.length));
          break;
      }
      if (exportData) return {map:map,fail:fail}
      if (!fail) fail = !this.load(map,init);
      if (fail) alert("Invalid Map!");
    },
    checkActions: function()
    {
      this.Buttons.undo.prop("disabled",!this.history.length);
      this.Buttons.redo.prop("disabled",!this.future.length);
    },
    pushSession: function(frame,session,soft)
    {
      let life = this[frame], i = ["history", "future"].indexOf(frame), u = [life.length - 1, 0],data = life[u[i]]||[], action = ["push", "unshift"];
      try {
        if (!(data[0] == session[0] && JSON.stringify([...data[1]]) == JSON.stringify([...session[1]])) && (session[1].size || session[1].length))
        {
          life[action[i]](session);
          if (frame == "history" && !soft) this.future = [];
          this.checkActions();
        }
      }
      catch(e){}
    },
    modify: function(x,y,num) {
      let br=Engine.Brush.size,c = num == void 0,init;
      if (c) init = Engine.random.range(this.Asteroids.size.min,this.Asteroids.size.max);
      for (let i=Math.max(y-br,0);i<=Math.min(y+br,this.size-1);i++)
        for (let j=Math.max(x-br,0);j<=Math.min(x+br,this.size-1);j++)
        {
          let size = (c)?((Engine.Brush.randomized)?Engine.random.range(this.Asteroids.size.min,this.Asteroids.size.max):init):num,list= [[i,j]];
          if (Engine.Mirror.v) list.push([this.size-i-1,j]);
          if (Engine.Mirror.h) list.push([i,this.size-j-1]);
          if (Engine.Mirror.v && Engine.Mirror.h) list.push([this.size-i-1,this.size-j-1]);
          for (let k of list)
          {
            let data = this.Asteroids.modify(...k,size);
            if (data.changed){
              let pos = k.join("-"), prev = this.session.get(pos);
              this.session.set(pos,[(prev)?prev[0]:data.prev,size]);
            }
          }
        }
      this.sync();
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
            this.Asteroids.modify(...pos,actions.get(i)[0]);
          }
          break;
        case "n":
          this.pushSession("future",["n",this.data]);
          this.load(lastAction[1],null,1);
          break;
      }
      this.sync();
      this.history.splice(this.history.length-1,1);
      this.checkActions();
    },
    redo: function() {
      if (!this.future.length) return;
      let futureAction = this.future[0];
      switch(futureAction[0])
      {
        case "m":
          this.pushSession("history",futureAction,1);
          let actions = futureAction[1];
          for (let i of actions.keys())
          {
            let pos = i.split("-").map(x => Number(x));
            this.Asteroids.modify(...pos,actions.get(i)[1]);
          }
          break;
        case "n":
          this.pushSession("history",["n",this.data],1);
          this.load(futureAction[1],null,1);
          break;
      }
      this.sync();
      this.future.splice(0,1);
      this.checkActions();
    },
    Asteroids: {
      RandomOptions: $("#RandomOptions"),
      template: new Image(),
      modify: function(x,y,num,init) {
        let prev=(StarblastMap.data[x]||[])[y]||-1;
        if (prev != num || init)
        {
          let c2d = StarblastMap.map.getContext('2d');
          c2d.clearRect(y*40+6,x*40+6,36,36);
          c2d.beginPath();
          c2d.drawImage(this.template,y*40+4+(40-num*3)/2,x*40+4+(40-num*3)/2,num*3,num*3);
          c2d.fillStyle = this.color;
          c2d.globalCompositeOperation = "source-atop";
          c2d.fillRect(y*40+6,x*40+6,36,36);
          c2d.globalCompositeOperation = "source-over";
          if (num == 0) StarblastMap.pattern.delete(`${x}-${y}`);
          else StarblastMap.pattern.set(`${x}-${y}`,num);
          StarblastMap.data[x][y]=num;
          return {changed: true, prev: (prev == -1)?0:prev};
        }
        else return {changed:false};
      },
      drawSelection: function (i) {
        let c = $("#as"+i)[0];
        if (c)
        {
          c.width = 36;
          c.height = 36;
          let c2d = c.getContext('2d');
          c2d.clearRect(0,0,c.width,c.height);
          c2d.beginPath();
          c2d.drawImage(this.template,(36-i*3)/2,(36-i*3)/2,i*3,i*3);
          c2d.fillStyle = this.color;
          c2d.globalCompositeOperation = "source-atop";
          c2d.fillRect(0,0,c.width,c.height);
          c2d.globalCompositeOperation = "source-over";
        }
      },
      changeSize: function (num) {
        let u=Math.min(Math.max(Number(num)||0,0),9);
        for (let i=0;i<=9;i++) $(`#asc${i}`).css({"border":"1px solid"});
        $("#randomSize").css("border","1px solid");
        $(`#asc${u}`).css({"border":"3px solid"});
        for (let i in this.input) this.input[i].val(u);
        this.applyKey("min",u);
        this.applyKey("max",u);
        this.RandomOptions.css("display","none");
        Engine.applyColor("border-color");
      },
      input: {
        max: $("#maxASSize"),
        min: $("#minASSize")
      },
      applyKey: function(key,num){
        let size = Math.min(Math.max(Number(num)||0,0),9);
        this.size[key] = size;
        localStorage["ASSize_"+key] = size;
        this.input[key].val(size);
      },
      randomSize: function(self_trigger,local)
      {
        this.RandomOptions.css("display","block");
        for (let i=0;i<9;i++) for (let i=0;i<=9;i++) $(`#asc${i}`).css({"border":"1px solid"});
        $("#randomSize").css({"border":"3px solid"});
        let min = this.changeSize.applySize("min"), max = this.changeSize.applySize("max");
        if (min > max)
        {
          if (local == "min") min = max;
          else max = min;
        }
        if (local) this.applyKey(local,(local=="min")?min:max);
        else
        {
          this.applyKey("min",min);
          this.applyKey("max",max);
        }
        (self_trigger && this.size.max == this.size.min) && this.changeSize(this.size.min);
        Engine.applyColor("border-color");
      },
      size:{
        max: 0,
        min: 0
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
    applySize: function (num) {
      let dsize= {
        min:20,
        max:200
      }
      let size=Math.round((num != void 0)?num:(Number(localStorage.size)||dsize.min));
      size=Math.max(Math.min(dsize.max,size),dsize.min);
      size = Math.round(size/2) *2;
      StarblastMap.sizeInput.val(size);
      StarblastMap.size = size;
      localStorage.size = size;
      return size;
    }
  }, Engine = {
    supportClipboardAPI: !!(window.Clipboard && window.ClipboardItem),
    Trail: {
      state: -1,
      stop: function ()
      {
        this.state = -1;
        StarblastMap.Coordinates.lastVisited = [-1,-1];
        StarblastMap.pushSession("history",["m",StarblastMap.session]);
        StarblastMap.session = new Map();
      },
      start: function (x,y,event) {
        switch (event.button) {
          case 0:
            this.state=1;
            StarblastMap.modify(x,y);
            break;
          case 2:
            this.state=0;
            StarblastMap.modify(x,y,0);
            break;
        }
        StarblastMap.future = [];
        StarblastMap.Buttons.redo.prop("disabled",true);
        StarblastMap.Coordinates.lastVisited = [x,y];
      }
    },
    addBorder: function (c2d,x,y,z,t)
    {
      c2d.clearRect(x-1,y-1,z-x+2,t-y+2);
      c2d.moveTo(x,y);
      c2d.lineTo(z,t);
    },
    applyColor: function (para,inp) {
      let css,defl = ["default","inherit","initial"].indexOf((inp||"").toLowerCase())!=-1,param = para.toLowerCase();
      if (inp == void 0 || defl)
      {
        if ((localStorage[param]||"undefined") == "undefined"  || defl)
          switch(param)
          {
            case "background-color":
              css="rgb(24,26,27)";
              break;
            case "border-color":
            case "as-color":
              css="rgb(102,102,102)";
              break;
          }
        else css=localStorage[param];
      }
      else css=inp;
      let elem="",rp;
      switch (param)
      {
        case "background-color":
          elem='body';
          rp = param;
          break;
        case "border-color":
        case "as-color":
          rp = "color";
          elem = "#color-test"+["as-color","border-color"].indexOf(param);
          break;
      }
      let prcss = window.getComputedStyle($(elem)[0])[rp];
      $(elem).css(rp,css);
      css=window.getComputedStyle($(elem)[0])[rp];
      switch (param)
      {
        case "as-color":
          if (window.getComputedStyle($('body')[0])["background-color"] == css)
          {
            css = (prcss == css)?"rgb(102,102,102)":prcss;
            $(elem).css(rp,css);
          }
          StarblastMap.Asteroids.color = css;
          for (let i of [...StarblastMap.pattern]) StarblastMap.Asteroids.modify(...i[0].split("-"),i[1],1);
          for (let i=1;i<10;i++) StarblastMap.Asteroids.drawSelection(i);
          break;
        case "background-color":
          let color = css.replace(/\d+/g, function(v){return 255-Number(v)});
          $('body').css("color",color);
          StarblastMap.background.color = color;
          break;
        case "border-color":
          let c2d = StarblastMap.map.getContext('2d'), size = StarblastMap.size;
          c2d.beginPath();
          c2d.strokeStyle = css;
          c2d.lineWidth = 1;
          for (let i=0;i<=size;i++)
          {
            this.addBorder(c2d,i*40+4,4,i*40+4,size*40+4);
            this.addBorder(c2d,4,i*40+4,size*40+4,i*40+4);
          }
          c2d.stroke();
          $('td').css(param,css);
      }
      $("#"+param).val(css);
      localStorage.setItem(param,css);
      return css;
    },
    Brush: {
      input: $("#brush_size"),
      randomCheck: $("#randomCheck"),
      randomized:false,
      applyRandom: function() {
        let sign=["times","check"];
        let u = this.randomCheck.is(":checked");
        this.randomized = u;
        $("#rInd").prop("class","fas fa-fw fa-"+sign[Number(u)]);
        localStorage.randomizedBrush = u;
      },
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
    Mirror: {
      apply: function (p) {
        let sign=["times","check"],elem = $("#almr");
        let u = $("#mirror-"+p).is(":checked");
        this[p] = u;
        $("#mrmark-"+p).prop("class","fas fa-fw fa-"+sign[Number(u)]);
        localStorage["mirror_"+p] = u;
        if (this.v && this.h)
        {
          elem.prop("class","fas fa-fw fa-expand-arrows-alt");
          elem[0].onmouseover = function(){Engine.info.view(null,"All-Corners mirror is enabled")};
        }
        else {
          elem.prop("class","fas fa-fw fa-question");
          elem[0].onmouseover = function(){Engine.info.view(null,"A secret function is disabled")};
        }
      },
      v:false,
      h:false
    },
    generateName: function() {
      return "starblast-map_" + Date.now();
    },
    copyToClipboard: async function (blob)
    {
      await navigator.clipboard.write([new ClipboardItem({[blob.type]:blob})]);
    },
    download: function (name, data) {
      var element = document.createElement('a');
      element.setAttribute('href', data);
      element.setAttribute('download', name || Engine.generateName());

      element.style.display = 'none';
      document.body.appendChild(element);

      element.click();

      document.body.removeChild(element);
    },
    permalink: function(newMap = "")
    {
      return `${window.location.protocol}//${window.location.host}${window.location.pathname}${(newMap)?"?":""}${newMap}`;
    },
    setURL: function (newMap = "")
    {
      let url = this.permalink(newMap);
      window.history.pushState({path:url},'',url);
    },
    menu: $("#menu"),
    random: function(num) {
      return ~~(Math.random()*num);
    },
    info: {
      list: [
        ["map",null,"Left-click to apply asteroid, right-click to remove, drag for trails"],
        ["map_size",null,'Toggle map size (from 20 to 200 and must be even)'],
        ["asc0",null,'Remove asteroids in the map (Hotkey 0)'],
        ...new Array(9).fill(0).map((j,i) => [`asc${i+1}`,null,`Asteroid size ${i+1} (Hotkey ${i+1})`]),
        ["randomSize",'Random Asteroid Size','Draw random asteroids in a specific size range (Hotkey R)'],
        ["brush_size",null,'Toggle brush radius (0 to current map size)'],
        ["minASSize",null,'Toggle minimum Asteroid size (0 to Maximum Asteroid Size)'],
        ["maxASSize",null,'Toggle maximum Asteroid size (Minimum Asteroid Size to 9)'],
        ["mr-h",null,"Toggle horizontal Mirror"],
        ["mr-v",null,"Toggle vertical Mirror"],
        ["rCheckIcon",'Random Asteroid Size in Brush','Random Asteroids Size in a single Brush'],
        ["as-color",null,'Toggle asteroid color'],
        ["background-color",null,'Toggle background color'],
        ["bgI-input1",null,"Upload your own background image from file (accept all image formats)"],
        ["bgI-url",null,"Upload your own background image from url"],
        ["bgI-clear",null,"Clear current custom background image"],
        ["border-color",null,'Toggle line color'],
        ["undo","Undo","Undo previous actions in the map"],
        ["redo","Redo","Redo undid actions in the map"],
        ["clearMap",'Clear Map','Clear all asteroids in the current map'],
        ["exportText",'Export Map as Text','Export map as a text/plain (*.txt) file (Hotkey Ctrl + S)'],
        ["copyText",'Copy Map','Copy current map pattern to clipboard'],
        ["loadMap1",'Import Map','Import map from file (accept text/plain (*.txt/*.text) and text/javascript (*.js) format)'],
        ["random",'RandomMazeGenerator', 'Generate Random Maze according to the current map size. By <a href = "https://github.com/rvan-der" target="_blank">@rvan_der</a>'],
        ["feedback",'Feedback','Give us a feedback'],
        ["permalink",'Permalink','Copy permalink to clipboard'],
        ["exportImage",'Export Map as Image','Export map screenshot as a PNG (*.png) file (HotKey Ctrl + I)'],
        ["copyImage",'Copy Map screenshot','Copy Map screenshot as as a PNG (*.png) file to Clipboard'],
        ["tutorial",'Tutorial','Visit the Map Editor Tutorial Page'],
        ["changelog",'Changelog',"View the update's log of Map Editor from the beginning"],
        ["XY",null,'Your cursor position in the map. Hover the map for details']
      ],
      view: function (title,text) {
        $("#info").html(`<strong>${title?title+": ":""}</strong>${text||""}`);
      }
    }
  }
  Object.assign(StarblastMap.Asteroids.changeSize,{
    applySize: function(key)
    {
      return Math.min(Math.max(0,Number($("#"+key+"ASSize").val())||0),9);
    }
  });
  Object.assign(Engine.random, {
    range: function(min,max)
    {
      return Number(min+this(max-min+1))||min;
    }
  });
  let query=window.location.search.replace(/^\?/,"").split("="),error,initmap=[];
  if (error = query[0] === "", !error)
  {
    switch (query[0].toLowerCase())
    {
      case "map":
        let datamap;
        try{error = StarblastMap.import("url",query[1],0,1).fail}catch(e){error=1};
        if (error) {
          if (error = !confirm("You are using the old permalink method.\nDo you want to go to the new one?"), !error) {
            window.open("?"+StarblastMap.export("url",StarblastMap.import("url-old",query[1],0,1).map),"_self");
            return;
          }
        }
        else (error = !confirm("Map pattern from URL detected!\nLoad map?\n(Note: this action cannot be undone)"), !error);
        break;
      case "feedback":
        $("title")[0].innerHTML = "Redirecting...";
        window.open("https://docs.google.com/forms/d/e/1FAIpQLSe-NQ8QTj0bnX65LMT8NbO9ppEYRtgQ1Fa3AwJX-GfTFHUQSw/viewform?usp=sf_link","_self");
        return;
      default:
        if (error = !confirm("You are using the old map permalink\nWould you like to go to the new one?"), !error)
        {
          window.open('?map='+query[0],"_self");
          return;
        }
    }
  }
  Engine.setURL();
  if (!Engine.supportClipboardAPI) {
    $("#menu").append("<p style='font-size:10pt'>Copy Image is disabled. Please switch to another browser to enable this feature or <a href='/starblast/mapeditor/old.html'>go back to the old version</a>. <a href='#' id='error'>Learn more why</a></p>");
    $("#copyImage").remove();
    Engine.copyToClipboard = function(blob) {
      if (blob.type == "text/plain") {
        var reader = new FileReader();
        reader.onload = function() {
          var dummy = document.createElement("textarea");
          document.body.appendChild(dummy);
          dummy.value = reader.result;
          dummy.select();
          document.execCommand("copy");
          document.body.removeChild(dummy);
        }
        reader.readAsText(blob);

      }
    }
    $("#error").on("click",function(){
      alert("Your browser doesn't support one of the Clipboard API features using in this tool. You can visit this page for more information:\nhttps://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API")
    });
  }
  else StarblastMap.Buttons.copy.image.on("click", function(){StarblastMap.copy("image")});
  StarblastMap.Asteroids.template.onload = function()
  {
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
    else StarblastMap.import("url",query[1],1);
    for (let i=0;i<10;i++)
    {
      (i) && StarblastMap.Asteroids.drawSelection(i);
      $("#asc"+(i)).on("click", function(){StarblastMap.Asteroids.changeSize(i)});
    }
    StarblastMap.background.check(null,0,1);
  }
  Engine.applyColor("as-color");
  let see = localStorage.randomizedBrush == "true";
  Engine.Brush.randomCheck.prop("checked",see);
  Engine.Brush.applyRandom();
  let see2 = localStorage["global-background-image"] == "true";
  StarblastMap.background.globalIndicator.prop("checked",see2);
  StarblastMap.background.checkGlobal();
  StarblastMap.Asteroids.template.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAACpSURBVDhPrZQJDoUgDAWpZ9H7H0juwvfVRz/EBbWdxLAkTroA6Y5Syrp9YOXWkInjAUrmfeUEMo2r51GUwtHgj1eRZY4dIrJw2gOZxvIei/6yhi+Zq9RS5oa3CVmFQTJFImUAwsJ5BDmqKQaEOFun58sFaon0HeixiUhZM6y3JaSG7dUzITfd9ewihLQRf+Lw2lRY5OGr06Y7BFLt3x+stZufoQQ8EKX0A+4x7+epxEovAAAAAElFTkSuQmCC";
  $("#asChoose").html(`<tr><td id="asc0"><i class="fas fa-fw fa-eraser"></i></td>`+Array(9).fill(0).map((x,i) => `<td id='asc${i+1}'><canvas id="as${i+1}"></canvas></td>`).join("")+`<td id='randomSize'><i class="fas fa-fw fa-dice"></i></td></tr>`);
  let mr = ["h","v"],mdesc = ["horizontal","vertical"];
  $("#MirrorOptions").html(mr.map(i => `<input type="checkbox" style="display:none" id="mirror-${i}">`).join("")+"<table><tr>"+mr.map((i,j) => `<td id="mr-${i}"><i class="fas fa-fw fa-arrows-alt-${i}"></i><i class="fas fa-fw fa-times" id="mrmark-${i}"></i></td>`).join("")+`<td><i id="almr" class="fas fa-fw fa-expand-arrows-alt"></i></td></tr>`);
  for (let i of mr)
  {
    let see = localStorage["mirror_"+i] == "true";
    $("#mirror-"+i).prop("checked",see);
    Engine.Mirror.apply(i);
    $("#mirror-"+i).on("change",function(){Engine.Mirror.apply(i)});
    $("#mr-"+i).on("click",function(){$("#mirror-"+i).click()});
  }
  StarblastMap.Asteroids.applyKey("min",localStorage.ASSize_min);
  StarblastMap.Asteroids.applyKey("max",localStorage.ASSize_max);
  let rSize = StarblastMap.Asteroids.randomSize.bind(StarblastMap.Asteroids);
  $("#randomSize").on("click",function(){rSize()});
  Engine.Brush.applySize();
  rSize(1);
  StarblastMap.map.addEventListener("mousemove", function(e){
    StarblastMap.Coordinates.view(StarblastMap.Coordinates.get(e.offsetX),StarblastMap.Coordinates.get(e.offsetY));
  });
  StarblastMap.map.addEventListener("mousedown", function(e){
    Engine.Trail.start(StarblastMap.Coordinates.get(e.offsetX),StarblastMap.Coordinates.get(e.offsetY),e);
  });
  new ResizeSensor(Engine.menu[0], function(){
      $("#mapBox").css("padding-top",Engine.menu.height()+"px")
  });
  StarblastMap.background.upload.on("change", function(e){
    if (e.target.files && e.target.files[0]) {
      let file=e.target.files[0];
      if (file.type.match("image/")) {
        var reader = new FileReader();
        reader.onload = function (e) {
          StarblastMap.background.check(e.target.result);
        }
        reader.readAsDataURL(file);
      }
      else alert("Invalid file format!");
      StarblastMap.background.upload.val("");
    }
  });
  StarblastMap.background.urlImport.on("click",function(){
    StarblastMap.background.check(prompt("Paste your image link here"));
  });
  StarblastMap.background.clear.on("click",function(){
    StarblastMap.background.check(null,1);
  });
  StarblastMap.background.globalIndicator.on("change",StarblastMap.background.checkGlobal.bind(StarblastMap.background));
  StarblastMap.sizeInput.on("change",function(){
    StarblastMap.applySize(StarblastMap.sizeInput.val());
    StarblastMap.create();
  });
  StarblastMap.Buttons.clear.on("click",StarblastMap.clear.bind(StarblastMap));
  Engine.Brush.input.on("change", function() {
    Engine.Brush.applySize($("#brush_size").val());
  });
  StarblastMap.checkActions();
  StarblastMap.Buttons.undo.on("click",StarblastMap.undo.bind(StarblastMap));
  StarblastMap.Buttons.redo.on("click",StarblastMap.redo.bind(StarblastMap));
  Engine.Brush.randomCheck.on("change",Engine.Brush.applyRandom.bind(Engine.Brush));
  for (let i of ["border","background","as"])
  {
    Engine.applyColor(i+"-color");
    $("#"+i+"-color").on("change", function(){
      Engine.applyColor(i+"-color",$("#"+i+"-color").val());
    });
  }
  StarblastMap.Buttons.export.text.on("click",function() {
    StarblastMap.download("plain");
  });
  StarblastMap.Buttons.export.image.on("click",function() {
    StarblastMap.download("image");
  });
  StarblastMap.Buttons.randomMaze.on("click", function() {
    StarblastMap.load(StarblastMap.randomMaze(StarblastMap.size).split("\n"));
  });
  StarblastMap.Asteroids.input.max.on("change",function(){rSize(1,"max")});
  StarblastMap.Asteroids.input.min.on("change",function(){rSize(1,"min")});
  StarblastMap.Buttons.copy.text.on("click", function(){StarblastMap.copy("plain")});
  StarblastMap.Buttons.import.on("change", function(e) {
    if (e.target.files && e.target.files[0]) {
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
    }
  });
  document.onkeydown = function(e)
  {
    let size=["brush_size","map_size","background-color","border-color","as-color","maxASSize","minASSize"],check=[];
    for (let i of size) check.push($("#"+i).is(":focus"));
    if (!Math.max(...check))
    {
      if (e.ctrlKey == true) switch(e.which)
      {
        case 122:
        case 90:
          e.preventDefault();
          StarblastMap.undo();
          break;
        case 121:
        case 89:
          e.preventDefault();
          StarblastMap.redo();
          break;
        case 115:
        case 83:
          e.preventDefault();
          StarblastMap.download("plain");
          break;
        case 105:
        case 73:
          e.preventDefault();
          StarblastMap.download("image");
          break;
        case 99:
        case 67:
          e.preventDefault();
          StarblastMap.copy("plain");
          break;
        case 111:
        case 79:
          e.preventDefault();
          $("#loadMap1").click();
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
        case 114:
        case 82:
          rSize();
          break;
        default:
          if (e.which > 47 && e.which < 58) StarblastMap.Asteroids.changeSize(e.which-48);
      }
    }
  }
  window.addEventListener("mouseup", Engine.Trail.stop.bind(Engine.Trail));
  window.addEventListener("blur", Engine.Trail.stop.bind(Engine.Trail));
  StarblastMap.Buttons.permalink.on("click", function(){
    Engine.setURL(StarblastMap.export("url"));
    StarblastMap.copy("url");
  });
  for (let i of ["brush_size","map_size","border-color","background-color","minASSize","maxASSize"])
  $("#"+i).on("keypress",function(e){if (e.which == 13) $("#"+i).blur()});
  for (let i of Engine.info.list) $("#"+i[0]).on("mouseover",function(){
    Engine.info.view(i[1],i[2]);
  });
}());
