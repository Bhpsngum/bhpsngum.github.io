(function () {
  let clearData = function () {
    if (confirm("Do you really want to remove all local data associating to this domain? This action is irreversible.")) {
      localStorage.clear();
      window.open("./", "_self");
    }
  }
  if (window.location.search.toLowerCase() == "?clearalldata") clearData();
  let x = document.querySelector("#cleardata");
  if (x != null) x.addEventListener("click", clearData);
})();
