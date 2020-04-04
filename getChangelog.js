var xhr = new XMLHttpRequest();
xhr.open('GET', 'https://starblast.io/changelog.txt', true);
xhr.onreadystatechange = function() {
	if (xhr.readyState === 4)  {
		console.log(xhr.responseText);
	}
};
xhr.send(null);
