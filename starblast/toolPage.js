window.addToolPage = function(l,r,t,b,w,h) {
  let button = $("<button>Other tools</button>");
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
  $(document.body).append(button)
}
