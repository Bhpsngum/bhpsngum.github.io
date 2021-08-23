window.addToolPage = function(l,r,t,b,w,h,tag,parent) {
  tag = tag || "button";
  let button = $("<" + tag + ">Other tools</" + tag +">");
  let css = {
    position: "fixed",
    cursor: "pointer",
    left: l,
    right: r,
    top: t,
    bottom: b,
    width: w,
    height: h
  }
  for (let i in css) if (css[i] == null) delete css[i];
  button.on("click",function(){
    window.open("/starblast", "_blank")
  });
  button.css(css);
  $(parent||document.body).append(button)
}
