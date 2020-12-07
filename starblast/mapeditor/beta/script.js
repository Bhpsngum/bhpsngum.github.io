t = (function(){
  var StarblastMap = {
    map: $("#map")[0],
    sizeInput: $("#map_size"),
    gridIndex: 3,
    border: {
      color: "",
      hide: true,
      check: function (origin,self_trigger) {
        let u = StarblastMap.Engine.setCheckbox(origin,"border-show","borderHide","");
        this.hide = u;
        let text = (u?"Show":"Hide")+" the map border";
        $("#border-show-ind").prop("class","fas fa-fw fa-border-"+(u?"none":"all"));
        $("#border-show1")[0].onmouseover = function(){StarblastMap.Engine.info.view(null,text,"Ctrl(Cmd) + B")};
        (!self_trigger) && StarblastMap.Engine.info.view(null,text,"Ctrl(Cmd) + B");
        (!origin) && StarblastMap.Engine.applyColor("border-color");
      }
    },
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
    info: function(t) {
      return function(){StarblastMap.Engine.info.view(null,`${t?"Touch":"Left-click"} to apply asteroid, ${t?"One-finger swipe":"right-click to remove, drag"} for trails`)}
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
          if (StarblastMap.Engine.Trail.state == 0) StarblastMap.modify(x,y,0);
          else if (StarblastMap.Engine.Trail.state == 1) StarblastMap.modify(x,y);
          if (StarblastMap.Engine.Trail.state != -1) this.lastVisited = [x,y];
        }
      },
      get: function (pos) {
        return Math.max(Math.min(~~((pos-StarblastMap.gridIndex)/StarblastMap.gridIndex/10),StarblastMap.size-1),0);
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
      alphaInput: $("#bgI-alpha"),
      checkExport: function(origin) {
        let u = StarblastMap.Engine.setCheckbox(origin,"bgI-allowExport","allowExportImage","bgI-allowExport-ind");
        this.allowExport = u;
        let text = "Export the map with"+(u?"out":"")+" the background image (Only available in Map Only Selection)";
        $("#bgI-allowExport1")[0].onmouseover = function(){StarblastMap.Engine.info.view(null,text)}
        StarblastMap.Engine.info.view(null,text);
      },
      checkAlpha: function(alpha) {
        alpha = Number((alpha != void 0)?alpha:(localStorage.getItem("bgI-alpha")||1));
        this.alpha = Math.min(Math.max((isNaN(alpha)?100:alpha),0),100);
        this.alphaInput.val(this.alpha);
        localStorage.setItem("bgI-alpha",this.alpha);
        $("#mapBgI").css("opacity",this.alpha+"%");
      },
      apply: function(url,gbl,map) {
        url = url || this.image;
        $('body').css("background-image",(gbl&&url)?`url(${url})`:"");
        if (map&&url) $("#mapBgI")[0].src = url;
        else $("#mapBgI").removeAttr("src");
        $("#mapBgI").css("display",(map&&url)?"":"none");
      },
      checkGlobal: function(origin) {
        let u = StarblastMap.Engine.setCheckbox(origin,"bgI-global","global-background-image","bgI-global-ind");
        this.global = u;
        let text = "Adjust background image for "+(u?"map only":"the whole tool");
        $("#bgI-global1")[0].onmouseover = function(){StarblastMap.Engine.info.view(null,text)}
        StarblastMap.Engine.info.view(null,text);
        $("#bgI-MapOnlyOptions").css("display",u?"none":"");
        this.apply(null,u,!u);
      },
      check: function(url, forced, init) {
        url = (forced)?(url||""):(url || localStorage.getItem("background-image") || "");
        if (url) {
          let img = new Image();
          img.onload = function() {
            this.options.css("display","");
            this.image = url;
            localStorage.setItem("background-image",url);
            this.apply(url,this.global,!this.global);
          }.bind(this);
          img.onerror = function() {
            alert("An error occured!\nPlease try again later!");
          }
          img.src = url;
        }
        else if (forced || init) {
          this.options.css("display","none");
          localStorage.setItem("background-image","");
          this.image = "";
          this.apply(null,false,false);
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
          map = new Blob([StarblastMap.Engine.permalink(this.export("url"))],{type:"text/plain"});
          break;
        case "image":
          const t = await window.fetch(this.export("image"));
          map = await t.blob();
          break;
      }
      StarblastMap.Engine.copyToClipboard(map);
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
      StarblastMap.Engine.download(null,map);
    },
    load: function(data,init,dismiss_history) {
      let prev = this.data,h=data||prev, check=true;
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
          this.map.width = (this.size*5+1)*2*this.gridIndex;
          this.map.height = (this.size*5+1)*2*this.gridIndex;
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
          StarblastMap.Engine.applyColor("border-color");
          StarblastMap.Engine.applyColor("as-color");
          let px = this.map.width.toString()+"px";
          $("#mapBox").css("width",px);
          $("#mapBgI").css({width:px, height:px});
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
        StarblastMap.Engine.Brush.applySize();
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
          c2d.globalCompositeOperation = "destination-over";
          if (!this.background.global && this.background.allowExport && this.background.image) {
            c2d.globalAlpha = this.background.alpha/100;
            c2d.drawImage($("#mapBgI")[0], 0, 0, this.map.width, this.map.height);
            c2d.globalAlpha = 1;
          }
          else {
            c2d.fillStyle = this.background.color;
            c2d.fillRect(0,0,clone.width,clone.height);
          }
          return clone.toDataURL();
      }
    },
    import: function (type, data, init, exportData) {
      let map = [],fail = 0;
      switch (type)
      {
        case "plain":
          let matchIndex, matchChar;
          for (let i=0;i<data.length;i++) {
            if (matchIndex == null) {
              if (`"'`.indexOf(data[i]) != -1) {
                matchIndex = i;
                matchChar = data[i];
              }
            }
            else if (data[i] == matchChar) {
              map.push(data.slice(matchIndex, i+1));
              matchChar = null;
              matchIndex = null;
            }
          }
          map = map.map(i => Function(`return ${i}`)()).join("").split("\n");
          break;
        case "url":
          data = LZString.decompressFromEncodedURIComponent(data);
        case "url-old":
          let smap=data.split('e');
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
          break;
      }
      console.log(map);
      fail = !map.length || (map.length < 20 && map.length > 200);
      if (!fail && type.includes("url")) {
        let len = map.map(i => i.length);
        fail = map.length != Math.max(...len) || map.length != Math.min(...len);
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
      let custom = num == null, min = this.Asteroids.size.min, max = this.Asteroids.size.max, init = custom?this.Engine.random.range(min,max):num, check = [...new Array(2).fill([0,this.size-1]),[0,9]], args = ["Y Coordinate", "X Coordinate", "Asteroid Size"], violate=["rounded","parsed"],
      firstUpper = function(str) {
        return str[0].toUpperCase() + str.slice(-str.length+1);
      },
      Cell = {
        x:x,
        y:y,
        size:init,
        isRemoved: !custom
      }, SBMap = {
        Asteroids: {
          set: function(x,y,size) {
            let error = [], warn = [], pos = [y,x,size];
            for (let i of [1,0,2]) {
              try {
                let val = Number(pos[i]);
                if (isNaN(val) || val<check[i][0] || val>check[i][1]) error.push(i);
                else {
                  let w = [];
                  if (typeof pos[i] != "number") w.push(1);
                  if (val-Math.trunc(val) != 0) w.push(0);
                  (w.length>0) && warn.push({text:`${args[i]}: ${val}${(w.indexOf(1) != -1)?(" ("+(typeof pos[i])+" format)"):""}`,index:i,type:w.map(i=>violate[i])});
                }
              }
              catch(e){error.push(i)}
            }
            if (error.length>0) console.error(`[Custom Brush] Error: Invalid argument${(error.length>1)?"s":""} in 'Asteroids.set':\n`,...error.map(i => [args[i]+": ",pos[i],"\n"]).flat());
            else {
              let t = [...pos.slice(0,2).map(i=>Math.trunc(Number(i))),Math.round(Number(pos[2]))], clone = [];
              (warn.length>0) && console.warn(`[Custom Brush] Found non-integer value${(warn.length>1)?"s":""} in 'Asteroids.set':\n${warn.map(u => (u.text+". "+firstUpper(u.type.join(" and "))+" to "+t[u.index])).join("\n")}`);
              clone.push(t);
              if (StarblastMap.Engine.Mirror.v) clone.push([StarblastMap.size-t[0]-1,t[1],t[2]]);
              if (StarblastMap.Engine.Mirror.h) clone.push([t[0],StarblastMap.size-t[1]-1,t[2]]);
              if (StarblastMap.Engine.Mirror.v && StarblastMap.Engine.Mirror.h) clone.push([StarblastMap.size-t[0]-1,StarblastMap.size-t[1]-1,t[2]]);
              for (let k of clone)
              {
                let data = StarblastMap.Asteroids.modify(...k);
                if (data.changed){
                  let pos = k.slice(0,2).join("-"), prev = StarblastMap.session.get(pos);
                  StarblastMap.session.set(pos,[(prev)?prev[0]:data.prev,k[2]]);
                }
              }
            }
          },
          get: function(x,y) {
            let er = [], wr = [], pos = [y,x];
            for (let i of [1,0]) {
              try {
                let val = Number(pos[i]);
                if (isNaN(val) || val<check[i][0] || val>check[i][1]) er.push(i);
                else {
                  let w = [];
                  if (typeof pos[i] != "number") w.push(1);
                  if (val-Math.trunc(val) != 0) w.push(0);
                  (w.length>0) && wr.push({text:`${args[i]}: ${val}${(w.indexOf(1) != -1)?(" ("+(typeof pos[i])+" format)"):""}`,index:i,type:w.map(i=>violate[i])});
                }
              }
              catch(e){er.push(i)}
            }
            if (er.length>0) {
              console.error(`[Custom Brush] Error: Invalid argument${(er.length>1)?"s":""} in 'Asteroids.set':\n`,...er.map(i => [args[i]+": ",pos[i],"\n"]).flat());
              return null;
            }
            else {
              let t = pos.slice(0,2).map(i=>Math.trunc(Number(i)));
              (wr.length>0) && console.warn(`[Custom Brush] Found non-integer value${(wr.length>1)?"s":""} in 'Asteroids.get':\n${wr.map(u => (u.text+". "+firstUpper(u.type.join(" and "))+" to "+t[u.index])).join("\n")}`);
              return StarblastMap.data[t[1]][t[0]];
            }
          },
          size: {
            min: min,
            max: max
          }
        },
        size: StarblastMap.size,
        Brush: {
          size: StarblastMap.Engine.Brush.size,
          isRandomized: StarblastMap.Engine.Brush.randomized
        },
        Utils: {
          random: StarblastMap.Engine.random,
          randomInRange: StarblastMap.Engine.random.range.bind(StarblastMap.Engine.random)
        }
      }, u;
      if (typeof this.Engine.Brush.drawers.current == "function") u = this.Engine.Brush.drawers.current;
      else {
        let g = this.Engine.Brush.drawers.getById(this.Engine.Brush.drawers.chosenIndex);
        if (g.error) console.error(`[Custom Brush] ${g.error.name}: ${g.error.message}`);
        else u = g.drawer;
      }
      if (u) try{u.call(window,Cell,SBMap)}catch(e){console.error(`[Custom Brush] ${e.name}: ${e.message}`)}
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
          let c2d = StarblastMap.map.getContext('2d'), gridIndex = StarblastMap.gridIndex;
          c2d.clearRect((y*10+3/2)*gridIndex,(x*10+3/2)*gridIndex,gridIndex*9,gridIndex*9);
          c2d.beginPath();
          c2d.drawImage(this.template,(y*10+6-num/2)*gridIndex+num/4,(x*10+6-num/2)*gridIndex+num/4,num*(gridIndex-1/2),num*(gridIndex-1/2));
          c2d.fillStyle = this.color;
          c2d.globalCompositeOperation = "source-atop";
          c2d.fillRect((y*10+3/2)*gridIndex,(x*10+3/2)*gridIndex,gridIndex*9,gridIndex*9);
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
          let gridIndex = StarblastMap.gridIndex;
          c.width = 9*gridIndex;
          c.height = 9*gridIndex;
          let c2d = c.getContext('2d');
          c2d.clearRect(0,0,c.width,c.height);
          c2d.beginPath();
          c2d.drawImage(this.template,(gridIndex*3-i)*3/2,(gridIndex*3-i)*3/2,i*3,i*3);
          c2d.fillStyle = this.color;
          c2d.globalCompositeOperation = "source-atop";
          c2d.fillRect(0,0,c.width,c.height);
          c2d.globalCompositeOperation = "source-over";
        }
      },
      changeSize: function (num) {
        let u=Math.min(Math.max(Number(num)||0,0),9);
        for (let i=0;i<=9;i++) $(`#asc${i}`).css({"border":"0.1vw solid"});
        $("#randomSize").css("border","0.1vw solid");
        $(`#asc${u}`).css({"border":"0.3vw solid"});
        for (let i in this.input) this.input[i].val(u);
        this.applyKey("min",u);
        this.applyKey("max",u);
        this.RandomOptions.css("display","none");
        StarblastMap.Engine.applyColor("border-color");
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
        this.RandomOptions.css("display","");
        for (let i=0;i<9;i++) for (let i=0;i<=9;i++) $(`#asc${i}`).css({"border":"0.1vw solid"});
        $("#randomSize").css({"border":"0.3vw solid"});
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
        StarblastMap.Engine.applyColor("border-color");

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
    },
    Engine: {
      supportClipboardAPI: !!(window.Clipboard && window.ClipboardItem),
      touchHover: false,
      toString: function (item) {
        switch (typeof item) {
          case "undefined":
            return "undefined";
          case "object":
            return JSON.stringify(item);
          case "string":
            return item;
          default:
            return item.toString();
        }
      },
      Trail: {
        state: -1,
        stop: function ()
        {
          this.state = -1;
          StarblastMap.Engine.touchHover = false;
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
        if (!StarblastMap.border.hide) {
          c2d.moveTo(x,y);
          c2d.lineTo(z,t);
        }
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
            $('.chosen').css("border-bottom-color",color);
            $("#BrushCode").css("background-color",css);
            StarblastMap.background.color = css;
            StarblastMap.Engine.menu.set();
            break;
          case "border-color":
            let c2d = StarblastMap.map.getContext('2d'), size = StarblastMap.size, gridIndex = StarblastMap.gridIndex;
            c2d.beginPath();
            c2d.strokeStyle = css;
            c2d.lineWidth = 1;
            for (let i=0;i<=size;i++)
            {
              this.addBorder(c2d,(i*10+1)*gridIndex,gridIndex,(i*10+1)*gridIndex,(size*10+1)*gridIndex);
              this.addBorder(c2d,gridIndex,(i*10+1)*gridIndex,(size*10+1)*gridIndex,(i*10+1)*gridIndex);
            }
            c2d.stroke();
            $('td').css(param,css);
            $('.container').css("border-color",css);
            StarblastMap.border.color = css;
            StarblastMap.Engine.menu.set();
            break;
        }
        $("#"+param).val(css);
        localStorage.setItem(param,css);
        return css;
      },
      encodeHTML: function(str) {
        return str.replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/'/g,"&apos;").replace(/"/g,"&quot;").replace(/\[(.+)\]\((.+)\)/g,"<a href='$2' target='_blank'>$1</a>");
      },
      Brush: {
        input: $("#brush_size"),
        randomized: false,
        drawers: {
          codeEditor: ace.edit("code",{
            mode:"ace/mode/javascript",
            theme:"ace/theme/monokai",
            tabSize: 2,
            useSoftTabs: true,
            fontSize: "1vw"
          }),
          current: 0,
          editIndex: null,
          chosenIndex: 0,
          defaultIndex: 0,
          list: [
            {
              name: "Square Brush",
              author: "Bhpsngum",
              icon: "square",
              description: "Fill a square of 2n+1 each side (n: Brush size)",
              code: "let br = StarblastMap.Brush.size;\nfor (let i=Math.max(Cell.x-br,0);i<=Math.min(Cell.x+br,StarblastMap.size-1);i++)\n  for (let j=Math.max(Cell.y-br,0);j<=Math.min(Cell.y+br,StarblastMap.size-1);j++) {\n    let num = (StarblastMap.Brush.isRandomized && !Cell.isRemoved)?StarblastMap.Utils.randomInRange(StarblastMap.Asteroids.size.min,StarblastMap.Asteroids.size.max):Cell.size;\n    StarblastMap.Asteroids.set(i,j,num);\n  }"
            }
          ],
          get: function(code) {
            let error = 0,t;
            try{t = Function("Cell","StarblastMap",code)}
            catch(e){error = e};
            return {error: error,drawer: t}
          },
          getById: function(id) {
            id = Math.max(Math.min(Math.trunc(Number(id)||0),this.list.length-1),0);
            return this.get(this.list[id].code);
          },
          update: function(code, name, desc, icon, author) {
            let id = (this.editIndex == null)?this.list.length:this.editIndex;
            this.list[id] = {name:name||("Custom Brush "+(id-this.defaultIndex)), code:code, description: desc||"", icon: icon||"", author: author||""};
            this.sync();
            this.redrawSelection();
          },
          redrawSelection: function() {
            $("#brushes").html("");
            for (let i=0;i<this.list.length;i++) {
              $("#brushes").append(`<td id="brush${i}"><i class="fas fa-fw fa-${StarblastMap.Engine.encodeHTML(this.list[i].icon||"brush")}"></i></td>`);
              let brush = StarblastMap.Engine.Brush.drawers.list[i];
              $("#brush"+i)[0].onmouseover = function(){StarblastMap.Engine.info.view(brush.name,(brush.description||"").replace(/(\t|\s|\n|\r|\.)*$/,"")+(brush.author?(". By "+brush.author):""))}
              $("#brush"+i)[0].onclick = function(){StarblastMap.Engine.Brush.drawers.select(i)};
            }
          },
          select: function(i) {
            i = ((i == void 0)?this.chosenIndex:i)||0;
            i = Math.max(Math.min(i,this.list.length-1),0);
            this.editIndex = i;
            this.chosenIndex = i;
            localStorage.setItem("brushIndex",i);
            for (let j=0;j<this.list.length;j++) $("#brush"+j).css("border-width","0.1vw");
            $("#brush"+i).css("border-width","0.3vw");
            $("#removeBrush").prop("disabled",this.chosenIndex<=this.defaultIndex);
            let t = this.getById(i);
            this.current = (t.error)?0:t.drawer;
          },
          showCode: function(bool){
            $("#BrushCode").css("display",bool?"":"none");
            if (bool) {
              let check = this.editIndex <= this.defaultIndex && this.editIndex != null;
              this.codeEditor.setValue((this.list[this.editIndex]||{}).code||"");
              this.codeEditor.setReadOnly(check);
              $("#brushname").val((this.list[this.editIndex]||{}).name||"").attr("readonly",check);
              $("#brushdesc").val((this.list[this.editIndex]||{}).description||"").attr("readonly",check);
              $("#brushicon").val((this.list[this.editIndex]||{}).icon||"").attr("readonly",check);
              $("#brushauthor").val((this.list[this.editIndex]||{}).author||"").attr("readonly",check);
              $("#save").prop("disabled",check);
            }
          },
          remove: function() {
            if (this.editIndex > this.defaultIndex) {
              this.list.splice(this.chosenIndex,1);
              this.redrawSelection();
              this.select(0);
              this.sync();
            }
          },
          sync: function() {
            localStorage.setItem("customBrush",JSON.stringify(this.list.slice(this.defaultIndex+1,this.list.length)));
          }
        },
        defaultIndex: 0,
        applyRandom: function(origin) {
          this.randomized = StarblastMap.Engine.setCheckbox(origin,"randomCheck","randomizedBrush","rInd");
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
        apply: function (origin,p) {
          let u = StarblastMap.Engine.setCheckbox(origin,"mirror-"+p,"mirror_"+p,"mrmark-"+p);
          this[p] = u;
          $("#almr").css("display",(this.v && this.h)?"":"none");
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
        element.setAttribute('download', name || this.generateName());

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
      menu: {
        main: $("#menu"),
        modules: ["Map","Edit","Decoration","Advanced","Miscellaneous"],
        chosenIndex: 1,
        hide: function(bool) {
          bool = (bool == void 0)?(localStorage.getItem("hideMenu") == "true"):!!bool;
          this.isHidden = bool;
          localStorage.setItem("hideMenu", bool);
          $("#short-main").css("display",bool?"":"none");
          $("#main").css("display",bool?"none":"");
        },
        checkScale: function() {
          this.scaleExpired = !0;
          $("#mapBox").css({
            "padding-top": (this.main.height()+5)+"px",
            "padding-bottom": $("#footer").height()+"px"
          });
          $("#info").css("width",($("#footer").width()-$("#XY").width()-10)+"px")
        },
        set: function(index) {
          for (let i=0;i<this.modules.length;i++) {
            if (i!==index) {
              $("#menu"+i).css({border:"","border-color":StarblastMap.border.color});
              $("#container"+i).css("display","none");
            }
          }
          index = Math.max(Math.min(this.modules.length-1,Math.round((typeof index != "number")?this.chosenIndex:index)),0);
          this.chosenIndex = index;
          $("#menu"+index).css({"border-width":"0.2vw","border-bottom-color":StarblastMap.background.color});
          $("#container"+index).css("display","");
        }
      },
      random: function(num) {
        return ~~(Math.random()*num);
      },
      setCheckbox: function (origin, triggerID, storage, IndID) {
        let u = origin?(localStorage.getItem(storage) == "true"):$("#"+triggerID).is(":checked");
        origin && $("#"+triggerID).prop("checked",u);
        (IndID) && $("#"+IndID).prop("class","fas fa-fw fa-"+(u?"check":"times"));
        localStorage.setItem(storage, u);
        return u;
      },
      info: {
        list: [
          ["show-menu",null,"Show the Map menu"],
          ["hide-menu",null,"Hide the Map menu"],
          ["map_size",null,'Toggle map size (from 20 to 200 and must be even)'],
          ["asc0",null,'Remove asteroids in the map',"0"],
          ...new Array(9).fill(0).map((j,i) => [`asc${i+1}`,null,`Asteroid size ${i+1}`,`${i+1}`]),
          ["randomSize",'Random Asteroid Size','Draw random asteroids in a specific size range',"R"],
          ["brush_size",null,'Toggle brush radius (0 to current map size)'],
          ["minASSize",null,'Toggle minimum Asteroid size (0 to Maximum Asteroid Size)'],
          ["maxASSize",null,'Toggle maximum Asteroid size (Minimum Asteroid Size to 9)'],
          ["mr-h",null,"Toggle horizontal Mirror"],
          ["mr-v",null,"Toggle vertical Mirror"],
          ["almr",null,"All-Corners mirror is enabled"],
          ["rCheckIcon",'Random Asteroid Size in Brush','Random Asteroids Size in a single Brush'],
          ["as-color",null,'Toggle asteroid color'],
          ["background-color",null,'Toggle background color'],
          ["bgI-input1",null,"Upload your own background image from file (accept all image formats)"],
          ["bgI-url",null,"Upload your own background image from url"],
          ["bgI-alpha",null,"Toggle background image opacity (0% to 100% - Only available in Map Only Selection)"],
          ["bgI-clear",null,"Clear current custom background image"],
          ["border-color",null,'Toggle line color'],
          ["undo","Undo","Undo previous actions in the map","Ctrl(Cmd) + Z"],
          ["redo","Redo","Redo undid actions in the map","Ctrl(Cmd) + Y"],
          ["clearMap",'Clear Map','Clear all asteroids in the current map'],
          ["exportText",'Export Map as Text','Export map as a text/plain (*.txt) file',"Ctrl(Cmd) + S"],
          ["copyText",'Copy Map','Copy current map pattern to clipboard',"Ctrl(Cmd) + C"],
          ["loadMap1",'Import Map','Import map from file (accept text/plain (*.txt/*.text) and text/javascript (*.js) format)',"Ctrl(Cmd) + Z"],
          ["random",'RandomMazeGenerator', 'Generate Random Maze according to the current map size. By [rvan_der](https://github.com/rvan-der)'],
          ["feedback",'Feedback','Give us a feedback'],
          ["permalink",'Permalink','Copy map permalink to clipboard'],
          ["exportImage",'Export Map as Image','Export map screenshot as a PNG (*.png) file (HotKey Ctrl + I)',"Ctrl(Cmd) + Z"],
          ["copyImage",'Copy Map screenshot','Copy Map screenshot as as a PNG (*.png) file to Clipboard'],
          ["tutorial",'Tutorial','Visit the Map Editor Tutorial Page'],
          ["changelog",'Changelog',"View the update's log of Map Editor from the beginning"],
          ["XY",null,'Your cursor position in the map. Hover the map for details'],
          ["addBrush",null,"Add your custom brush"],
          ["removeBrush",null,"Remove the selected custom brush"],
          ["editBrush",null,"Edit the selected custom brush"]
        ],
        view: function (title,text,HotKey) {
          $("#info").html(`<strong>${StarblastMap.Engine.encodeHTML(title||"")}${(title&&text)?": ":""}</strong>${StarblastMap.Engine.encodeHTML(text||"")}${HotKey?(" (HotKey "+HotKey+")"):""}`);
        }
      }
    }
  }
  StarblastMap.Engine.info.list.unshift(...StarblastMap.Engine.menu.modules.map((i,j) => ["menu"+j,null,i+" Tab"]));
  Object.assign(StarblastMap.Asteroids.changeSize,{
    applySize: function(key)
    {
      return Math.min(Math.max(0,Number($("#"+key+"ASSize").val())||0),9);
    }
  });
  Object.assign(StarblastMap.Engine.random, {
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
          if (error = !confirm("You are using the old permalink method.\nDo you want to go to the new one?"), !error) return "?"+StarblastMap.export("url",StarblastMap.import("url-old",query[1],0,1).map);
        }
        else (error = !confirm("Map pattern from URL detected!\nLoad map?\n(Note: this action cannot be undone)"), !error);
        break;
      case "feedback":
        return "https://docs.google.com/forms/d/e/1FAIpQLSe-NQ8QTj0bnX65LMT8NbO9ppEYRtgQ1Fa3AwJX-GfTFHUQSw/viewform?usp=sf_link";
      default:
        if (error = !confirm("You are using the old map permalink\nWould you like to go to the new one?"), !error) return '?map='+query[0];
    }
  }
  StarblastMap.Engine.setURL();
  StarblastMap.Asteroids.template.onload = function() {
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
    StarblastMap.background.checkAlpha();
  }
  if (!StarblastMap.Engine.supportClipboardAPI) {
    $("#main").append("<p>Copy Image is disabled. <a href='#' id='error'>Learn more why</a></p>");
    $("#copyImage").remove();
    StarblastMap.Engine.copyToClipboard = function(blob) {
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
      alert("Your browser doesn't support one of the Clipboard API features using in this tool. Please switch to other browser or use the old version instead.\nYou can visit this page for more information:\nhttps://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API")
    });
  }
  else StarblastMap.Buttons.copy.image.on("click", function(){StarblastMap.copy("image")});
  StarblastMap.Engine.Brush.applyRandom(!0);
  StarblastMap.background.checkExport(!0);
  StarblastMap.border.check(!0);
  StarblastMap.background.checkGlobal(!0);
  StarblastMap.Asteroids.template.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAACpSURBVDhPrZQJDoUgDAWpZ9H7H0juwvfVRz/EBbWdxLAkTroA6Y5Syrp9YOXWkInjAUrmfeUEMo2r51GUwtHgj1eRZY4dIrJw2gOZxvIei/6yhi+Zq9RS5oa3CVmFQTJFImUAwsJ5BDmqKQaEOFun58sFaon0HeixiUhZM6y3JaSG7dUzITfd9ewihLQRf+Lw2lRY5OGr06Y7BFLt3x+stZufoQQ8EKX0A+4x7+epxEovAAAAAElFTkSuQmCC";
  $("#asChoose").html(`<tr><td id="asc0"><i class="fas fa-fw fa-eraser"></i></td>`+Array(9).fill(0).map((x,i) => `<td id='asc${i+1}'><canvas id="as${i+1}"></canvas></td>`).join("")+`<td id='randomSize'><i class="fas fa-fw fa-dice"></i></td></tr>`);
  try {
    let mr = ["h","v"],mdesc = ["horizontal","vertical"];
    $("#MirrorOptions").html(mr.map(i => `<input type="checkbox" style="display:none" id="mirror-${i}">`).join("")+"<table id='mirrorChoose'><tr>"+mr.map((i,j) => `<td id="mr-${i}"><i class="fas fa-fw fa-arrows-alt-${i}"></i><i class="fas fa-fw fa-times" id="mrmark-${i}"></i></td>`).join("")+`<td id="almr"><i class="fas fa-fw fa-expand-arrows-alt"></i></td></tr>`);
    for (let i of mr)
    {
      StarblastMap.Engine.Mirror.apply(!0,i);
      $("#mirror-"+i).on("change",function(){StarblastMap.Engine.Mirror.apply(null,i)});
      $("#mr-"+i).on("click",function(){$("#mirror-"+i).click()});
    }
  }
  catch(e){}
  StarblastMap.Asteroids.applyKey("min",localStorage.ASSize_min);
  StarblastMap.Asteroids.applyKey("max",localStorage.ASSize_max);
  StarblastMap.map.addEventListener("mousemove", function(e){
    this.view(this.get(e.offsetX),this.get(e.offsetY));
  }.bind(StarblastMap.Coordinates));
  StarblastMap.map.addEventListener("touchmove", function(e){
    if (!StarblastMap.Engine.touchHover) {
      StarblastMap.info(!0)();
      StarblastMap.Engine.touchHover = true;
    }
    if (e.touches.length == 1) {
      e.preventDefault();
      if (StarblastMap.Engine.menu.scaleExpired) {
        Object.assign(StarblastMap.Engine.menu,$(StarblastMap.map).offset());
        StarblastMap.Engine.menu.scaleExpired = !1;
      }
      this.view(this.get(e.touches[0].pageX-StarblastMap.Engine.menu.left),this.get(e.touches[0].pageY-StarblastMap.Engine.menu.top));
    }
  }.bind(StarblastMap.Coordinates));
  StarblastMap.map.addEventListener("mouseover",function(){(!StarblastMap.Engine.touchHover) && StarblastMap.info()()});
  StarblastMap.map.addEventListener("mousedown", function(e){
    StarblastMap.Engine.Trail.start(StarblastMap.Coordinates.get(e.offsetX),StarblastMap.Coordinates.get(e.offsetY),e);
  });
  StarblastMap.map.addEventListener("touchstart", function(){
    StarblastMap.info(!0)();
    StarblastMap.Engine.Trail.state=1
  });
  try {
    let t = StarblastMap.Engine.menu.checkScale.bind(StarblastMap.Engine.menu);
    new ResizeSensor(StarblastMap.Engine.menu.main[0], t);
    new ResizeSensor($("#footer")[0], t);
  }
  catch(e){}
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
  $("#bgI-global").on("change",function(){StarblastMap.background.checkGlobal()});
  $("#bgI-allowExport").on("change",function(){StarblastMap.background.checkExport()});
  $("#border-show").on("change",function(){StarblastMap.border.check()});
  StarblastMap.sizeInput.on("change",function(){
    StarblastMap.applySize(StarblastMap.sizeInput.val());
    StarblastMap.create();
  });
  StarblastMap.Buttons.clear.on("click",StarblastMap.clear.bind(StarblastMap));
  StarblastMap.Engine.Brush.input.on("change", function() {
    StarblastMap.Engine.Brush.applySize($("#brush_size").val());
  });
  StarblastMap.checkActions();
  StarblastMap.Buttons.undo.on("click",StarblastMap.undo.bind(StarblastMap));
  StarblastMap.Buttons.redo.on("click",StarblastMap.redo.bind(StarblastMap));
  $("#randomCheck").on("change",function(){StarblastMap.Engine.Brush.applyRandom()});
  for (let i of ["border","background","as"])
  {
    StarblastMap.Engine.applyColor(i+"-color");
    $("#"+i+"-color").on("change", function(){
      StarblastMap.Engine.applyColor(i+"-color",$("#"+i+"-color").val());
    });
  }
  for (let i=0;i<StarblastMap.Engine.menu.modules.length;i++) $("#menu"+i).on("click",function(){StarblastMap.Engine.menu.set(i)});
  StarblastMap.Buttons.export.text.on("click",function() {
    StarblastMap.download("plain");
  });
  StarblastMap.Buttons.export.image.on("click",function() {
    StarblastMap.download("image");
  });
  StarblastMap.Buttons.randomMaze.on("click", function() {
    StarblastMap.load(StarblastMap.randomMaze(StarblastMap.size).split("\n"));
  });
  StarblastMap.Engine.menu.hide();
  $("#show-menu").on("click", function(){StarblastMap.Engine.menu.hide(!1)});
  $("#hide-menu").on("click", function(){StarblastMap.Engine.menu.hide(!0)});
  StarblastMap.background.alphaInput.on("change", function(){StarblastMap.background.checkAlpha(StarblastMap.background.alphaInput.val())});
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
  // Brush code edits
  try {
    let rSize = StarblastMap.Asteroids.randomSize.bind(StarblastMap.Asteroids);
    $("#randomSize").on("click",function(){rSize()});
    StarblastMap.Engine.Brush.applySize();
    rSize(1);
    StarblastMap.Asteroids.input.max.on("change",function(){rSize(1,"max")});
    StarblastMap.Asteroids.input.min.on("change",function(){rSize(1,"min")});
    document.onkeydown = function(e)
    {
      let size=["#brush_size","#map_size","#background-color","#border-color","#as-color","#maxASSize","#minASSize","#brushname","#brushdesc","#brushicon","#brushauthor",".ace_text-input"],check=[];
      for (let i of size) check.push($(i).is(":focus"));
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
          case 98:
          case 66:
            e.preventDefault();
            $("#border-show").prop("checked",!$("#border-show").is(":checked"));
            StarblastMap.border.check(null,true);
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
  }
  catch(e){}
  try {
    let cbr = JSON.parse(localStorage.getItem("customBrush"));
    StarblastMap.Engine.Brush.drawers.editIndex = null;
    if (Array.isArray(cbr)) for (let i of cbr)
    {
      if (!StarblastMap.Engine.Brush.drawers.get(i.code||"{").error) StarblastMap.Engine.Brush.drawers.update(i.code, i.name, i.description, i.icon, i.author);
    }
    StarblastMap.Engine.Brush.drawers.sync();
    StarblastMap.Engine.Brush.drawers.redrawSelection();
    let cbrid = Number(localStorage.getItem("brushIndex"))||0;
    cbrid = Math.max(Math.min(cbrid,StarblastMap.Engine.Brush.drawers.list.length-1),0);
    StarblastMap.Engine.Brush.drawers.select(cbrid);
  }
  catch(e){}
  $("#save").on("click", function(){
    let code = StarblastMap.Engine.Brush.drawers.codeEditor.getValue(),p = StarblastMap.Engine.Brush.drawers.get(code||"{");
    if (p.error) alert(p.error);
    else {
      let proc;
      if (proc = !/((window\.)*(document|localStorage|open|close|location|\$))/g.test(code), !proc) proc = confirm("Hold up!\nThis script may contain malicious code that can be used for data-accessing or trolling\nDo you still want to proceed?");
      if (proc) {
        StarblastMap.Engine.Brush.drawers.update(code, $("#brushname").val(), $("#brushdesc").val(), $("#brushicon").val(), $("#brushauthor").val());
        StarblastMap.Engine.Brush.drawers.showCode(0);
        StarblastMap.Engine.Brush.drawers.select();
      }
    }
  });
  $("#removeBrush").on("click", function(){
    (confirm("Are you sure to remove this brush drawer?")) && StarblastMap.Engine.Brush.drawers.remove();
  });
  $("#cancel").on("click",function(){StarblastMap.Engine.Brush.drawers.showCode(0)});
  $("#addBrush").on("click", function(){
    StarblastMap.Engine.Brush.drawers.editIndex=null;
    StarblastMap.Engine.Brush.drawers.showCode(1);
    if (localStorage.getItem("modwarn") != "true") {
      alert("WARNING!\nWe won't be responsible for any problems caused by your code\nOnly runs code from the source that you trust");
      localStorage.setItem("modwarn", true);
    }
  });
  $("#editBrush").on("click",function(){StarblastMap.Engine.Brush.drawers.showCode(1)});
  window.addEventListener("mouseup", StarblastMap.Engine.Trail.stop.bind(StarblastMap.Engine.Trail));
  window.addEventListener("blur", StarblastMap.Engine.Trail.stop.bind(StarblastMap.Engine.Trail));
  window.addEventListener("touchcancel",StarblastMap.Engine.Trail.stop.bind(StarblastMap.Engine.Trail));
  window.addEventListener("touchend",StarblastMap.Engine.Trail.stop.bind(StarblastMap.Engine.Trail));
  StarblastMap.Buttons.permalink.on("click", function(){
    StarblastMap.Engine.setURL(StarblastMap.export("url"));
    StarblastMap.copy("url");
  });
  for (let i of ["brush_size","map_size","border-color","background-color","minASSize","maxASSize"])
  $("#"+i).on("keypress",function(e){if (e.which == 13) $("#"+i).blur()});
  for (let i of StarblastMap.Engine.info.list) $("#"+i[0]).on("mouseover",function(){
    StarblastMap.Engine.info.view(i[1],i[2],i[3]);
  });
}());
