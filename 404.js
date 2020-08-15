(function(){
  function random(num)
  {
    return ~~(Math.random()*num);
  }
  let name = ["Megumin"],img_types = ["png","jpg"],
  styles = [
    [null],
    [null]
  ];
  document.addEventListener('DOMContentLoaded', function(){
    let i = random(name.length), ind = random(styles[i].length), body = document.querySelector("#body");
    body.setAttribute("style", "color:"+(styles[i][ind]||"rgb(102,102,102)"));
    document.querySelector("#message").innerHTML= `Here is a picture of ${name[i]} instead.`;
    let img_link = `https://bhpsngum.github.io/404_img/${name[i].replace(/\s/g,"_")}/${ind}.`;
    function testImage(i)
    {
      if (i<0) return;
      let img = new Image(),lnk = img_link+img_types[i];
      img.src = lnk;
      img.onload = function(){
        body.setAttribute("style",`${body.getAttribute("style")};background-image:url(${lnk});background-repeat: no-repeat;background-size: cover;background-position: center;height: 100vh;width: 100vw;`);
        document.querySelector("#link").href = lnk;
      }
      img.onerror = function(){testImage(i-1)}
    }
    testImage(img_types.length-1);
  });
})();
