(() => {
  "use strict";

  const input = document.querySelector("#input");
  const output = document.querySelector("#output");
  const submit = document.querySelector("#submit");
  const copy = document.querySelector("#copy");
  const errorInfo = document.querySelector("#error-info");
  const error = document.querySelector("#error");
  const warning = document.querySelector("#warning");
  const forceMutable = document.querySelector("#strictWarning");
  const strict = document.querySelector("#strict");
  const automatic = document.querySelector("#auto");
  const forceMutableLink = document.querySelector("#esi");

  if (!input || !output || typeof "".getProperJSVariableName !== "function") {
    if (error) error.textContent = "The converter library could not be loaded. Please refresh the page.";
    return;
  }

  input.value = localStorage.getItem("value") || "";
  for (const control of [automatic, strict, forceMutable]) {
    control.checked = localStorage.getItem(control.id) === "true";
  }

  function resetResult() {
    output.value = "";
    input.style.backgroundColor = "";
    output.style.backgroundColor = "";
    errorInfo.textContent = "";
    error.textContent = "";
    warning.hidden = true;
  }

  function getSyntaxError(source, declaration) {
    try {
      // Compile only: the supplied text is parsed but never executed.
      new Function((strict.checked ? '"use strict";' : "") + declaration + source);
      return "";
    } catch (exception) {
      return exception && exception.message ? exception.message : "Invalid identifier";
    }
  }

  function process() {
    const value = input.value;
    if (!value) {
      resetResult();
      return;
    }

    const mode = strict.checked ? "strict" : "";
    let result;
    try {
      result = value.getProperJSVariableName(mode, null, true);
    } catch (exception) {
      resetResult();
      error.textContent = exception && exception.message ? exception.message : "Could not convert this value.";
      return;
    }

    if (value === result.name) {
      errorInfo.textContent = "Your input is a valid JavaScript variable name.";
      error.textContent = "";
      if (!result.mutable && !forceMutable.checked) {
        input.style.backgroundColor = "rgba(255, 211, 124, .18)";
        output.style.backgroundColor = "rgba(255, 211, 124, .18)";
        warning.hidden = false;
      } else {
        result = value.getProperJSVariableName(mode, true, true);
        input.style.backgroundColor = "rgba(112, 225, 220, .14)";
        output.style.backgroundColor = "rgba(112, 225, 220, .14)";
        warning.hidden = true;
      }
    } else {
      input.style.backgroundColor = "rgba(255, 133, 141, .14)";
      output.style.backgroundColor = "rgba(112, 225, 220, .14)";
      errorInfo.textContent = "Your input is not a valid JavaScript variable name.";
      warning.hidden = true;

      let reason = "";
      if (/[=;,]/.test(value)) reason = "A variable name cannot contain =, ; or ,.";
      else if (/[\r\n]/.test(value)) reason = "A variable name cannot contain a line break.";
      else if (/\s/.test(value)) reason = "A variable name cannot contain whitespace.";
      else reason = getSyntaxError(value, "let ");
      error.textContent = reason || "The name is not a valid identifier.";
    }

    output.value = result && result.name ? result.name : "";
  }

  function saveOption(control) {
    localStorage.setItem(control.id, String(control.checked));
    if (automatic.checked) process();
  }

  input.addEventListener("input", () => {
    localStorage.setItem("value", input.value);
    if (automatic.checked) process();
    else resetResult();
  });

  for (const control of [automatic, strict, forceMutable]) {
    control.addEventListener("change", () => saveOption(control));
  }

  forceMutableLink.addEventListener("click", event => {
    event.preventDefault();
    forceMutable.checked = true;
    saveOption(forceMutable);
  });

  submit.addEventListener("click", process);

  copy.addEventListener("click", async () => {
    if (!output.value) return;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(output.value);
      } else {
        output.focus();
        output.select();
        if (!document.execCommand("copy")) throw new Error("Copy command unavailable");
      }
      copy.textContent = "Copied!";
    } catch (_) {
      copy.textContent = "Copy failed";
    }
    window.setTimeout(() => { copy.textContent = "Copy result"; }, 1400);
  });

  if (automatic.checked && input.value) process();
})();
