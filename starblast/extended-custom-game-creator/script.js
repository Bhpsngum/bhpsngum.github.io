(function(){
  var EGC = {
    filters: {
      even: function(num){return this.float(num) && num%2 === 0},
      integer: function(num){return this.float(num) && Math.floor(num) === num},
      float: function(num){return typeof num == "number"},
      boolean: function(bool){return typeof bool == "boolean"},
      string: function(str){return typeof stf == "string"},
      text: function(str){return this.string(str)},
      dropdown: function(item, list){return list.map(i=>i.item).indexOf(item) != -1}
    },
    getFunction: function(array) {
      let body = array.pop();
      return Function.apply(window, array.concat("EGC", body))
    }
  }
  $.getJSON("options.json").then(function(data){
    for (let mode of Object.values(data)) {
      for (let option of Object.values(mode)) {
        if (Array.isArray(option.parser)) option.parser = EGC.getFunction(option.parser);
        if (Array.isArray(option.finalizer)) option.finalizer = EGC.getFunction(option.finalizer)
      }
    }
    EGC.options = data;
    console.log(EGC);
  }).catch(function(e){alert("Fetching data failed, please relad the page.")})
})();
