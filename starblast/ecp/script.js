$.getJSON("ecp.json").then(function (res) {
  console.log(res);
}).catch(function (e) {alert("File failed to fetch!")});
