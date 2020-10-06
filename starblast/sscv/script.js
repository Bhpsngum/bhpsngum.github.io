(function(){
  function showError() {
    alert("Cannot convert the requested code!");
  }
  function convert() {
    try {
      let json = $("#1");
      // hmm
    }
    catch(e){showError()};
  }
  $("#convert").on("click",convert);
})();
