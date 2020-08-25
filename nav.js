var u = window.location.pathname,t;
if (t = u != u.toLowerCase(),t)
{
  document.querySelector('title').innerHTML = "A sec...";
  window.location.pathname = u.toLowerCase();
}
