$(function () {
	$.ajax({
     url:"https://starblast.io/changelog.txt",
     success: function(data){alert(data)},
     crossDomain:true,
     dataType: 'text',
     error: function(e){alert(e)}
});
}());
