window.viewinfo = function (title,text) {
  $("#info").html(`<strong>${title?title+": ":""}</strong>${text||""}`);
}
