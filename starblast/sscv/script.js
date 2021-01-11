(function(){
  var SSCV = {
    types: {
      list: [
        {
          name: "Ship Editor code",
          parse: function(data) {
            data = data.replace(/.+?[^\\]'((return)*(.+?[^\\]))'.+/,"$3").replace(/\\+/g,function(v){return v.slice(1,v.length)});
            let result;
            try {
              let ship = JSON.parse(data);
              delete ship.typespec;
              result = "return "+js2coffee.build("model="+JSON.stringify(ship)).code;
            }
            catch(e) {
              result = js2coffee.build(data).code.replace(/^\(\-\>\n*/,"").replace(/\n*\)\.call\sthis\n*$/,"").replace(/\n*\s*\w+\s*=\s*undefined/g,"").replace(/(\n\s+)/g,function(v){return v.slice(0,v.length-2)}).replace(/_this\s*=\s*this/,"").trim().replace(/(model$|^model)/,"return $1").replace(/\(\n\s+/g,"(").replace(/\n\s+\)/g,")");
            }
            return result.replace(/\n+\s+(?=[^[\]]*\])/g, ",").replace(/\[,/g, "[").replace(/,\]/g, "]").replace(/'(\w+)':/g, "$1:");
          }
        },
        {
          name: "Basic WikiText info",
          parse: function(data) {
            let s = JSON.parse(eval("(function(){return "+data.replace(/^(\r|\n\|\s)+/g,"").replace(/^(var|let|const)/,"")+"})();")) || {}, x = s.typespec || {};
            wikitext = `{{Ship-Infobox\n
|name=${s.name||""}\n
|image=${(s.name||"").replace(/\s/g,"_")}.png\n
|shieldc=${t(s,"specs","shield","capacity")}\n
|shieldr=${t(s,"specs","shield","reload")}\n
|energyc=${t(s,"specs","generator","capacity")}\n
|energyr=${t(s,"specs","generator","reload")}\n
|turning=${t(s,"specs","ship","rotation")}\n
|acceleration=${t(s,"specs","ship","acceleration")}\n
|speed=${t(s,"specs","ship","speed")}\n
|tier=${u(s,null,"level")}\n
|mass=${u(s,null,"spec","ship","mass")}\n
|designer=${u(x,"Neuronality","designer")}\n
}}\n\n
== Cannons ==\n\n`;
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
            if (dash) wikitext+=`{{Cannon\n
|type=Dash\n
|energy=${t(dash,"energy")}\n
|damage=${t(dash,"energy")}\n
|speed=${t(dash,"burst_speed")}\n
|dual=N/A\n
|recoil=N/A\n
|frequency=1\n
|error=N/A\n
|angle=N/A\n
|spread=N/A\n
}}\n\n`;
            for (let laser of lasers) wikitext+=`{{Cannon\n
|type=${["Stream","Pulse"][(laser.type-1)||0]}\n
|energy=${(function(){let gx = u(laser,"N/A","damage","map");return Array.isArray(gx)?gx.map(lar => ((laser.dual?(lar*2):lar)||0)):"N/A"})()}\n
|damage=${t(laser,"damage")}\n
|speed=${t(laser,"speed")}\n
|dual=${!!u(laser,0,"dual")}\n
|recoil=${u(laser,0,"recoil")}\n
|frequency=${u(laser,1,"rate")}\n
|error=${u(laser,0,"error")}\n
|angle=${Math.abs(u(laser,0,"angle"))}\n
|spread=${Math.abs(u(laser,0,"spread"))}\n
}}\n\n`;
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
      try {results = this.types.list[this.types.choose() - 1].parse(json)}
      catch(e){
        if (forced) {
          json = "Ship Mod Export code"
          results = "Output";
        }
        else {
          this.error();
          return;
        }
      };
      localStorage.setItem("json-input",json);
      $("#output").val(results);
      $("#input").val(json);
    },
    error: function() {
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
