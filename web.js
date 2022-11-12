(function () {
  let clearData = function () {
    if (confirm("Do you really want to remove all local data associating to this page? This action is irreversible.")) localData.clear(true);
  }
  if (window.location.search.toLowercase() == "?clearalldata") clearData();
  let x = document.querySelector("#cleardata");
  if (x != null) x.addEventListener("click", clearData);
});
