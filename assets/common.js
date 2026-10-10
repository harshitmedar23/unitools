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
  setTimeout(() => URL.revokeObjectURL(url), 0);
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

export function showWarning(container, message) {
  container.className = "message message-warn";
  container.textContent = `Warning: ${message}`;
  container.hidden = false;
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
    if (options.accept && selected.some((file) => typeof options.accept === "function" ? !options.accept(file) : !file.type.match(options.accept))) return options.onError?.("That file type is not accepted. Choose a supported file.");
    if (selected.some((file) => file.size > maxBytes)) return options.onError?.("That file is too large. Choose a smaller one.");
    options.onFiles?.(selected);
    if (selected.reduce((total, file) => total + file.size, 0) > maxBytes) options.onSizeWarning?.();
  };
  input?.addEventListener("change", () => handleFiles(input.files));
  ["dragenter", "dragover"].forEach((eventName) => element.addEventListener(eventName, (event) => { event.preventDefault(); element.classList.add("is-dragover"); }));
  ["dragleave", "drop"].forEach((eventName) => element.addEventListener(eventName, (event) => { event.preventDefault(); element.classList.remove("is-dragover"); }));
  element.addEventListener("drop", (event) => handleFiles(event.dataTransfer.files));
}

export function renderFileList(listElement, items, { onRemove, onMove } = {}) {
  listElement.replaceChildren();
  items.forEach((item, index) => {
    const row = document.createElement("li");
    row.className = "file-row";
    row.draggable = true;
    row.dataset.index = String(index);

    const handle = document.createElement("span");
    handle.className = "file-row-handle";
    handle.setAttribute("aria-hidden", "true");
    handle.innerHTML = '<svg class="icon"><use href="/assets/icons.svg#grip"></use></svg>';

    const name = document.createElement("span");
    name.className = "file-row-name";
    const extensionIndex = item.file.name.lastIndexOf(".");
    const stem = document.createElement("span");
    stem.className = "file-name-stem";
    stem.textContent = extensionIndex > 0 ? item.file.name.slice(0, extensionIndex) : item.file.name;
    const extension = document.createElement("span");
    extension.className = "file-name-extension";
    extension.textContent = extensionIndex > 0 ? item.file.name.slice(extensionIndex) : "";
    name.append(stem, extension);

    const details = document.createElement("span");
    details.className = "file-row-details";
    details.textContent = `${item.pages} ${item.pages === 1 ? "page" : "pages"} · ${formatBytes(item.file.size)}`;

    const moveUp = document.createElement("button");
    moveUp.className = "file-row-action";
    moveUp.type = "button";
    moveUp.setAttribute("aria-label", `Move ${item.file.name} up`);
    moveUp.innerHTML = '<svg class="icon" aria-hidden="true"><use href="/assets/icons.svg#arrow-up"></use></svg>';
    moveUp.disabled = index === 0;
    moveUp.addEventListener("click", () => onMove?.(index, index - 1));

    const moveDown = document.createElement("button");
    moveDown.className = "file-row-action";
    moveDown.type = "button";
    moveDown.setAttribute("aria-label", `Move ${item.file.name} down`);
    moveDown.innerHTML = '<svg class="icon" aria-hidden="true"><use href="/assets/icons.svg#arrow-down"></use></svg>';
    moveDown.disabled = index === items.length - 1;
    moveDown.addEventListener("click", () => onMove?.(index, index + 1));

    const remove = document.createElement("button");
    remove.className = "file-row-remove";
    remove.type = "button";
    remove.setAttribute("aria-label", `Remove ${item.file.name}`);
    remove.innerHTML = '<svg class="icon" aria-hidden="true"><use href="/assets/icons.svg#x"></use></svg>';
    remove.addEventListener("click", () => onRemove?.(index));

    row.append(handle, name, details, moveUp, moveDown, remove);
    row.addEventListener("dragstart", (event) => { event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", String(index)); });
    row.addEventListener("dragover", (event) => event.preventDefault());
    row.addEventListener("drop", (event) => { event.preventDefault(); onMove?.(Number(event.dataTransfer.getData("text/plain")), index); });
    listElement.append(row);
  });
  listElement.hidden = items.length === 0;
}

export function saveSetting(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage is optional */ } }
export function loadSetting(key) { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } }

export function getShareApiBase() {
  return document.querySelector('meta[name="share-api"]')?.content || "/api";
}

export function bytesToBase64Url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/gu, "-").replace(/\//gu, "_").replace(/=+$/u, "");
}

export function base64UrlToBytes(value) {
  const normalized = value.replace(/-/gu, "+").replace(/_/gu, "/");
  const binary = atob(normalized + "=".repeat((4 - normalized.length % 4) % 4));
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

export async function copyText(value) {
  await navigator.clipboard.writeText(value);
}

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