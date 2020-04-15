function copyToClipboard(text) {
  var dummy = document.createElement("textarea");
  document.body.appendChild(dummy);
  dummy.value = text;
  dummy.select();
  document.execCommand('copy');
  document.body.removeChild(dummy);
}
let f="";
setInterval(function() {
  let raw=$("#input").val();
  if (raw!=f)
  {
    f=raw;
    $("#input").css("background-color","inherit");
    $("#output").css("background-color","inherit");
    $("#output").val("");
    $("#error").css("display","none");
    $("#error-info").css("display","none");
  }
},10);
$("#submit").on("click", function(){
  let inp=$("#input"),data=inp.val();
  if (data)
  {
    let s="",d="";
    if ($('#strict').is(":checked")) 
    {
      s="strict";
      d="'use strict';";
    }
    let checked=data.getProperJSVariableName(s);
    
    if (data==checked)
    {
      inp.css("background-color","green");
      $("#error-info").html("Your input name is a valid JavaScript variable name according to the latest version");
      $("#error").css("display","none");
      $("#error-info").css("display","none");
    }
    else
    {
      inp.css("background-color","red");
      $("#error").css("display","inline-block");
      $("#error-info").html("Your input name is an invalid JavaScript variable name according to the latest version because of the following error:");
      let u=0,erinf;
      for (let i of data)
      {
        if (!u)
          switch(i)
          {
            case "=":
            case ";":
            case ",":
              erinf="Expected "+i+" in the variable name";
              break;
            case "\r":
            case "\n":
              erinf="Expected newline character in the variable name";
              break;
            case " ":
              erinf="Expected space character in the variable name";
              break;
          }
      }
      if (!erinf)
        try
        {
          eval(d+"var "+data);
          eval(d+"let "+data);
        }
        catch(e)
        {
          erinf=e.message;
        }
      $("#error").val(erinf);
    }
    $("#error-info").css("display","inline-block");
    $("#output").css("background-color","green");
    $("#output").val(checked);
  }
});
$("#copy").on("click", function() {
  let cp=$("#output").val();
  if (cp)
  {
    copyToClipboard(cp);
    $("#copy").html("Copied!");
  setTimeout(function(){$("#copy").html("Copy")},500);
  }
});
