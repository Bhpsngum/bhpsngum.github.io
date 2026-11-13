(function () {
  const container = document.querySelector("#tools");
  const status = document.querySelector("#welcome-text");
  if (!container) return;

  const toolsUrl = new URL("tools.json", document.baseURI);
  const fallbackImage = new URL("../icon.png", document.baseURI).href;

  function safeToolUrl(value) {
    if (typeof value !== "string" || !value.trim()) return null;
    try {
      const url = new URL(value, document.baseURI);
      if (url.protocol !== "http:" && url.protocol !== "https:") return null;
      return url;
    } catch (_) {
      return null;
    }
  }

  function makeCard(tool) {
    const destination = safeToolUrl(tool.dir);
    if (!destination) return null;

    const card = document.createElement("article");
    card.className = "toolBox card";
    const preview = document.createElement("img");
    const imageUrl = safeToolUrl(tool.preview);
    preview.src = imageUrl ? imageUrl.href : fallbackImage;
    preview.alt = "";
    preview.loading = "lazy";
    preview.onerror = () => { preview.onerror = null; preview.src = fallbackImage; };

    const title = document.createElement("h3");
    title.textContent = tool.name || "Starblast tool";
    const description = document.createElement("p");
    description.textContent = tool.description || "Open this community tool.";
    const link = document.createElement("a");
    link.className = "card-link";
    link.href = destination.href;
    link.textContent = "Open tool →";
    if (destination.origin !== window.location.origin) {
      link.target = "_blank";
      link.rel = "noopener noreferrer";
    }

    card.append(preview, title, description, link);
    card.addEventListener("click", event => {
      if (event.target.closest("a")) return;
      if (destination.origin === window.location.origin) window.location.assign(destination.href);
      else window.open(destination.href, "_blank", "noopener,noreferrer");
    });
    card.style.cursor = "pointer";
    return card;
  }

  function metaValue(documentText, name) {
    const parsed = new DOMParser().parseFromString(documentText, "text/html");
    const item = parsed.querySelector('meta[property="' + name + '"], meta[name="' + name + '"]');
    if (!item) return "";
    const value = item.getAttribute("content") || "";
    return value.trim();
  }

  fetch(toolsUrl)
    .then(response => {
      if (!response.ok) throw new Error("Could not load tools list");
      return response.json();
    })
    .then(async entries => {
      if (!Array.isArray(entries)) throw new Error("Invalid tools list");
      const results = await Promise.all(entries.map(async entry => {
        const raw = typeof entry === "string" ? entry : entry && entry.dir;
        if (typeof raw !== "string") return null;

        let destination;
        if (/^https?:\/\//i.test(raw)) destination = safeToolUrl(raw);
        else {
          const clean = raw.replace(/^\/+/, "");
          const path = clean.startsWith("starblast/") ? clean.slice("starblast/".length) : clean;
          destination = safeToolUrl(path);
          if (destination && destination.origin === window.location.origin) {
            destination = new URL(path.replace(/\/?$/, "/"), document.baseURI);
          }
        }
        if (!destination) return null;

        if (typeof entry === "object" && entry !== null) {
          return {
            dir: destination.href,
            name: entry.name || "Starblast tool",
            description: entry.description || "Open this community tool.",
            preview: entry.preview || fallbackImage
          };
        }

        try {
          const response = await fetch(destination.href);
          if (!response.ok) throw new Error("Metadata unavailable");
          const html = await response.text();
          return {
            dir: destination.href,
            name: metaValue(html, "og:title") || destination.pathname.replace(/\/$/, "").split("/").pop().replace(/[-_]/g, " "),
            description: metaValue(html, "description") || "A community tool for Starblast.",
            preview: metaValue(html, "og:image") || fallbackImage
          };
        } catch (_) {
          return {
            dir: destination.href,
            name: destination.pathname.replace(/\/$/, "").split("/").pop().replace(/[-_]/g, " ") || "Starblast tool",
            description: "Open this Starblast community tool.",
            preview: fallbackImage
          };
        }
      }));

      const cards = results.map(makeCard).filter(Boolean);
      if (cards.length) container.replaceChildren(...cards);
      else throw new Error("No valid tools were found");
      if (status) status.remove();
    })
    .catch(() => {
      if (status) {
        status.textContent = "Tools could not be loaded right now. Please try again later.";
        status.style.color = "var(--danger)";
      }
    });
})();
