(function(){
  function showError() {
    alert("Cannot convert the requested code!");
  }
  function convert(forced) {
    let json = $("#jsonInput").val() || localStorage.getItem("json-input"), results;
    try {
      eval("results=JSON.parse(function(){return "+json.replace(/^(\s|\n|\r)+/,"").replace(/^(var|let|const)/,"").replace(/^\n+/,"")+"}());");
      delete results.typespec;
      results = "return "+js2coffee.build("var model="+JSON.stringify(results)).code.replace(/\s+(?=[^[\]]*\])/g, ",").replace(/\[,/g, "[").replace(/,\]/g, "]").replace(/'(\w+)':/g, "$1:");
    }
    catch(e){
      if (forced) {
        json = "(JSON) Ship Mod Export code"
        results = "(CoffeeScript) Ship Editor code";
      }
      else {
        showError();
        return;
      }
    };
    localStorage.setItem("json-input",json);
    $("#coffeescriptOutput").val(results);
    $("#jsonInput").val(json);
  }
  function copy(text) {
    var dummy = document.createElement("textarea");
    document.body.appendChild(dummy);
    dummy.value = text;
    dummy.select();
    document.execCommand("copy");
    document.body.removeChild(dummy);
  }
  convert(!0);
  $("#convert").on("click",function(){convert()});
  $("#copy").on("click",function(){copy($("#coffeescriptOutput").val())});
})();
