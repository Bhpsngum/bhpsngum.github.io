function getChangelog() {
	$.getJSON("https://starblast.io/simstatus.json",function(data){console.log(data)});
};
setInterval(getChangelog, 2000);
