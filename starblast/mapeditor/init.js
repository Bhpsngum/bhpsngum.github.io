window.viewinfo = function (title,text) {
  $("#info").html(`<strong>${title?title+": ":""}</strong>${text||""}`);
}
$.ajax("/starblast/mapeditor/changelog.txt").then(function(data){
  data.replace(/\d+\.\d+\.\d+/, function(version) {
    $("#latest").html("View latest version (" + version + ")");
  });
}).fail(e => {});
