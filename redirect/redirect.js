$.getJSON("rd_list.json").then(function(data){
  let d,id=location.search.replace(/^\?id\=/,()=>(d=!0,""));
  $('html').html('<head><title>Redirecting...</title></head><body style="font-family:Verdana">'+((!d && data.map(i=>i.id).indexOf(id)==-1)?"We couldn't find the link you were looking for.<br><a href='/'>Back to the main page</a>":`Redirecting, please wait...<br> Click <a href="${data.filter(i=>i.id==id)[0].url}">here</a> if your browser does not redirect you automatically.`)+'</body>');
});
