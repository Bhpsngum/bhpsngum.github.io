(function(){
  var SSCV = {
    compile: function(data) {
      return JSON.parse(Function("return " + data.replace(/^(\s|\n|\r|\t)+/,"").replace(/^(var|let|const)(\s|\t)*/,"").replace(/(\n|\r|\s|\t)+(\;|$)/,"$2"))());
    },
    types: {
      list: [
        {
          name: "Ship Editor code",
          parse: function(data) {
            delete data.typespec;
            return "return "+js2coffee.build("model="+JSON.stringify(data)).code.replace(/\s+(?=[^[\]]*\])/g, ",").replace(/\[,/g, "[").replace(/,\]/g, "]").replace(/'(\w+)':/g, "$1:");
          }
        },
        {
          name: "Basic WikiText info",
          parse: function(data) {
            let s = data.typespec, wikitext;
            wikitext = `{{Ship-Infobox
|name=${s.name||""}
|image=${(s.name||"").replace(/\s/g,"_")}.png
|shieldc=${s.specs.shield.capacity.join("/")}
|shieldr=${s.specs.shield.reload.join("/")}
|energyc=${s.specs.generator.capacity.join("/")}
|energyr=${s.specs.generator.reload.join("/")}
|turning=${s.specs.ship.rotation.join("/")}
|acceleration=${s.specs.ship.acceleration.join("/")}
|speed=${s.specs.ship.speed.join("/")}
|tier=${s.level||1}
|mass=${s.specs.ship.mass||0}
|designer=${data.designer||"Neuronality"}
}}\n\n== Cannons ==\n\n`;
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
            if (dash) wikitext+=`{{Cannon
|type=Dash
|energy=${dash.energy.join("/")}
|damage=${dash.energy.join("/")}
|speed=${dash.burst_speed.join("/")}
|dual=N/A
|recoil=N/A
|frequency=1
|error=N/A
|angle=N/A
|spread=N/A
}}\n\n`;
            wikitext+=lasers.map(laser => `{{Cannon
|type=${["Stream","Pulse"][(laser.type-1)||0]}
|energy=${laser.damage.map(lar => ((laser.dual?(lar*2):lar)||0)).join("/")}
|damage=${laser.damage.join("/")}
|speed=${laser.speed.join("/")}
|dual=${!!laser.dual}
|recoil=${laser.recoil||0}
|frequency=${laser.rate||1}
|error=${laser.error||0}
|angle=${Math.abs(laser.angle)||0}
|spread=${Math.abs(laser.spread)||0}
}}`).join("\n\n");
            return wikitext;
          }
        }
      ],
      set: function() {
        $("#types").html("<option disabled>Select conversion type</option>"+this.list.map(i => `<option>${i.name}</option>`));
        this.choose();
      },
      choose: function() {
        let select = $("#types").prop("selectedIndex");
        if (select < 1 || select > this.list.length) {
          let t = localStorage.getItem("selected-conversion-type");
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
      try {results = this.types.list[this.types.choose()].parse(this.compile(json))}
      catch(e){
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
  SSCV.types.set();
  SSCV.convert(!0);
  $("#convert").on("click",SSCV.convert.bind(SSCV));
  $("#copy").on("click",function(){SSCV.copy($("#output").val())});
})();
