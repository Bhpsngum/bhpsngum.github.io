function copyToClipboard(text) {
  var dummy = document.createElement("textarea");
  document.body.appendChild(dummy);
  dummy.value = text;
  dummy.select();
  document.execCommand('copy');
  document.body.removeChild(dummy);
}
function process()
{
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
      $("#error-info").html("Your input name is a valid JavaScript variable name according to the latest version");
      switch(data)
      {
        case "NaN":
        case "undefined":
        case "Infinity":
        case "window":
          inp.css("background-color","yellow");
          $("#output").css("background-color","yellow");
          $("#warning").css("display","inline-block");
          break;
        default:
          inp.css("background-color","green");
          $("#output").css("background-color","green");
          $("#warning").css("display","none");
      }
      $("#error").css("display","none");
    }
    else
    {
      inp.css("background-color","red");
      $("#output").css("background-color","green");
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
      $("#error").html(erinf);
    }
    $("#output").val(checked);
  }
}
let f="";
setInterval(function() {
  let raw=$("#input").val();
  if (raw!=f)
  {
    f=raw;
    if ($("#auto").is(":checked") && raw) process();
    else
    {
      $("#input").css("background-color","inherit");
      $("#output").css("background-color","inherit");
      $("#output").val("");
      $("#error").css("display","none");
      $("#error-info").html("");
      $("#warning").css("display","none");
    }
  }
},10);
$("#strict").on("change",function(){
  if ($("#auto").is(":checked")) process();
});
$("#auto").on("change",function(){
  if ($("#auto").is(":checked")) process();
});
$("#submit").on("click",process);
$("#copy").on("click", function() {
  let cp=$("#output").val();
  if (cp)
  {
    copyToClipboard(cp);
    $("#copy").html("Copied!");
  setTimeout(function(){$("#copy").html("Copy")},500);
  }
});
