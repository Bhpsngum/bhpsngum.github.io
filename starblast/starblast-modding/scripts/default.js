(function(){
  let elem = document.querySelector(".type-signature"), type = String((String((elem || {}).innerText).match(/\w+/)||[""])[0]);
  if ("abstract" == type) {
    document.querySelector(".container-overview").remove();
    elem.remove()
  }

  let displayText = {
    "readonly": "read-only"
  }
  for (let i of document.querySelectorAll(".type-signature")) {
      if (i.innerText.match(/^\s*:[^]+/) || i.innerText.match(/^\s*→\s*{[^]+}/)) i.remove();
      else {
        let text = (i.innerText.match(/\w+/) || [""])[0];
        i.setAttribute("class", i.getAttribute("class") + " " + text);
        i.innerText = (displayText[text] || text).toUpperCase()
      }
  }
  document.querySelector(".signature").remove();

  let article = document.querySelector("article"), children = article.children, createSpacing = function () {
    let t = document.createElement("div");
    t.setAttribute("class", "spacing");
    return t
  }

  for (let i = 0; i < children.length - 1; ++i) {
    if (children[i].tagName.toLowerCase() == "dl") {
      children[i].style.marginBottom = "20px";
      if (children[i + 1].tagName.toLowerCase() == "h4" && Array.prototype.includes.call(children[i + 1].classList, "name")) article.insertBefore(createSpacing(), children[++i])
    }
  }
})()
