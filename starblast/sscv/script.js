(function(){
  function showError() {
    alert("Cannot convert the requested code!");
  }
  function convert(forced) {
    let json = $("#jsonInput").val() || localStorage.getItem("coffee-input"), results;
    try {
      eval("results=function(){return "+json.replace(/^(\s|\n|\r)+/,"").replace(/^(var|let|const)/,"").replace(/^\n+/,"")+"}();");
      results = "return "+js2coffee.build("var model="+results).code.replace(/\n(\s+)'([^']+)':/g,"\n$1$2:").replace(/\[[^\]]+\]/g,function(v) {
        return v.replace(/\n/g,"").replace(/\s+/g,",").replace(/,\]/g,"]").replace(/\[,/g,"[");
      });
    }
    catch(e){
      if (forced) {
        json = "(JSON) Modexport code"
        results = "(CoffeeScript) Ship Editor code";
      }
      else {
        showError();
        return;
      }
    };
    localStorage.setItem("coffee-input",json);
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
