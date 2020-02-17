function run()
{
  let a=console.log;
  console.log =  function(val)
  {
    let str;
    switch(typeof val)
    {
      case "string":
        str='"'+val+'"';
        break;
      case "object":
        str="Object: "+JSON.stringify(val);
        break;
      case "undefined":
        str="undefined";
        break;
      default:
        str=(val||"").toString();
    }
    document.getElementById("tester-output").value+="> "+str+"\n";
  }
  let output=document.getElementById("tester-output");
  output.removeAttribute("style");
  output.value="";
  try
  {
    eval(document.getElementById("tester").value);
  }
  catch(e)
  {
    output.setAttribute("style","color:red");
    output.value=e.name+": "+e.message;
  }
  console.log=a;
}
document.getElementById("run").addEventListener("click",run);
