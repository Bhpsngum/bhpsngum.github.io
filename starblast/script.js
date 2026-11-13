(function () {
  const container = document.querySelector("#tools");
  const status = document.querySelector("#welcome-text");
  const toolsUrl = new URL("tools.json", document.baseURI);

  function makeCard(tool) {
    const card = document.createElement("article");
    card.className = "toolBox card";
    const preview = document.createElement("img");
    preview.src = tool.preview || "/icon.png";
    preview.alt = "";
    preview.loading = "lazy";
    const title = document.createElement("h3");
    title.textContent = tool.name || "Starblast tool";
    const description = document.createElement("p");
    description.textContent = tool.description || "Open this community tool.";
    const link = document.createElement("a");
    link.className = "card-link";
    link.href = tool.dir;
    link.textContent = "Open tool →";
    if (/^https?:/i.test(tool.dir)) {
      link.target = "_blank";
      link.rel = "noopener noreferrer";
    }
    card.append(preview, title, description, link);
    card.addEventListener("click", function (event) {
      if (event.target.closest("a")) return;
      if (/^https?:/i.test(tool.dir)) window.open(tool.dir, "_blank", "noopener,noreferrer");
      else window.location.href = tool.dir;
    });
    card.style.cursor = "pointer";
    return card;
  }

  function metaValue(documentText, name) {
    const parsed = new DOMParser().parseFromString(documentText, "text/html");
    const item = parsed.querySelector('meta[property="' + name + '"], meta[name="' + name + '"]');
    return item ? item.content : "";
  }

  fetch(toolsUrl)
    .then(response => {
      if (!response.ok) throw new Error("Could not load tools list");
      return response.json();
    })
    .then(async entries => {
      const results = await Promise.all(entries.map(async entry => {
        if (typeof entry !== "string") return entry;
        const dir = entry.startsWith("http") ? entry : entry.replace(/^\/+/, "");
        const url = entry.startsWith("http") ? entry : new URL(dir + (dir.endsWith("/") ? "" : "/"), document.baseURI).href;
        try {
          const response = await fetch(url);
          if (!response.ok) throw new Error("Metadata unavailable");
          const html = await response.text();
          return {
            dir: entry.startsWith("http") ? entry : "/" + (dir.startsWith("starblast/") ? dir : "starblast/" + dir),
            name: metaValue(html, "og:title") || dir.replace(/\/$/, "").split("/").pop(),
            description: metaValue(html, "description") || "A community tool for Starblast.",
            preview: metaValue(html, "og:image") || "/icon.png"
          };
        } catch (_) {
          return {
            dir: entry.startsWith("http") ? entry : "/" + (dir.startsWith("starblast/") ? dir : "starblast/" + dir),
            name: dir.replace(/\/$/, "").split("/").pop().replace(/[-_]/g, " "),
            description: "Open this Starblast community tool.",
            preview: "/icon.png"
          };
        }
      }));
      container.replaceChildren(...results.map(makeCard));
      if (status) status.remove();
    })
    .catch(() => {
      if (status) {
        status.textContent = "Tools could not be loaded right now. Please try again later.";
        status.style.color = "var(--danger)";
      }
    });
})();
