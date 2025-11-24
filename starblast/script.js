(function(){
  let ToolBox = function(prop) {
    let onclick = `onclick="window.open('${prop.dir}')"`;
    return `<div id="${prop.dir.replace(/[^0-9A-Z]/gi,"_")}" class="toolBox">
      <img src="${prop.preview}" onerror="setTimeout(function(){this.src = this.src}.bind(this),5000)" ${onclick}>
      <img class="toolIcon" src="${prop.icon}" onerror="setTimeout(function(){this.src = this.src}.bind(this),5000)" ${onclick}>
      <h3 ${onclick}>${prop.name}</h3>
      <p ${onclick}>${prop.description}</p>
      <a href="${prop.dir}">${location.host}/${prop.dir.match(/^\.*\//)?"":"starblast/"}${prop.dir.replace(/^\.*\//, "")}</a>
    </div>`
  }
  let insertToolBox = function (dir) {
    $("#tools").append(ToolBox(dir));
    adjustwidth()
  }
  $.getJSON("tools.json").then(function(json) {
    $("#tools").html("");
    for (let link of json) {
      if ("string" == typeof link) {
        $.get(link).then(e=>{
          let t = [];
          e.replace(/<meta\s+([^>]+?)(\s|\/)*>/g,(a,b)=>{
            let obj = {}
            b = b.replace(/(\w+)\s*=\s*("|')(.+?)\2/g,(a,b,c,d)=>obj[b]=d);
            t.push(obj)
          });
          insertToolBox({
            dir: link,
            name: t.find(meta => "og:title" == meta.name).content,
            description: t.find(meta => "description" == meta.name).content,
            icon: link + "/favicon.ico",
            preview: t.find(meta => "og:image" == meta.name).content
          });
          setTimeout(adjustwidth, 1)
        });
      }
      else insertToolBox(link)
    }
  }).catch(function(){
    $("#welcome-text").css("color","red");
    $("#welcome-text").html("Failed to load tools data")
  });
  let img_size = 360, padding_ratio = 1/30, full_ratio = 1+4*padding_ratio, adjustwidth = function(){
    let g = $(window).width(), x = Math.round(g/(img_size*full_ratio)), t = g/(x||1)/full_ratio, m = Math.trunc(t*padding_ratio);
    $(".toolBox").css({width: Math.trunc(t)+"px",padding: m+"px", margin: m+"px"});
    $(".toolIcon").css({right: m+"px", top: m+"px"})
  }
  window.addEventListener("resize", adjustwidth)
})();
