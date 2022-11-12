// manage localData by each pathnames

window.localData = {
  path: function() {
    let path = window.location.pathname.split("/").filter(i => i);
    if (!window.location.pathname.endsWith("/")) path.pop();
    path = path.join("_");
    return path || "global";
  }(),
  setItem: function (name, value) {
    return localStorage.setItem(this.path + "_" + String(name).replace(/[^a-z0-9]/gi, "_"), value)
  },
  getItem: function (name) {
    return localStorage.getItem(this.path + "_" + String(name).replace(/[^a-z0-9]/gi, "_"))
  },
  removeItem: function (name) {
    return localStorage.removeItem(this.path + "_" + String(name).replace(/[^a-z0-9]/gi, "_"))
  },
  clear: function (globalClear) {
    if (globalClear) localStorage.clear();
    else {
      let path = this.path + "_";
      for (let i in localStorage) {
        if (i.startsWith(path)) localStorage.removeItem(i)
      }
    }
    window.location.reload();
  }
}
