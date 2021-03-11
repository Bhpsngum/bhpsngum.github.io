window.imports = [...[...document.querySelectorAll("link")].map(i=>i.href),...[...document.querySelectorAll("script")].map(i=>i.src)].filter(i => i);
