window.t = (function(){
  window.StarblastMap = {
    map: $("#map")[0],
    sizeInput: $("#map_size"),
    gridIndex: 3,
    borderScale: 1/3, // scale based on gridIndex
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
    isValidCell: function (x, y) {
      return 0 <= Math.min(x, y) && Math.max(x, y) < this.size;
    },
    Buttons: {
      export:
      {
        text: $("#exportText"),
        image: $("#exportImage")
      },
      clear: $("#clearMap"),
      randomMaze: $("#random"),
      copy: {
        text: $("#copyText"),
        image: $("#copyImage")
      },
      permalink: $("#permalink"),
      clearData: $("#clear-local-data"),
      undo: $("#undo"),
      redo: $("#redo")
    },
    info: function(t) {
      let dragEnabled = this.Asteroids.dragMode, caller;
      if (dragEnabled) caller = function(){StarblastMap.Engine.info.view(null, (t?"Swipe":"Drag the mouse") + " for navigation around the map")}
      else caller = function(){StarblastMap.Engine.info.view(null,`${t?"Touch":"Left-click"} to apply asteroid, ${t?"Swipe":"right-click to remove, drag"} for trails`)}
      return caller;
    },
    clearData: function () {
      if (confirm("Warning: Local data contains your map data and saved options for this tool.\nDo you still want to proceed?")) localData.clear();
    },
    IDMapper: {
      check: function (init) {
        let id = Math.round(Math.max(Math.min(init?(localData.getItem("map_id") || "undefined"):this.idInput.val(), 9999), 1)) || 5000;
        let game_mode = Math.min(Math.max(init?localData.getItem("game_mode"):(this.modeChecker.prop("selectedIndex") - 1), 0), 1) || 0;
        localData.setItem("map_id", id);
        this.idInput.val(id);
        this.map_id = id;
        localData.setItem("game_mode", game_mode);
        this.modeChecker.prop("selectedIndex", game_mode + 1);
        this.game_mode = game_mode;
        !init && this.createMapByID();
      },
      idInput: $("#map_id"),
      modeChecker: $("#game_mode"),
      applyButton: $("#IDMapperApply"),
      loadGameModes: function() {
        this.modeChecker.html("<option disabled>Select Game Mode</option>" + this.installed_modes.map(i => "<option>"+i.name+"</option>").join(""));
      }
    },
    Coordinates: {
      lastVisited: [-1,-1],
      lastViewed: [-1,-1],
      types: ["MapIndex","Cartesian","Mixed"],
      names: ["Map Index","Cartesian (Real Size)","Cartesian (Map Size)"],
      chosenType: 0,
      typeChooser: $("#coordtype"),
      ranges: function(type) {
        switch (type) {
          case 1:
            return [-StarblastMap.size*5, StarblastMap.size*5];
          case 2:
            return [-StarblastMap.size/2, StarblastMap.size/2];
          default:
            return [0,StarblastMap.size]
        }
      },
      restore: function (x,y,size,type,param) {
        type = type || 0;
        let error = [], check = [...new Array(2).fill(this.ranges(type)),[0,9.5]], args = ["X Coordinate", "Y Coordinate", "Asteroid Size"], violate=["rounded","parsed"],
        firstUpper = function(str) {
          return str[0].toUpperCase() + str.slice(-str.length+1);
        }, pos = [x,y,size], success = !0, results = null;
        for (let i of [0,1,2]) {
          try {
            let val = Number(pos[i]);
            if (isNaN(val) || val<check[i][0] || val>=check[i][1]) error.push(i);
          }
          catch(e){error.push(i)}
        }
        if (error.length>0) {
          success = !1;
          console.error(`[Custom Brush] Error: Invalid argument${(error.length>1)?"s":""} in 'Asteroids.${param}':\n`,...error.map(i => [args[i]+": ",pos[i],"\n"]).flat())
        }
        else {
          let t = pos, warn = [];
          for (let i of [0,1,2]) {
            let w = [], val = t[i];
            if (typeof val != "number") w.push(1);
            t[i] = Number(val);
            if (i == 2) {
              if (t[i] != Math.round(t[i])) w.push(0);
              t[i] = Math.round(t[i]);
            }
            else switch(type) {
              case 1:
              case 2:
                break;
              default:
                if (t[i] != Math.trunc(t[i])) w.push(0);
                t[i] = Math.trunc(t[i]);
            }
            (w.length>0) && warn.push({text:`${args[i]}: ${val}${(w.indexOf(1) != -1)?(" ("+(typeof val)+" format)"):""}`,index:i,type:w.map(i=>violate[i])});
          }
          results = [...t];
          (warn.length>0) && console.warn(`[Custom Brush] Found improper value${(warn.length>1)?"s":""} in 'Asteroids.${param}':\n${warn.map(u => (u.text+". "+firstUpper(u.type.join(" and "))+" to "+t[u.index])).join("\n")}`);
          switch(type) {
            case 1:
              results[0] = Math.trunc((StarblastMap.size*5+t[0])/10)
              results[1] = Math.trunc((StarblastMap.size*5-t[1]-1)/10);
              break;
            case 2:
              results[0] = Math.trunc(StarblastMap.size/2 + t[0]);
              results[1] = Math.trunc(StarblastMap.size/2 - t[1] - 0.1);
              break;
            default:
              break;
          }
          let j = results[0];
          results[0] = results[1];
          results[1] = j;
        }
        return {success: success, results: results}
      },
      setType: function(init){
        let t = init?this.types.indexOf(localData.getItem("coordinate-type")):(this.typeChooser.prop("selectedIndex")-1);
        t = Math.max(Math.min(t,this.types.length - 1),0) || 0;
        this.chosenType = t;
        localData.setItem("coordinate-type", this.types[t]);
        this.typeChooser.prop("selectedIndex",t+1);
        return t
      },
      transform: [
        function (x,y) {
          return {x:x,y:y}
        },
        function (x,y) {
          return {x: (x*2-StarblastMap.size+1)*5,y: (StarblastMap.size-y*2-1)*5}
        },
        function (x,y) {
          return {x: x-StarblastMap.size/2 + 1/2, y: StarblastMap.size/2 - y - 1/2}
        }
      ],
      getPosition: function(x,y,type) {
        let chooser = this.transform[type];
        return (typeof chooser == "function")?chooser(x,y):this.transform[0](x,y);
      },
      view: function (x,y,view) {
        if ((this.lastViewed[0]!=x || this.lastViewed[1]!=y) && view)
        {
          let d= (StarblastMap.data[y] || [])[x] || 0, gl="No Asteroids", a = this.getPosition(x,y,this.chosenType);
          if (d) gl="Asteroid size: "+d.toString();
          $("#XY").html(`(${a.x};${a.y}). ${gl}`);
          this.lastViewed = [x,y];
        }
        if (this.lastVisited[0]!=x || this.lastVisited[1]!=y)
        {
          /* states:
          0: selection
          1: modification
          -1: nothing
          */
          if (StarblastMap.Engine.Trail.state == 0) StarblastMap.selection.handle(x, y);
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
    size: Math.min(Math.max(20,Number(localData.getItem("size"))||20),200),
    buildData: function(dms) {
      (!dms) && this.pushSession("history",["n",this.data]);
      this.data = [];
      for (let i=0;i<this.size;i++) this.data.push(new Array(this.size).fill(0));
    },
    selection: {
      createSelectionStateObject: function (x, y, state = false) {
        return {
          x, y,
          layers: [],
          state,
          size: (StarblastMap.data[y] || [])[x] || 0,
          stateSize: -1
        }
      },
      list: new Map(),
      keyHold: false,
      origin: {
        x: 0,
        y: 0
      },
      last: {
        x: 0,
        y: 0
      },
      setOrigin: function (x, y) {
        this.origin.x = x;
        this.origin.y = y;
        this.setLast(x, y);
      },
      setLast: function (x, y) {
        this.last.x = x;
        this.last.y = y;
      },
      getLoopCoords: function (P1, P2) {
        return {
          startX: Math.min(P1.x, P2.x),
          endX: Math.max(P1.x, P2.x),
          startY: Math.min(P1.y, P2.y),
          endY: Math.max(P1.y, P2.y)
        }
      },
      moveTo: function (x, y) { // move the selection
        if (this.last.x != x || this.last.y != y) { // if the point is different from origin
          let oldSelection = new Map(this.list);
          this.list.clear();

          for (let i of oldSelection) {
            if (this.list.get(i[0]) == null) this.list.set(i[0], this.createSelectionStateObject(i[1].x, i[1].y, i[1].state));
            i[1].x += x - this.origin.x;
            i[1].y += y - this.origin.y;
            this.list.set(`${i[1].x}-${i[1].y}`, i[1]);
          }

          // select new positions (visually)
          this.renderLayers();

          this.setOrigin(x, y);
        }
      },
      handle: function (x, y) { // handle selction action
        // remove old selection
        if (this.last.x === x && this.last.y === y) return;
        let { startX, startY, endX, endY } = this.getLoopCoords(this.origin, this.last);
        for (let i = startX; i <= endX; ++i) {
          for (let j = startY; j <= endY; ++j) {
            let dat = this.list.get(`${i}-${j}`);
            if (dat == null) continue;
            dat.layers.pop();
          }
        }

        // start selecting cells from origin to (x, y)
        ({ startX, startY, endX, endY } = this.getLoopCoords(this.origin, {x, y}));
        for (let i = startX; i <= endX; ++i) {
          for (let j = startY; j <= endY; ++j) {
            let key = `${i}-${j}`;
            let dat = this.list.get(key);
            if (dat == null) this.list.set(key, dat = this.createSelectionStateObject(i, j));
            dat.layers.push(true);
          }
        }

        this.setLast(x, y);

        // render based on layers
        this.renderLayers();
      },
      drawSelectBorder: function (dat, selected) {
        let {x, y} = dat;

        let aSize = selected ? dat.size : (StarblastMap.data[y][x] || 0);

        if ((dat.state == selected && dat.stateSize === aSize) || !StarblastMap.isValidCell(x, y)) return;

        console.log(x, y, "rebuilt");
        
        let map = StarblastMap.map, c2d = map.getContext('2d'), gridIndex = StarblastMap.gridIndex;

        let X = (x * 10 + 1/2) * gridIndex, Y = (y * 10 + 1/2) * gridIndex, size = 10 * gridIndex;

        let neighbours = [
          {dX: 0, dY: -1, sX: X, sY: Y, eX: X + size, eY: Y},
          {dX: -1, dY: 0, sX: X, sY: Y, eX: X, eY: Y + size},
          {dX: 0, dY: 1, sX: X, sY: Y + size, eX: X + size, eY: Y + size},
          {dX: 1, dY: 0, sX: X + size, sY: Y, eX: X + size, eY: Y + size}
        ];

        for (let line of neighbours) {
          // clear previous line
          c2d.clearRect(line.sX - gridIndex / 2, line.sY - gridIndex / 2, line.eX - line.sX + gridIndex, line.eY - line.sY + gridIndex);

          let neighbourData = this.list.get(`${x + line.dX}-${y + line.dY}`);

          let neighbourState = neighbourData != null && !!neighbourData.layers.at(-1);

          let width = 0;

          if (false && neighbourState) { // neighbour is selected -> draw border by neighbour's state
            width = 2;
          }
          else { // else draw by own state
            if (selected) width = 2;
            else if (!StarblastMap.border.hide) width = 1;
          }

          if (width != 0) {
            c2d.moveTo(line.sX, line.sY);
            c2d.lineWidth = StarblastMap.borderScale * gridIndex * width;
            c2d.lineTo(line.eX, line.eY);
            c2d.stroke(); 
          }
        }

        if (dat.stateSize != aSize) StarblastMap.Asteroids.draw(x, y, aSize);

        dat.state = selected;
        dat.stateSize = aSize;
      },
      renderLayers: function (selected) { // render all selections in cache
        if (selected != null) {
          selected = !!selected;
          for (let e of this.list) {
            if (!!e[1].layers.at(-1) != selected) e[1].layers.push(selected);
          }
        }

        for (let i of this.list) {
          this.drawSelectBorder(i[1], !!i[1].layers.at(-1));
        }
      },
      exit: function (applyChanges) {
        // unselect the cells
        this.renderLayers(false);

        if (this.list.size != 0 && applyChanges) {
          // save changes
          let session = new Map();

          // ignore selections with top layer unselected
          for (let i of this.list) {
            if (!i[1].layers.at(-1)) this.list.delete(i[0]);
          }

          // clear on old position
          for (let i of this.list) {
            let data = StarblastMap.Asteroids.modify(i[1].x, i[1].y, 0);
            if (data.changed){
              let pos = `${i[1].x}-${i[1].y}`, prev = session.get(pos);
              session.set(pos,[(prev)?prev[0]:data.prev,0]);
            }
          }

          // set on new position
          for (let i of this.list) {
            let numbers = i[0].split("-").map(Number);
            let data = StarblastMap.Asteroids.modify(...numbers, i[1].size);
            if (data.changed){
              let pos = `${i[1].x}-${i[1].y}`, prev = session.get(pos);
              session.set(pos,[(prev)?prev[0]:data.prev,i[1].size]);
            }
          }

          StarblastMap.pushSession("history",["m",session]);
          StarblastMap.sync();
        }

        this.list.clear();
      }
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
        alpha = Number((alpha != void 0)?alpha:(localData.getItem("bgI-alpha")||100));
        this.alpha = Math.min(Math.max((isNaN(alpha)?100:alpha),0),100);
        this.alphaInput.val(this.alpha);
        localData.setItem("bgI-alpha",this.alpha);
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
        url = (forced)?(url||""):(url || localData.getItem("background-image") || "");
        if (url) {
          let img = new Image();
          img.onload = function() {
            this.options.css("display","");
            this.image = url;
            localData.setItem("background-image",url);
            this.apply(url,this.global,!this.global);
          }.bind(this);
          img.onerror = function() {
            alert("An error occured!\nPlease try again later!");
          }
          img.src = url;
        }
        else if (forced || init) {
          this.options.css("display","none");
          localData.setItem("background-image","");
          this.image = "";
          this.apply(null,false,false);
        }
      }
    },
    copy: function(type) {
      let map, needawait;
      switch (type)
      {
        case "plain":
          map = new Blob([this.export("plain")],{type:"text/plain"});
          break;
        case "url":
          map = new Blob([StarblastMap.Engine.permalink(this.export("url"))],{type:"text/plain"});
          break;
        case "image":
          needawait = !0;
          window.fetch(this.export("image")).then(function(res){
            res.blob().then(StarblastMap.Engine.copyToClipboard)
          });
          break;
      }
      !needawait && StarblastMap.Engine.copyToClipboard(map);
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
    load: function(data,init,dismiss_history, forceReplace) {
      let prev = this.data,h=data||prev, check=true;
      if (Array.isArray(h))
      {
        let newH = h.length, newW = Math.max(...h.map(u => u.length)), d = Math.max(newW, newH), oldSize = this.size;
        let Import = this.Import;
        let allowReplace = forceReplace || Import.isReplaceAllowed();
        if (!Import.allowShift || init) StarblastMap.applySize(d);
        if (oldSize != this.size || init)
        {
          this.pattern = new Map();
          this.buildData(dismiss_history);
          let c2d = this.map.getContext('2d');
          c2d.clearRect(0,0,this.map.width, this.map.height);
          this.map.width = (this.size*5+1)*2*this.gridIndex;
          this.map.height = (this.size*5+1)*2*this.gridIndex;
          c2d.beginPath();
          for (let i=0;i<this.size;++i)
          {
            for (let j=0;j<this.size;++j)
            {
              let wh;
              if (i >= h.length || j >= h[i].length) wh = 0;
              else wh = Number(h[i][j]) || 0;
              if (wh != 0)
              {
                this.pattern.set(`${i}-${j}`, wh);
                this.data[i][j] = wh;
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
          let xshift = Import.getShiftValue("x", newW), yshift = Import.getShiftValue("y", newH); // shift parameters
          for (let i = Math.max(yshift, 0); i<oldSize; ++i) {
            for (let j = Math.max(xshift, 0); j<oldSize; ++j)
            {
              let gh, newI = i - yshift, newJ = j - xshift;
              if (newI >= h.length || newI < 0 || newJ < 0 || newJ >= h[newI].length) gh = 0;
              else gh = Number(h[newI][newJ]) || 0;
              if (gh != 0 || allowReplace) {
                let data = this.Asteroids.modify(i,j,gh);
                if (data.changed) session.set(`${i}-${j}`,[data.prev,gh]);
              }
            }
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
      this.load(null,1,1, true);
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
    Import: {
      allowShift: false,
      allowReplace: true,
      fromText: function (text) {
        if (text != null && text != "") this.StarblastMap.Import.get("plain", text);
      },
      fromClipboard: function (text) {
        try {
          navigator.clipboard.readText().then(this.fromText.bind(this)).catch(this.fromClipboardWithPrompt.bind(this))
        }
        catch (e) { this.fromClipboardWithPrompt() }
      },
      fromClipboardWithPrompt: function () {
        this.fromText(prompt("Paste your text here:"));
      },
      get: function (type, data, init, exportData) {
        let map = [],fail = 0;
        switch (type)
        {
          case "plain":
            try {
              map = (String(data).match(/("|')(?:(?!\1)(?:\\.|[^\\]))*\1/g) || []).map(e => Function("return " + e)()).join("").split("\n");
            }
            catch (e) { fail = true }
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
        fail = !map.length || (map.length < 20 && map.length > 200);
        if (!fail && type.includes("url")) {
          let len = map.map(i => i.length);
          fail = map.length != Math.max(...len) || map.length != Math.min(...len);
        }
        if (exportData) return {map:map,fail:fail}
        if (!fail) fail = !this.StarblastMap.load(map,init);
        if (fail) alert("Invalid Map!");
      },
      shiftModes: ["left", "center", "right"],
      shiftMode: {
        x: "custom",
        y: "custom"
      },
      shiftValue: {
        x: 0,
        y: 0
      },
      isReplaceAllowed: function () {
        return !this.allowShift || this.allowReplace;
      },
      init: function () {
        for (let x of this.shiftModes) {
          for (let y of this.shiftModes) {
            let button = (this.elements.shiftButtons[x + "-" + y] = $("#align-" + x + "-" + y));
            button.on("click", function () {
              this.getValues(x, y, false)
            }.bind(this))
          }
        }

        for (let i of ["x", "y"]) this.elements.customShift[i].on("change", function () {
            this.getValues("custom", "custom", false)
        }.bind(this))

        this.elements.allowShift.on("change", function () {
            this.checkShiftEnabled();
        }.bind(this));

        this.elements.allowReplace.on("change", function () {
            this.checkReplaceAllowed();
        }.bind(this));

        this.checkShiftEnabled(true);
        this.checkReplaceAllowed(true);
        this.getValues(null, null, true);
      },
      checkShiftEnabled: function (init) {
        this.allowShift = this.StarblastMap.Engine.setCheckbox(init, "allowShift", "allow-shift", "allowShiftInd");
        this.elements.options.css("display", this.allowShift ? "" : "none")
      },
      checkReplaceAllowed: function (init) {
        this.allowReplace = this.StarblastMap.Engine.setCheckbox(init, "allowReplace", "allow-replace", "allowReplaceInd", true);
      },
      getValues: function (shiftModeX, shiftModeY, init) {
        if (init) {
          this.shiftMode.x = localData.getItem("shift-mode-x") || "custom";
          this.shiftMode.y = localData.getItem("shift-mode-y") || "custom";

          this.shiftValue.x = Math.trunc(localData.getItem("shift-value-x"), 0);
          this.shiftValue.y = Math.trunc(localData.getItem("shift-value-y"), 0);
        }
        else {
          this.shiftMode.x = shiftModeX;
          this.shiftMode.y = shiftModeY;

          this.shiftValue.x = Math.trunc(+this.elements.customShift.x.val()) || 0;
          this.shiftValue.y = Math.trunc(+this.elements.customShift.y.val()) || 0;
        }

        localData.setItem("shift-mode-x", this.shiftMode.x);
        localData.setItem("shift-mode-y", this.shiftMode.y);

        localData.setItem("shift-value-x", this.shiftValue.x);
        localData.setItem("shift-value-y", this.shiftValue.y);

        for (let E of Object.values(this.elements.shiftButtons)) {
          E.css("border-width", "1px");
          E.prop("disabled", false);
        }

        let newE = this.elements.shiftButtons[this.shiftMode.x + "-" + this.shiftMode.y];
        if (newE) {
          newE.css("border-width", "3px");
          newE.prop("disabled", true);
        }

        this.elements.customShift.x.val(this.shiftValue.x);
        this.elements.customShift.y.val(this.shiftValue.y);
      },
      getShiftValue: function (name, newSize) {
        if (!this.allowShift) return 0;
        switch (this.shiftMode[name]) {
          case "left":
            return 0;
          case "right":
          case "center": {
            let val = this.StarblastMap.size - newSize;
            if (this.shiftMode[name] == "right") return val;
            return Math.trunc(val / 2);
          }
          default:
            return this.shiftValue[name];
        }
      },
      elements: {
        options: $("#import-options"),
        importButton: $("#loadMap"),
        importFromClipboard: $("#importFromClipboard"),
        shiftButtons: {},
        allowShift: $("#allowShift"),
        allowReplace: $("#allowReplace"),
        customAlignment: $("#custom-alignments"),
        alignments: $("#alignments-preset"),
        customShift: {
          x: $("#shiftX"),
          y: $("#shiftY")
        }
      }
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
      let custom = num == null, min = StarblastMap.Asteroids.size.min, max = StarblastMap.Asteroids.size.max, init = custom?StarblastMap.Engine.random.range(min,max):num,
      Cell = {
        getPosition: function(type) {
          return StarblastMap.Coordinates.getPosition(x,y,type)
        },
        size:init,
        isRemoved: !custom
      }, SBMap = {
        Asteroids: {
          set: function(x,y,size,type) {
            let results = StarblastMap.Coordinates.restore(x,y,size,type,"set");
            if (results.success) {
              let t = results.results, clone = [t];
              if (StarblastMap.Engine.Mirror.v) clone.push([StarblastMap.size-t[0]-1,t[1],t[2]]);
              if (StarblastMap.Engine.Mirror.h) clone.push([t[0],StarblastMap.size-t[1]-1,t[2]]);
              if (StarblastMap.Engine.Mirror.v && StarblastMap.Engine.Mirror.h) clone.push([StarblastMap.size-t[0]-1,StarblastMap.size-t[1]-1,t[2]]);
              for (let k of clone)
              {
                let data = StarblastMap.Asteroids.modify(...k, false, true);
                if (data.changed){
                  let pos = k.slice(0,2).join("-"), prev = StarblastMap.session.get(pos);
                  StarblastMap.session.set(pos,[(prev)?prev[0]:data.prev,k[2]]);
                }
              }
              StarblastMap.sync()
            }
          },
          get: function(x,y,type) {
            let h = StarblastMap.Coordinates.restore(x,y,0,type,"get");
            if (h.success) {
              let t = h.results;
              return StarblastMap.data[t[1]][t[0]]
            }
            else return null;
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
    },
    sync: function () {
      localData.setItem("map",JSON.stringify(this.data));
    },
    undo: function() {
      this.selection.exit(false);
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
          this.load(lastAction[1],null,1,true);
          break;
      }
      this.sync();
      this.history.splice(this.history.length-1,1);
      this.checkActions();
    },
    redo: function() {
      this.selection.exit(false);
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
          this.load(futureAction[1],null,1, true);
          break;
      }
      this.sync();
      this.future.splice(0,1);
      this.checkActions();
    },
    Asteroids: {
      RandomOptions: $("#RandomOptions"),
      dragMode: false,
      template: new Image(),
      draw: function (x, y, num) {
        let c2d = StarblastMap.map.getContext('2d'), gridIndex = StarblastMap.gridIndex;
        let drawX = (x*10+1) * gridIndex, drawY = (y*10+1) * gridIndex;
        let maxSize = 9 * gridIndex;
        c2d.clearRect(drawY, drawX , maxSize, maxSize);
        if (num == 0) return;
        c2d.beginPath();
        let asteroidSize = gridIndex * num;
        let drawMargin = (maxSize - asteroidSize) / 2;
        // image filter application
        c2d.drawImage(this.template, drawY + drawMargin, drawX + drawMargin, asteroidSize, asteroidSize);
        c2d.fillStyle = this.color;
        c2d.globalCompositeOperation = "source-atop";
        c2d.fillRect(drawY, drawX, maxSize, maxSize);
        c2d.globalCompositeOperation = "source-over";
      },
      modify: function(x,y,num,init,throwError) {
        try {
          if (!StarblastMap.isValidCell(x, y)) throw {name: "Unknown cell", message: ""}
          let prev=(StarblastMap.data[x]||[])[y]||-1;
          if (prev != num || init)
          {
            this.draw(x, y, num);
            if (num == 0) StarblastMap.pattern.delete(`${x}-${y}`);
            else StarblastMap.pattern.set(`${x}-${y}`,num);
            StarblastMap.data[x][y]=num;
            return {changed: true, prev: (prev == -1)?0:prev};
          }
          else return {changed:false};
        }
        catch(e){
          if (!init && throwError) throw e
        }
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
          let margin = (9 - i) * gridIndex / 2; 
          c2d.drawImage(this.template, margin, margin , i * gridIndex, i * gridIndex);
          c2d.fillStyle = this.color;
          c2d.globalCompositeOperation = "source-atop";
          c2d.fillRect(0,0,c.width,c.height);
          c2d.globalCompositeOperation = "source-over";
        }
      },
      changeSize: function (num) {
        let u=Math.min(Math.max(Number(num)||0,0),9);
        this.clearSelection();
        this.highlightButton("asc"+u);
        for (let i in this.input) this.input[i].val(u);
        this.dragMode = false;
        this.applyKey("min",u);
        this.applyKey("max",u);
        this.RandomOptions.css("display","none");
      },
      clearSelection: function () {
        for (let i of Array(10).fill(0).map((i,j)=>"asc"+j).concat("randomSize", "dragMode")) $("#"+i).attr('choosen', 'false')
      },
      input: {
        max: $("#maxASSize"),
        min: $("#minASSize")
      },
      highlightButton: function (id) {
        this.clearSelection();
        $("#"+id).attr('choosen', 'true');
      },
      toggleDragMode: function () {
        this.dragMode = true;
        if (this.dragMode) {
          this.highlightButton("dragMode");
          this.RandomOptions.css("display", "none");
        }
        else this.randomSize(true);
      },
      applyKey: function(key,num){
        let size = Math.min(Math.max(Number(num)||0,0),9);
        this.size[key] = size;
        localData.setItem("ASSize_"+key, size);
        this.input[key].val(size);
      },
      randomSize: function(self_trigger,local)
      {
        this.dragMode = false;
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
        if (self_trigger && this.size.max == this.size.min) this.changeSize(this.size.min);
        else {
          this.RandomOptions.css("display","");
          this.highlightButton("randomSize");
        }
      },
      size:{
        max: 0,
        min: 0
      }
    },
    applySize: function (num) {
      let dsize= {
        min:20,
        max:200
      }
      let size=Math.round((num != void 0)?num:(Number(localData.getItem("size"))||dsize.min));
      size=Math.max(Math.min(dsize.max,size),dsize.min);
      size = Math.round(size/2) *2;
      StarblastMap.sizeInput.val(size);
      StarblastMap.size = size;
      localData.setItem("size", size);
      return size;
    },
    Engine: {
      supportClipboardAPI: !!(window.Clipboard && window.ClipboardItem),
      touchHover: false,
      touches: new Map(),
      touchID: 1,
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
        start: function (x,y,event)
        {
          if (StarblastMap.Asteroids.dragMode) return this.startDrag();
          this.startModify(x,y,event);
        },
        stop: function () {
          if (StarblastMap.Asteroids.dragMode) return this.stopDrag();
          this.stopModify();
        },
        stopModify: function () {
          this.state = -1;
          StarblastMap.Engine.touchHover = false;
          StarblastMap.Coordinates.lastVisited = [-1,-1];
          StarblastMap.pushSession("history",["m",StarblastMap.session]);
          StarblastMap.session = new Map();
        },
        startModify: function (x,y,event) {
          switch (event.button) {
            case 0: // left-click
              let dat = StarblastMap.selection.list.get(`${x}-${y}`);
              if (dat != null && dat.layers.at(-1)) {
                StarblastMap.selection.setOrigin(x, y);
                StarblastMap.selection.moveTo(x, y);
                break;
              }
              StarblastMap.selection.exit(true);
              this.state=1;
              StarblastMap.modify(x,y);
              StarblastMap.future = [];
              StarblastMap.Buttons.redo.prop("disabled",true);
              break;
            case 2: // right-click
              this.state=0;
              // if user isn't holding Ctrl --> save last selection
              if (!StarblastMap.selection.keyHold) StarblastMap.selection.exit(true);

              StarblastMap.selection.setOrigin(x, y);
              StarblastMap.selection.handle(x, y);
              break;
          }
          StarblastMap.Coordinates.lastVisited = [x,y];
        },
        startDrag: function () {
          this.state = -1;
        },
        stopDrag: function () {
          this.stats = -1;
        }
      },
      addBorder: function (c2d,x,y,z,t)
      {
        let width = StarblastMap.gridIndex;
        c2d.clearRect(x-width/2,y-width/2,z-x+width,t-y+width);
        if (!StarblastMap.border.hide) {
          c2d.moveTo(x,y);
          c2d.lineTo(z,t);
          c2d.stroke();
        }
      },
      applyColor: function (para,inp) {
        let css,defl = ["default","inherit","initial"].indexOf((inp||"").toLowerCase())!=-1,param = para.toLowerCase();
        if (inp == void 0 || defl)
        {
          if ((localData.getItem(param)||"undefined") == "undefined"  || defl)
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
          else css=localData.getItem(param);
        }
        else css= inp;
        let color = new w3color(css);
        css = color.toHexString();
        let root = document.querySelector(':root').style;
        switch (param)
        {
          case "as-color":
            StarblastMap.Asteroids.color = css;
            for (let i of [...StarblastMap.pattern]) StarblastMap.Asteroids.modify(...i[0].split("-"),i[1],1);
            for (let i=1;i<10;i++) StarblastMap.Asteroids.drawSelection(i);
            break;
          case "background-color":
            let baseColor = '#' + (!!color.isDark()*(16**6-1)).toString(16).padStart(0, 6);
            root.setProperty('--background-color', css);
            root.setProperty('--color', baseColor);
            StarblastMap.background.color = css;
            break;
          case "border-color":
            let c2d = StarblastMap.map.getContext('2d'), size = StarblastMap.size, gridIndex = StarblastMap.gridIndex;
            c2d.beginPath();
            c2d.strokeStyle = css;
            c2d.lineWidth = StarblastMap.borderScale * gridIndex;
            for (let i=0;i<=size;i++)
            {
              this.addBorder(c2d,(i*10+1/2)*gridIndex,1/2*gridIndex,(i*10+1/2)*gridIndex,(size*10+1/2)*gridIndex);
              this.addBorder(c2d,1/2*gridIndex,(i*10+1/2)*gridIndex,(size*10+1/2)*gridIndex,(i*10+1/2)*gridIndex);
            }
            root.setProperty('--border-color', css);
            StarblastMap.border.color = css;
            break;
        }
        $("#"+param).val(css);
        localData.setItem(param,css);
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
            fontSize: "1.2vmax"
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
              code: "let br = StarblastMap.Brush.size, cell = Cell.getPosition(0);\nfor (let i=Math.max(cell.x-br,0);i<=Math.min(cell.x+br,StarblastMap.size-1);i++)\n  for (let j=Math.max(cell.y-br,0);j<=Math.min(cell.y+br,StarblastMap.size-1);j++) {\n    let num = (StarblastMap.Brush.isRandomized && !Cell.isRemoved)?StarblastMap.Utils.randomInRange(StarblastMap.Asteroids.size.min,StarblastMap.Asteroids.size.max):Cell.size;\n    StarblastMap.Asteroids.set(i,j,num);\n  }"
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
            localData.setItem("brushIndex",i);
            for (let j=0;j<this.list.length;j++) $("#brush"+j).attr('choosen', 'false');
            $("#brush"+i).attr('choosen', 'true');
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
            localData.setItem("customBrush",JSON.stringify(this.list.slice(this.defaultIndex+1,this.list.length)));
          }
        },
        defaultIndex: 0,
        applyRandom: function(origin) {
          this.randomized = StarblastMap.Engine.setCheckbox(origin,"randomCheck","randomizedBrush","rInd");
        },
        size: 0,
        applySize: function (num) {
          num = num || (Number(localData.getItem("brush"))||0)
          let max=StarblastMap.size;
          let size=Math.round(num);
          size=Math.max(Math.min(max,size),0);
          this.input.val(size);
          this.size = size;
          localData.setItem("brush",size);
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
      copyToClipboard: function (blob)
      {
        navigator.clipboard.write([new ClipboardItem({[blob.type]:blob})]);
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
          bool = (bool == void 0)?(localData.getItem("hideMenu") == "true"):!!bool;
          this.isHidden = bool;
          localData.setItem("hideMenu", bool);
          $("#short-main").css("display",bool?"":"none");
          $("#main").css("display",bool?"none":"");
        },
        checkScale: function() {
          this.scaleExpired = !0;
          $("#mapBox").css({
            "padding-top": (this.main.height()+10/detectZoom.device())+"px",
            "margin-bottom": $("#footer").height()+"px"
          });
          try{$("#info").css("width",($("#footer").width()-$("#XY").width()-15/detectZoom.device())+"px")}catch(e){}
        },
        set: function(index) {
          for (let i=0;i<this.modules.length;i++) {
            if (i!==index) {
              $("#menu"+i).attr('choosen', 'false');
              $("#container"+i).attr('shown', 'false')
            }
          }
          index = Math.max(Math.min(this.modules.length-1,Math.round((typeof index != "number")?this.chosenIndex:index)),0);
          this.chosenIndex = index;
          $("#menu"+index).attr('choosen', 'true');
          $("#container"+index).attr('shown', 'true')
        }
      },
      random: function(num) {
        return ~~(Math.random()*num);
      },
      setCheckbox: function (origin, triggerID, storage, IndID, defaultvalue = false) {
        let storageData = localData.getItem(storage);
        let u = origin?(storageData == null ? defaultvalue : (storageData == "true")):$("#"+triggerID).is(":checked");
        origin && $("#"+triggerID).prop("checked",u);
        (IndID) && $("#"+IndID).prop("class","fas fa-fw fa-"+(u?"check":"times"));
        localData.setItem(storage, u);
        return u;
      },
      info: {
        list: [
          ["show-menu",null,"Show the Map menu"],
          ["hide-menu",null,"Hide the Map menu"],
          ["map_size-input",null,'Toggle map size (from 20 to 200 and must be even)'],
          ["dragMode","Drag Mode","Move freely around the map without modifying any asteroids"],
          ["asc0",null,'Remove asteroids in the map',"0"],
          ...new Array(9).fill(0).map((j,i) => [`asc${i+1}`,null,`Asteroid size ${i+1}`,`${i+1}`]),
          ["randomSize",'Random Asteroid Size','Draw random asteroids in a specific size range',"R"],
          ["brush_size-input",null,'Toggle brush radius (0 to current map size)'],
          ["minASSize",null,'Toggle minimum Asteroid size (0 to Maximum Asteroid Size)'],
          ["maxASSize",null,'Toggle maximum Asteroid size (Minimum Asteroid Size to 9)'],
          ["mr-h",null,"Toggle horizontal Mirror"],
          ["mr-v",null,"Toggle vertical Mirror"],
          ["almr",null,"All-Corners mirror is enabled"],
          ["rCheckIcon",'Random Asteroid Size in Brush','Random Asteroids Size in a single Brush'],
          ["as-color-input",null,'Toggle asteroid color'],
          ["background-color-input",null,'Toggle background color'],
          ["bgI-input1",null,"Upload your own background image from file (accept all image formats)"],
          ["bgI-url",null,"Upload your own background image from url"],
          ["bgI-alpha-input",null,"Toggle background image opacity (0% to 100% - Only available in Map Only Selection)"],
          ["bgI-clear",null,"Clear current custom background image"],
          ["border-color-input",null,'Toggle line color'],
          ["undo","Undo","Undo previous actions in the map","Ctrl(Cmd) + Z"],
          ["redo","Redo","Redo undid actions in the map","Ctrl(Cmd) + Y"],
          ["clearMap",'Clear Map','Clear all asteroids in the current map'],
          ["exportText",'Export Map as Text','Export map as a text/plain (*.txt) file',"Ctrl(Cmd) + S"],
          ["copyText",'Copy Map','Copy current map pattern to clipboard',"Ctrl(Cmd) + C"],
          ["loadMap1",'Import Map','Import map from file (accept text/plain (*.txt/*.text) and text/javascript (*.js) format)',"Ctrl(Cmd) + Z"],
          ["random",'RandomMazeGenerator', 'Generate Random Maze according to the current map size. By [rvan_der](https://github.com/rvan-der)'],
          ["feedback",'Feedback','Give us a feedback'],
          ["permalink",'Permalink','Copy map permalink to clipboard'],
          ["exportImage",'Export Map as Image','Export map screenshot as a PNG (*.png) file',"Ctrl(Cmd) + I"],
          ["copyImage",'Copy Map screenshot','Copy Map screenshot as as a PNG (*.png) file to Clipboard'],
          ["tutorial",'Tutorial','Visit the Map Editor Tutorial Page'],
          ["changelog",'Changelog',"View the update's log of Map Editor from the beginning"],
          ["XY",null,'Your cursor position in the map. Hover the map for details'],
          ["addBrush",null,"Add your custom brush"],
          ["removeBrush",null,"Remove the selected custom brush"],
          ["editBrush",null,"Edit the selected custom brush"],
          ["coordtype",null,"Toggle Coordinates' perspective"],
          ["map_id-input",null, "(IDMapper) Map ID"],
          ["game_mode-select",null,"(IDMapper) Applied Game Mode"],
          ["IDMapperApply",null,"(IDMapper) Apply changes and create map"],
          ["rAllowShift", "Allow resizing maps", "Allow/Forbid the tool to resize the map based on newly imported map"],
          ["align-left-left", null, "Top Left"],
          ["align-center-left", null, "Top, Centered Horizontally"],
          ["align-right-left", null, "Top Right"],
          ["align-left-center", null, "Left, Centered Vertically"],
          ["align-center-center", null, "\"Perfectly balanced, as all things should be...\""],
          ["align-right-center", null, "Right, Centered Vertically"],
          ["align-left-right", null, "Bottom Left"],
          ["align-center-right", null, "Bottom, Centered Horizontally"],
          ["align-right-right", null, "Bottom Right"],
          ["shiftX", null, "Set custom X shift value"],
          ["shiftY", null, "Set custom Y shift value"],
          ["rAllowReplace", null, "Toggle new map to be overwritten over old map, otherwise overlapped"],
          ["importFromClipboard", null, "Import new map from your clipboard", "Ctrl(Cmd) + V"],
          ["clear-local-data", "Clear local data", "Clears your local data and sets all to default"]
        ],
        view: function (title,text,HotKey) {
          $("#info").html(`<strong>${StarblastMap.Engine.encodeHTML(title||"")}${(title&&text)?": ":""}</strong>${StarblastMap.Engine.encodeHTML(text||"")}${HotKey?(" (HotKey "+HotKey+")"):""}`);
        }
      }
    }
  }
  StarblastMap.Engine.info.list.unshift(...StarblastMap.Engine.menu.modules.map((i,j) => ["menu"+j,null,i+" Tab"]));
  bindIDMapper(StarblastMap);
  StarblastMap.IDMapper.StarblastMap = StarblastMap;
  StarblastMap.Import.StarblastMap = StarblastMap;
  StarblastMap.Import.init();
  bindRandomMaze(StarblastMap);
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
        try{error = StarblastMap.Import.get("url",query[1],0,1).fail}catch(e){error=1};
        if (error) {
          if (error = !confirm("You are using the old permalink method.\nDo you want to go to the new one?"), !error) return "?"+StarblastMap.export("url",StarblastMap.Import.get("url-old",query[1],0,1).map);
        }
        else (error = !confirm("Map pattern from URL detected!\nLoad map?\n(Note: this action cannot be undone)"), !error);
        break;
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
        let storageMap = JSON.parse(localData.getItem("map"));
        if (Array.isArray(storageMap)) StarblastMap.data = storageMap;
        else throw "Nope";
      }
      catch(e){fail = 1}
      if (fail) StarblastMap.create(1);
      else StarblastMap.load(null,1,1);
    }
    else StarblastMap.Import.get("url",query[1],1);
    for (let i=0;i<10;i++)
    {
      (i) && StarblastMap.Asteroids.drawSelection(i);
      $("#asc"+(i)).on("click", function(){StarblastMap.Asteroids.changeSize(i)});
    }
    $("#dragMode").on('click', function(){StarblastMap.Asteroids.toggleDragMode()});
    StarblastMap.background.check(null,0,1);
    StarblastMap.background.checkAlpha();
    StarblastMap.IDMapper.loadGameModes();
    StarblastMap.IDMapper.check(1);
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
  StarblastMap.Asteroids.template.src = "/starblast/mapeditor/Asteroid.png";
  $("#asChoose").html(`<tr><td id="dragMode"><i class="fas fa-fw fa-mouse-pointer"></i></td></td><td id="asc0"><i class="fas fa-fw fa-eraser"></i></td>`+Array(9).fill(0).map((x,i) => `<td id='asc${i+1}'><canvas id="as${i+1}" class="as"></canvas></td>`).join("")+`<td id='randomSize'><i class="fas fa-fw fa-dice"></i></td></tr>`);
  try {
    let mr = ["h","v"],mdesc = ["horizontal","vertical"];
    $("#MirrorOptions").append(mr.map(i => `<input type="checkbox" style="display:none" id="mirror-${i}">`).join("")+"<table id='mirrorChoose'><tr>"+mr.map((i,j) => `<td id="mr-${i}"><i class="fas fa-fw fa-arrows-alt-${i}"></i><i class="fas fa-fw fa-times" id="mrmark-${i}"></i></td>`).join("")+`<td id="almr"><i class="fas fa-fw fa-expand-arrows-alt"></i></td></tr>`);
    for (let i of mr)
    {
      StarblastMap.Engine.Mirror.apply(!0,i);
      $("#mirror-"+i).on("change",function(){StarblastMap.Engine.Mirror.apply(null,i)});
      $("#mr-"+i).on("click",function(){$("#mirror-"+i).click()});
    }
  }
  catch(e){}
  StarblastMap.Asteroids.applyKey("min",localData.getItem("ASSize_min"));
  StarblastMap.Asteroids.applyKey("max",localData.getItem("ASSize_max"));
  StarblastMap.map.addEventListener("mousemove", function(e){
    this.view(this.get(e.offsetX),this.get(e.offsetY), true);
  }.bind(StarblastMap.Coordinates));
  StarblastMap.map.addEventListener("touchmove", function(e){
    if (!StarblastMap.Engine.touchHover) {
      StarblastMap.info(!0)();
      StarblastMap.Engine.touchHover = true;
    }
    if (!StarblastMap.Asteroids.dragMode) e.preventDefault();
    if (StarblastMap.Engine.menu.scaleExpired) {
      Object.assign(StarblastMap.Engine.menu,$(StarblastMap.map).offset());
      StarblastMap.Engine.menu.scaleExpired = !1;
    }
    let u;
    for (let i of e.touches) {
      this.view(this.get(i.pageX-StarblastMap.Engine.menu.left),this.get(i.pageY-StarblastMap.Engine.menu.top),u);
      if (!u) u = true;
    }
  }.bind(StarblastMap.Coordinates));
  StarblastMap.map.addEventListener("mouseover",function(){(!StarblastMap.Engine.touchHover) && StarblastMap.info()()});
  StarblastMap.map.addEventListener("mousedown", function(e){
    StarblastMap.Engine.Trail.start(StarblastMap.Coordinates.get(e.offsetX),StarblastMap.Coordinates.get(e.offsetY),e);
  });
  StarblastMap.map.addEventListener("touchstart", function(e){
    this.info(!0)();
    if (!this.Asteroids.dragMode) e.preventDefault();
    if (this.Engine.menu.scaleExpired) {
      Object.assign(this.Engine.menu,$(this.map).offset());
      this.Engine.menu.scaleExpired = !1;
    }
    for (let i of e.touches) {
      i.id = this.Engine.touchID++;
      this.Engine.touches.set(i.id, i);
      this.Engine.Trail.start(this.Coordinates.get(i.pageX-this.Engine.menu.left),this.Coordinates.get(i.pageY-this.Engine.menu.top), {button: 0});
    }
  }.bind(StarblastMap));
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
    confirm("Would you like to remove your background image?") && StarblastMap.background.check(null,1);
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
  for (let i=0;i<StarblastMap.Engine.menu.modules.length;i++) $("#menu"+i).on("click",function(){StarblastMap.Engine.menu.set(i)});
  StarblastMap.Engine.menu.set(1);
  StarblastMap.Buttons.export.text.on("click",function() {
    StarblastMap.download("plain");
  });
  StarblastMap.Buttons.export.image.on("click",function() {
    StarblastMap.download("image");
  });
  StarblastMap.Buttons.randomMaze.on("click", function() {
    StarblastMap.load(StarblastMap.randomMaze().split("\n"), false, false, true);
  });
  StarblastMap.Engine.menu.hide();
  $("#show-menu").on("click", function(){StarblastMap.Engine.menu.hide(!1)});
  $("#hide-menu").on("click", function(){StarblastMap.Engine.menu.hide(!0)});
  StarblastMap.background.alphaInput.on("change", function(){StarblastMap.background.checkAlpha(StarblastMap.background.alphaInput.val())});
  StarblastMap.Buttons.copy.text.on("click", function(){StarblastMap.copy("plain")});
  StarblastMap.Buttons.clearData.on("click", StarblastMap.clearData);
  StarblastMap.IDMapper.applyButton.on("click", function(){StarblastMap.IDMapper.check()});
  StarblastMap.Import.elements.importFromClipboard.on("click", function () {
    StarblastMap.Import.fromClipboard();
  })
  StarblastMap.Import.elements.importButton.on("change", function(e) {
    if (e.target.files && e.target.files[0]) {
      let file=e.target.files[0];
      if (file.type.match("plain") || file.type.match("javascript")) {
        let fr = new FileReader();
        fr.onload = (function(reader)
        {
            return function()
            {
                StarblastMap.Import.get("plain",reader.result);
            }
        })(fr);
        fr.readAsText(file);
      }
      else alert("Unsupported file format!");
      StarblastMap.Import.elements.importButton.val("");
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
    document.addEventListener("keydown", function(e) {
      let size=["#brush_size","#map_size","#background-color","#border-color","#as-color","#maxASSize","#minASSize","#brushname","#brushdesc","#brushicon","#brushauthor",".ace_text-input","#map_id","#shiftX","#shiftY"],check=[];
      for (let i of size) check.push($(i).is(":focus"));
      if (!Math.max(...check))
      {
        StarblastMap.selection.keyHold = e.ctrlKey || e.metaKey;
        if (StarblastMap.selection.keyHold) switch(e.which)
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
          case 118:
          case 86:
            e.preventDefault();
            StarblastMap.Import.fromClipboard();
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
    });
    document.addEventListener("keyup", function (e) {
      if (["Meta", "Control", "Ctrl"].includes(e.key)) StarblastMap.selection.keyHold = false;
    });
  }
  catch(e){}
  try {
    let cbr = JSON.parse(localData.getItem("customBrush"));
    StarblastMap.Engine.Brush.drawers.editIndex = null;
    if (Array.isArray(cbr)) for (let i of cbr)
    {
      if (!StarblastMap.Engine.Brush.drawers.get(i.code||"{").error) StarblastMap.Engine.Brush.drawers.update(i.code, i.name, i.description, i.icon, i.author);
    }
    StarblastMap.Engine.Brush.drawers.sync();
    StarblastMap.Engine.Brush.drawers.redrawSelection();
    let cbrid = Number(localData.getItem("brushIndex"))||0;
    cbrid = Math.max(Math.min(cbrid,StarblastMap.Engine.Brush.drawers.list.length-1),0);
    StarblastMap.Engine.Brush.drawers.select(cbrid);
    let chooser = StarblastMap.Coordinates.setType.bind(StarblastMap.Coordinates);
    StarblastMap.Coordinates.typeChooser.html("<option disabled>Choose Coordinate Type</option>");
    StarblastMap.Coordinates.names.forEach(function(t){StarblastMap.Coordinates.typeChooser.append("<option>"+t+"</option>")});
    StarblastMap.Coordinates.typeChooser.on("click",function(){chooser()});
    chooser(!0);
  }
  catch(e){}
  $("#save").on("click", function(){
    let code = StarblastMap.Engine.Brush.drawers.codeEditor.getValue(),p = StarblastMap.Engine.Brush.drawers.get(code||"{");
    if (p.error) alert(p.error);
    else {
      let proc, test = /((window\.)*(document|localData|open|close|location|\$|ResizeSensor|LZString|ace|detectZoom))/g;
      if (proc = !test.test(code), !proc) proc = confirm("Hold up!\nThis script may contain malicious code that can be used for data-accessing or trolling\nDo you still want to proceed?\nMatched criteria(s):\n"+code.match(test).join(","));
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
    if (localData.getItem("modwarn") != "true") {
      alert("WARNING!\nWe won't be responsible for any problems caused by your code\nOnly runs code from the source that you trust");
      localData.setItem("modwarn", true);
    }
  });
  $("#editBrush").on("click",function(){StarblastMap.Engine.Brush.drawers.showCode(1)});
  for (let eventname of ["mouseup", "blur"]) window.addEventListener(eventname, function (e) {
    this.Trail.stop(e);
    this.touches = new Map();
  }.bind(StarblastMap.Engine));
  for (let eventname of ["touchend", "touchcancel"]) window.addEventListener(eventname, function (e){
    for (let i of e.touches) this.touches.delete(i.id);
    if (this.touches.size == 0) this.Trail.stop(e);
  }.bind(StarblastMap.Engine));
  StarblastMap.Buttons.permalink.on("click", function(){
    StarblastMap.Engine.setURL(StarblastMap.export("url"));
    StarblastMap.copy("url");
  });
  for (let i of ["brush_size","map_size","border-color","background-color","minASSize","maxASSize","map_id"])
  $("#"+i).on("keypress",function(e){if (e.which == 13) $("#"+i).blur()});
  for (let i of StarblastMap.Engine.info.list) $("#"+i[0]).on("mouseover",function(){
    StarblastMap.Engine.info.view(i[1],i[2],i[3]);
  });
  for (let i of ["border","background","as"])
  {
    StarblastMap.Engine.applyColor(i+"-color");
    $("#"+i+"-color").on("change", function(){
      StarblastMap.Engine.applyColor(i+"-color",$("#"+i+"-color").val());
    });
  }
}());
