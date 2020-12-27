$.getJSON("rd_list.json").then(function(data){
  let d,id=location.search.replace(/^\?id\=/,()=>(d=!0,"")),t=!d||data.map(i=>i.id).indexOf(id)==-1,g=((data.filter(i=>i.id==id)[0]||{}).url||"").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/'/g,"&apos;").replace(/"/g,"&quot;");
  $('head').html(`<title>${t?"Oops!":"Redirecting..."}</title><link rel="icon" href="favicon.ico">`);
  $('body').html('<body style="font-family:Verdana">'+(t?"We could not find the link you were looking for.<br><a href='/'>Back to the main page</a>":`Redirecting, please wait...<br> Click <a href="${g}">here</a> if your browser does not redirect you automatically.`)+'</body>');
  delete window.$;
  delete window.jQuery;
  !t && window.open(g,'_self');
});
