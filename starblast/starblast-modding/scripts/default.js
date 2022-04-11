(function(){
  let elem = document.querySelector(".type-signature"), type = String((String((elem || {}).innerText).match(/\w+/)||[""])[0]);
  if ("abstract" == type) {
    document.querySelector(".container-overview").remove();
    elem.remove()
  }
  document.querySelector(".signature").remove()
})()
