function processData(json)
{
  console.log(json);
}
$.getJSON("modsinfo.json").done((json) => {processData(json.data)}).fail(() => {console.log("Fetch failed")});
