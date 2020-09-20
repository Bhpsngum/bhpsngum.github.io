(function(){
  var links = [
    ["feedback",'https://docs.google.com/forms/d/e/1FAIpQLSe-NQ8QTj0bnX65LMT8NbO9ppEYRtgQ1Fa3AwJX-GfTFHUQSw/viewform?usp=sf_link','_blank'],
    ["tutorial",'https://github.com/Bhpsngum/starblast/blob/master/MapEditorTutorial.md','_blank'],
    ["changelog",'/starblast/mapeditor/changelog.html','_blank']
  ]
  for (let link of links) $("#"+link[0]).on("click",function(){
    window.open(link[1],link[2]);
  });
  let states=["dark","light"];
  if (!window.matchMedia) document.querySelector("link").href="/starblast/mapeditor/icon_light.png";
  else for (let state of states) if (window.matchMedia(`(prefers-color-scheme: ${state})`).matches) document.querySelector("link").href=`/starblast/mapeditor/icon_${state}.png`;
  console.log('%c Stop!!', 'font-weight: bold; font-size: 100px;color: red; text-shadow: 3px 3px 0 rgb(217,31,38)');
  console.log('%cYou are accessing the Web Developing Area.\n\nPlease do not write/copy/paste/run any scripts here (unless you know what you\'re doing) to better protect yourself from loosing your map data, and even your other sensitive data.\n\nWe will not be responsible for any problems if you do not follow the warnings.', 'font-weight: bold; font-size: 15px;color: grey;');
  console.log('%cMap Editor, made by Bhpsngum,\n\nfeel free to distribute the code and make sure to credit my name if you intend to do that\n\nGitHub: https://github.com/Bhpsngum', 'font-weight: bold; font-size: 15px;color: Black;');
  $.ajax("/starblast/mapeditor/changelog.txt").then(function(data){
    data.replace(/\d+\.\d+\.\d+/, function(version) {
      if (localStorage.getItem("lastVer") != version)
      {
        let info = data.split("\n\n")[0].split("\n");
        alert("What's new ("+version+")\n"+info.slice(1,info.length).join("\n"));
        localStorage.setItem("lastVer",version);
      }
    });
  }).fail(e => {});
})();
