window.addToolPage = function(l,r,t,b,w,h,tag,parent,custom_css) {
  tag = tag || "button";
  let button = $("<" + tag + ">Other tools</" + tag + ">");
  let css = Object.assign({}, {
    position: "fixed", cursor: "pointer", left: l, right: r,
    top: t, bottom: b, width: w, height: h
  }, custom_css);
  for (let i in css) if (css[i] == null) delete css[i];
  const script = document.querySelector('script[src*="toolPage.js"]');
  const starblastRoot = script ? new URL(".", script.src) : new URL("../starblast/", document.baseURI);
  button.on("click", function() {
    window.open(starblastRoot.href, "_blank", "noopener,noreferrer");
  });
  button.css(css);
  $(parent || document.body).append(button);
};
