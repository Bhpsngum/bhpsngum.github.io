(function(){
  var SSCV = {
    compile: function(data) {
      let results;
      eval("results=JSON.parse(function(){return "+data.replace(/^(\s|\n|\r)+/,"").replace(/^(var|let|const)/,"").replace(/^\n+/,"")+"}());");
      return results;
    },
    convert: function (type, forced) {
      try {
        let json = $("#input").val() || localStorage.getItem("json-input"), results = this.compile(json);
        switch(type) {
          case "shipcode":
            delete results.typespec;
            results = "return "+js2coffee.build("model="+JSON.stringify(results)).code.replace(/\s+(?=[^[\]]*\])/g, ",").replace(/\[,/g, "[").replace(/,\]/g, "]").replace(/'(\w+)':/g, "$1:");
            break;
          case "wikitext":
            let s = results.typespec, wikitext;
            wikitext = `{{Ship-Infobox\n
|name=${s.name||""}\n
|image=${(s.name||"").replace(/\s/g,"_")}.png\n
|shieldc=${s.specs.shield.capacity.join("/")}\n
|shieldr=${s.specs.shield.reload.join("/")}\n
|energyc=${s.specs.generator.capacity.join("/")}\n
|energyr=${s.specs.generator.reload.join("/")}\n
|turning=${s.specs.ship.rotation.join("/")}\n
|acceleration=${s.specs.ship.acceleration.join("/")}\n
|speed=${s.specs.ship.speed.join("/")}\n
|tier=${s.level||1}\n
|mass=${s.specs.ship.mass||0}\n
|designer=${results.designer||"Neuronality"}\n
}}\n\n
== Cannons ==\n\n`;
            let lasers = s.lasers.map(laser => {
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
            }
            let dash = s.specs.ship.dash;
            if (dash) wikitext+=`{{Cannon\n
|type=Dash\n
|energy=${dash.energy.join("/")}\n
|damage=${dash.energy.join("/")}\n
|speed=${dash.burst_speed.join("/")}\n
|dual=N/A\n
|recoil=N/A\n
|frequency=N/A\n
|error=N/A\n
|angle=N/A\n
|spread=N/A\n
}}\n\n`;
            wikitext+=lasers.map(laser => `{{Cannon\n
|type=${["Stream","Pulse"][(laser.type-1)||0]}\n
|energy=${laser.damage.map(lar => ((laser.dual?(lar*2):lar)||0)).join("/")}\n
|damage=${laser.damage.join("/")}\n
|speed=${laser.speed.join("/")}\n
|dual=${!!laser.dual}\n
|recoil=${laser.recoil||0}\n
|frequency=${laser.rate||1}\n
|error=${laser.error||0}\n
|angle=${((laser.angle<0)?(360-laser.angle):laser.angle)||0}\n
|spread=${laser.spread||0}\n
}}`).join("\n\n");
            results = wikitext;
            break;
          default:
            results = "Output";
        }
      }
      catch(e){
        console.log(e);
        if (forced) {
          json = "(JSON) Ship Mod Export code"
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
  SSCV.convert(null, !0);
  $("#shipcode").on("click",function(){SSCV.convert("shipcode")});
  $("#wikitext").on("click",function(){SSCV.convert("wikitext")});
  $("#copy").on("click",function(){SSCV.copy($("#output").val())});
})();
