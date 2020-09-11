(function(){
  $.ajax("changelog.txt").then(function(data){
    console.log(data.split("\n\n"));
  }).fail(function(){alert("Fetch data failed\nPlease try again")});
  let states=["dark","light"];
  if (!window.matchMedia) document.querySelector("link").href=`icon_light.png`;
  else for (let state of states) if (window.matchMedia(`(prefers-color-scheme: ${state})`).matches) document.querySelector("link").href=`icon_${state}.png`;
})();
