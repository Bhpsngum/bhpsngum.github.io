function getChangelog() {
	$.get("https://starblast.io/changelog.txt",function(data){console.log(data)});
};
