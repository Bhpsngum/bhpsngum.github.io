(() => {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => { });
  }

  const $input = document.getElementById("input");
  const $output = document.getElementById("output");
  const $types = document.getElementById("types");
  const $convert = document.getElementById("convert");
  const $copy = document.getElementById("copy");
  const $clear = document.getElementById("clear");
  const $auto = document.getElementById("auto");
  const $status = document.getElementById("status");

  const inputCM = CodeMirror.fromTextArea($input, {
    lineNumbers: true,
    theme: "material-darker",
    mode: { name: "javascript", json: true },
    lineWrapping: false,
    tabSize: 2,
    indentUnit: 2,
  });

  const outputCM = CodeMirror.fromTextArea($output, {
    lineNumbers: true,
    theme: "material-darker",
    mode: "text/plain",
    readOnly: true,
    lineWrapping: true,
  });

  const store = (window.localData && typeof window.localData.getItem === "function")
    ? window.localData
    : {
      getItem: (k) => localStorage.getItem(k),
      setItem: (k, v) => localStorage.setItem(k, v),
      removeItem: (k) => localStorage.removeItem(k),
    };

  const KEY_INPUT = "json-input";
  const KEY_TYPE = "selected-conversion-type";
  const KEY_AUTO = "auto-convert";

  const setStatus = (msg = "") => { if ($status) $status.textContent = msg; };

  const safeParseInput = (raw) => {
    let text = String(raw ?? "").trim();
    if (!text) throw new Error("Empty input");

    const decl = text.match(/^\s*(?:let|const|var)\s+[\w$]+\s*=\s*([\s\S]*?)\s*;?\s*$/);
    if (decl) text = decl[1].trim();

    try { return JSON.parse(text); } catch (_) { }

    if (window.JSON5 && typeof window.JSON5.parse === "function") {
      try {
        const v = window.JSON5.parse(text);

        if (typeof v === "string") {
          const inner = v.trim();
          try { return JSON.parse(inner); } catch (_) { }
          return window.JSON5.parse(inner);
        }

        return v;
      } catch (_) { }
    }

    const banned = /\b(document|window|location|fetch|XMLHttpRequest|importScripts|navigator|postMessage|self|Function|eval)\b/;
    if (banned.test(text)) throw new Error("Blocked tokens found");

    const m = text.match(/\breturn\s+([\s\S]*?);?\s*$/);
    const expr = (m && m[1]) ? m[1] : text;

    return new Function(`"use strict"; return (${expr});`)();
  };

  const toShipEditorCode = (obj) => {
    const ship = (obj && typeof obj === "object") ? obj : {};
    const cleaned = { ...ship };
    delete cleaned.typespec;

    if (window.js2coffee && typeof window.js2coffee.build === "function") {
      const payload = (window.JSON5 ? JSON5.stringify(cleaned) : JSON.stringify(cleaned));
      return "return " + js2coffee.build("model=" + payload).code;
    }

    return (window.JSON5 ? JSON5.stringify(cleaned, null, 2) : JSON.stringify(cleaned, null, 2));
  };

  const uniqLasers = (lasers) => {
    const norm = (Array.isArray(lasers) ? lasers : []).map(l => ({
      ...l,
      x: Math.abs(Number(l.x) || 0),
      y: Math.abs(Number(l.y) || 0),
      z: Math.abs(Number(l.z) || 0),
    }));

    const seen = new Map();
    const out = [];

    for (const laser of norm) {
      const key = `${laser.x}|${laser.y}|${laser.z}|${laser.type ?? ""}`;
      if (!seen.has(key)) {
        seen.set(key, out.length);
        out.push({ ...laser, dual: false });
      } else {
        const idx = seen.get(key);
        out[idx].dual = true;
      }
    }
    return out;
  };

  const get = (o, path, fallback = "N/A") => {
    try {
      let cur = o;
      for (const p of path) cur = cur?.[p];
      if (cur === undefined || cur === null) return fallback;
      if (Array.isArray(cur)) return cur.length ? cur.join("/") : fallback;
      return cur;
    } catch (_) {
      return fallback;
    }
  };

  const toWikiText = (obj) => {
    const x = (obj && typeof obj === "object") ? obj : {};
    const s = x.typespec || x;

    const name = String(s.name || "");
    const image = name.replace(/\s+/g, "_") + ".png";

    let w = `{{Ship-Infobox
|name=${name}
|image=${image}
|shieldc=${get(s, ["specs", "shield", "capacity"])}
|shieldr=${get(s, ["specs", "shield", "reload"])}
|energyc=${get(s, ["specs", "generator", "capacity"])}
|energyr=${get(s, ["specs", "generator", "reload"])}
|turning=${get(s, ["specs", "ship", "rotation"])}
|acceleration=${get(s, ["specs", "ship", "acceleration"])}
|speed=${get(s, ["specs", "ship", "speed"])}
|tier=${get(s, ["level"], "")}
|mass=${get(s, ["specs", "ship", "mass"])}
|designer=${get(x, ["designer"], "Neuronality")}
}}

== Cannons ==
`;

    const dash = get(s, ["specs", "ship", "dash"], null);
    const lasers = uniqLasers(s.lasers);

    if (dash) {
      w += `{{Cannon
|type=Dash
|energy=${get(dash, ["energy"])}
|damage=${get(dash, ["energy"])}
|speed=${get(dash, ["burstSpeed"])}
|dual=N/A
|recoil=N/A
|frequency=1
|error=N/A
|angle=N/A
|spread=N/A
}}
`;
    }

    for (const laser of lasers) {
      const typeName = (Number(laser.type) === 10) ? "Pulse" : "Stream";
      const energy = laser.energy;

      const dmg = laser.damage;
      const dual = !!laser.dual;

      w += `{{Cannon
|type=${typeName}
|energy=${Array.isArray(energy) ? energy.map(v => dual ? (Number(v) || 0) * 2 : (Number(v) || 0)).join("/") : (energy ?? "N/A")}
|damage=${dmg ?? "N/A"}
|speed=${laser.speed ?? "N/A"}
|dual=${dual}
|recoil=${laser.recoil ?? 0}
|frequency=${laser.rate ?? 1}
|error=${laser.error ?? 0}
|angle=${Math.abs(laser.angle ?? 0)}
|spread=${Math.abs(laser.spread ?? 0)}
}}
`;
    }

    if (!dash && lasers.length === 0) w += "This ship has no cannons or dashes";
    return w;
  };

  const types = [
    { name: "Ship Editor code", parse: (raw) => toShipEditorCode(safeParseInput(raw)) },
    { name: "Basic WikiText info", parse: (raw) => toWikiText(safeParseInput(raw)) },
  ];

  const renderTypes = () => {
    $types.innerHTML = "";
    const ph = document.createElement("option");
    ph.textContent = "Select conversion type";
    ph.disabled = true;
    ph.selected = true;
    $types.appendChild(ph);

    for (const t of types) {
      const opt = document.createElement("option");
      opt.textContent = t.name;
      $types.appendChild(opt);
    }

    const saved = Number(store.getItem(KEY_TYPE));
    const idx = (saved >= 1 && saved <= types.length) ? saved : 1;
    $types.selectedIndex = idx;
  };

  const selectedType = () => {
    const i = $types.selectedIndex;
    const idx = Math.min(Math.max(i, 1), types.length);
    store.setItem(KEY_TYPE, String(idx));
    return types[idx - 1];
  };

  const convert = (forced = false) => {
    try {
      const raw = (inputCM.getValue() || store.getItem(KEY_INPUT) || "");
      if (!raw.trim()) {
        if (forced) {
          $output.value = "";
          setStatus("");
        } else {
          setStatus("No input.");
        }
        store.setItem(KEY_INPUT, raw);
        return;
      }

      const out = selectedType().parse(raw);
      outputCM.setValue(String(out ?? ""));
      setStatus("OK");
      store.setItem(KEY_INPUT, raw);
    } catch (e) {
      if (forced) {
        $output.value = "";
        setStatus("");
        return;
      }
      setStatus(e?.message ? `Error: ${e.message}` : "Error");
      console.error(e);
    }
  };

  const copyOutput = async () => {
    const text = outputCM.getValue() || "";
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      setStatus("Copied.");
    } catch (_) {
      const dummy = document.createElement("textarea");
      document.body.appendChild(dummy);
      dummy.value = text;
      dummy.select();
      document.execCommand("copy");
      document.body.removeChild(dummy);
      setStatus("Copied.");
    }
  };

  const clearAll = () => {
    inputCM.setValue("");
    outputCM.setValue("");
    setStatus("");
    store.setItem(KEY_INPUT, "");
  };

  const debounce = (fn, ms) => {
    let t = 0;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), ms);
    };
  };

  renderTypes();

  $auto.checked = store.getItem(KEY_AUTO) === "1";
  inputCM.setValue(store.getItem(KEY_INPUT) || "");

  const onEdit = debounce(() => {
    store.setItem(KEY_INPUT, inputCM.getValue() || "");
    if ($auto.checked) convert(false);
  }, 200);

  inputCM.on("change", onEdit);

  $types.addEventListener("change", () => {
    store.setItem(KEY_TYPE, String(Math.max(1, $types.selectedIndex)));
    if ($auto.checked) convert(false);
  });

  $convert.addEventListener("click", () => convert(false));
  $copy.addEventListener("click", copyOutput);
  $clear.addEventListener("click", clearAll);

  $auto.addEventListener("change", () => {
    store.setItem(KEY_AUTO, $auto.checked ? "1" : "0");
    if ($auto.checked) convert(false);
  });

  convert(true);
})();
