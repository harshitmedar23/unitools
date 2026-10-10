export function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes;
  let unitIndex = -1;
  do { value /= 1024; unitIndex += 1; } while (value >= 1024 && unitIndex < units.length - 1);
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unitIndex]}`;
}

export function formatNumberIN(value) {
  return Number.isFinite(Number(value)) ? new Intl.NumberFormat("en-IN").format(Number(value)) : "0";
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function showError(container, message) {
  container.className = "message message-error";
  container.textContent = `Error: ${message}`;
  container.hidden = false;
}

export function clearMessage(container) {
  container.textContent = "";
  container.hidden = true;
}

export function showProgress(container, label, fraction) {
  container.hidden = false;
  container.innerHTML = `<div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="1" aria-valuenow="${Math.min(1, Math.max(0, fraction))}"><div class="progress-bar"></div></div><p class="progress-label" aria-live="polite"></p>`;
  container.querySelector(".progress-bar").style.transform = `scaleX(${Math.min(1, Math.max(0, fraction))})`;
  container.querySelector(".progress-label").textContent = label;
}

const loadedScripts = new Map();
export function loadScript(src) {
  if (loadedScripts.has(src)) return loadedScripts.get(src);
  const promise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Could not load ${src}`));
    document.head.append(script);
  });
  loadedScripts.set(src, promise);
  return promise;
}

export function initDropzone(element, options = {}) {
  const input = element.querySelector("input[type=file]");
  const handleFiles = (files) => {
    const selected = Array.from(files);
    const maxBytes = (options.maxSizeMB || Infinity) * 1024 * 1024;
    if (!options.multiple && selected.length > 1) selected.splice(1);
    if (selected.some((file) => file.size > maxBytes)) return options.onError?.("That file is too large. Choose a smaller one.");
    if (options.accept && selected.some((file) => !file.type.match(options.accept))) return options.onError?.("That file type is not accepted. Choose a supported file.");
    options.onFiles?.(selected);
  };
  input?.addEventListener("change", () => handleFiles(input.files));
  ["dragenter", "dragover"].forEach((eventName) => element.addEventListener(eventName, (event) => { event.preventDefault(); element.classList.add("is-dragover"); }));
  ["dragleave", "drop"].forEach((eventName) => element.addEventListener(eventName, (event) => { event.preventDefault(); element.classList.remove("is-dragover"); }));
  element.addEventListener("drop", (event) => handleFiles(event.dataTransfer.files));
}

export function saveSetting(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage is optional */ } }
export function loadSetting(key) { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } }

export function initTheme() {
  const saved = loadSetting("unitools-theme");
  if (saved === "light" || saved === "dark") document.documentElement.dataset.theme = saved;
  const button = document.querySelector("[data-theme-toggle]");
  const updateButton = () => {
    const dark = document.documentElement.dataset.theme === "dark" || (!document.documentElement.dataset.theme && matchMedia("(prefers-color-scheme: dark)").matches);
    button?.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
    const icon = button?.querySelector("use");
    icon?.setAttribute("href", `/assets/icons.svg#${dark ? "sun" : "moon"}`);
  };
  button?.addEventListener("click", () => { const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark"; document.documentElement.dataset.theme = next; saveSetting("unitools-theme", next); updateButton(); });
  updateButton();
}

export function initSearch(input, list) {
  const items = Array.from(list.querySelectorAll("[data-search-text]"));
  const filter = () => {
    const query = input.value.trim().toLowerCase();
    let visible = 0;
    items.forEach((item) => { const match = !query || item.dataset.searchText.includes(query); item.hidden = !match; if (match) visible += 1; });
    list.querySelectorAll("[data-tool-group]").forEach((group) => { group.hidden = !group.querySelector("[data-search-text]:not([hidden])"); });
    document.querySelector("[data-empty-state]")?.toggleAttribute("hidden", visible !== 0);
    const status = document.querySelector("[data-search-status]");
    if (status) status.textContent = query ? `${visible} ${visible === 1 ? "tool" : "tools"} found` : "";
  };
  input.addEventListener("input", filter);
  document.addEventListener("keydown", (event) => { if (event.key === "/" && document.activeElement !== input && !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)) { event.preventDefault(); input.focus(); } });
  return filter;
}