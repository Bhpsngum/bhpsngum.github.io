(function(){
  $.ajax("changelog.txt").then(function(data){
    $("#changelog").html(data.split("\n\n").map(function(i){
      let l = i.split("\n")
      return l[0].replace(/(^[0-9\.]+)\/(.+)/,"<h2>$1</h2><h4>$2</h4>")+"<ul>"+l.slice(1,l.length).map(u => u.replace(/^\*\s(.+)/,"<li>$1</li>").replace(/\"([^"]+)\"/g,"<a href='$1' target='_blank'>$1</a>")).join("").replace(/\\n/g,"<br>")+"</ul>";
    }).join("<br>"));
  }).fail(function(){alert("Fetch data failed\nPlease try again")});
  let states=["dark","light"];
  if (!window.matchMedia) document.querySelector("link").href=`icon_light.png`;
  else for (let state of states) if (window.matchMedia(`(prefers-color-scheme: ${state})`).matches) document.querySelector("link").href=`icon_${state}.png`;
})();
