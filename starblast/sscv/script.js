(function(){
  addServiceWorker("sw.js");
  var SSCV = {
    types: {
      list: [
        {
          name: "Ship Editor code",
          parse: function(data) {
            data = Function("return "+data.replace(/[^]+?[^\\]'((return)*([^]+?[^\\]))'[^]+/,"'$3'"))();
            let result;
            try {
              let ship = JSON.parse(data);
              delete ship.typespec;
              result = "return "+js2coffee.build("model="+JSON.stringify(ship)).code;
            }
            catch(e) {
              result = js2coffee.build(data.replace(/(}\)\.call\(this\);*$)/,";x$1")).code.replace(/^\(\-\>\n*/,"").replace(/\n*\s*x\n*\s*return\n*\s*\)\.call\sthis\n*$/,"").replace(/\n*\s*\w+\s*=\s*undefined/g,"").replace(/(\n\s+)/g,function(v){return v.slice(0,v.length-2)}).replace(/_this\s*=\s*this/,"").trim().replace(/(model$|^model)/,"return $1").replace(/\(\n\s+/g,"(").replace(/\n\s+\)/g,")");
            }
            return result.replace(/\n+\s+(?=[^[\]]*\])/g, ",").replace(/\[,/g, "[").replace(/,\]/g, "]").replace(/'(\w+)':/g, "$1:");
          }
        },
        {
          name: "Basic WikiText info",
          parse: function(data) {
            let x = JSON.parse(eval("(function(){return "+data.replace(/.+?\=\s*(.+)/g,"$1")+"})();")) || {}, s = x.typespec || {}, t = function(first,...props) {
              try {
                let arr = a(first,...props);
                if (!Array.isArray(arr)) return "N/A";
                let i=0;
                while (i<arr.length) {
                  if (arr.indexOf(arr[i])<i) arr.splice(i,1);
                  else i++
                }
                return arr.join("/")||"N/A";
              }
              catch(e){return "N/A"}
            }, a = function(a,...b){
              let kx = a;
              return b.forEach(i=>kx = kx[i]),kx;
            }, u = function(k,b,...c) {
              let j;
              try{j = a(k,...c)}
              catch(e){j = null}
              return (j!=null)?j:(b!=null?b:"N/A");
            }
            wikitext = `{{Ship-Infobox
|name=${s.name||""}
|image=${(s.name||"").replace(/\s/g,"_")}.png
|shieldc=${t(s,"specs","shield","capacity")}
|shieldr=${t(s,"specs","shield","reload")}
|energyc=${t(s,"specs","generator","capacity")}
|energyr=${t(s,"specs","generator","reload")}
|turning=${t(s,"specs","ship","rotation")}
|acceleration=${t(s,"specs","ship","acceleration")}
|speed=${t(s,"specs","ship","speed")}
|tier=${u(s,null,"level")}
|mass=${u(s,null,"specs","ship","mass")}
|designer=${u(x,"Neuronality","designer")}
}}\n
== Cannons ==\n`;
            let lasers = s.lasers;
            lasers = (Array.isArray(lasers)?lasers:[]).map(laser => {
              laser.x = Math.abs(laser.x);
              laser.y = Math.abs(laser.y);
              laser.z = Math.abs(laser.z);
              return laser;
            }), dups = new Map(), i = 0;
            while (i<lasers.length) {
              let laser = lasers[i], p = [laser.x,laser.y,laser.z].join("-"), dupi = dups.get(p);
              if (!dupi) {
                dups.set(p,laser);
                i++;
              }
              else {
                lasers.splice(i,1);
                dups.get(p).dual = true;
                dups.delete(p);
              }
            };
            let dash = u(s,0,"specs","ship","dash");
            if (dash) wikitext+=`{{Cannon
|type=Dash
|energy=${t(dash,"energy")}
|damage=${t(dash,"energy")}
|speed=${t(dash,"burst_speed")}
|dual=N/A
|recoil=N/A
|frequency=1
|error=N/A
|angle=N/A
|spread=N/A
}}\n`;
            for (let laser of lasers) wikitext+=`{{Cannon
|type=${["Stream","Pulse"][(laser.type-1)||0]}
|energy=${(function(){let gx = u(laser,"N/A","damage");return Array.isArray(gx)?gx.map(lar => ((laser.dual?(lar*2):lar)||0)).join("/"):"N/A"})()}
|damage=${t(laser,"damage")}
|speed=${t(laser,"speed")}
|dual=${!!u(laser,0,"dual")}
|recoil=${u(laser,0,"recoil")}
|frequency=${u(laser,1,"rate")}
|error=${u(laser,0,"error")}
|angle=${Math.abs(u(laser,0,"angle"))}
|spread=${Math.abs(u(laser,0,"spread"))}
}}\n`;
            if (!(dash || lasers.length)) wikitext+="This ship has no cannons or dashes";
            return wikitext;
          }
        }
      ],
      set: function() {
        $("#types").html("<option selected disabled>Select conversion type</option>"+this.list.map(i => `<option>${i.name}</option>`).join(""));
        this.choose();
      },
      choose: function() {
        let select = $("#types").prop("selectedIndex");
        if (select < 1 || select > this.list.length) {
          let t = Number(localStorage.getItem("selected-conversion-type"));
          select = (t > 0 && t <= this.list.length && !isNaN(t))?t:1;
        }
        select = Math.trunc(select);
        localStorage.setItem("selected-conversion-type",select);
        $("#types").prop("selectedIndex",select);
        return select;
      }
    },
    convert: function (forced) {
      let json = $("#input").val() || localStorage.getItem("json-input"), results;
      try {results = this.types.list[this.types.choose() - 1].parse(json.trim())}
      catch(e){
        if (forced) {
          json = ""
          results = "";
        }
        else {
          this.error(e);
          return;
        }
      };
      localStorage.setItem("json-input",json);
      $("#output").val(results);
      $("#input").val(json);
    },
    error: function(e) {
      console.error(e);
      alert("Cannot parse the requested code!");
    },
    copy: function (text) {
      var dummy = document.createElement("textarea");
      document.body.appendChild(dummy);
      dummy.value = text;
      dummy.select();
      document.execCommand("copy");
      document.body.removeChild(dummy);
    }
  }
  SSCV.types.set();
  SSCV.convert(!0);
  $("#convert").on("click",function(){SSCV.convert()});
  $("#copy").on("click",function(){SSCV.copy($("#output").val())});
})();
