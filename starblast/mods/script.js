function processData(json)
{
  console.log(json);
}
$.getJSON("modsinfo.json").done(processData).fail(() => {console.log("Fetch failed")});
