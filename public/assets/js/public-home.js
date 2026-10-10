import { initTheme } from "/assets/common.js";

const categories = [
  { id: "organize", title: "Organize PDF", entries: [
    ["Merge PDF", "merge-pdf"], ["Split PDF", "split-pdf"], ["Remove pages", "pdf-pages"],
    ["Extract pages", "pdf-pages"], ["Organize PDF", "pdf-pages"], ["Scan to PDF", "jpg-to-pdf"]
  ] },
  { id: "optimize", title: "Optimize PDF", entries: [
    ["Compress PDF", "compress-pdf"], ["Repair PDF"], ["OCR PDF"]
  ] },
  { id: "convert-to", title: "Convert to PDF", entries: [
    ["JPG to PDF", "jpg-to-pdf"], ["Word to PDF"], ["PowerPoint to PDF"],
    ["Excel to PDF"], ["HTML to PDF", "html-to-pdf"]
  ] },
  { id: "convert-from", title: "Convert from PDF", entries: [
    ["PDF to JPG", "pdf-to-jpg"], ["PDF to Word"], ["PDF to PowerPoint"],
    ["PDF to Excel"], ["PDF to PDF/A"], ["PDF to Markdown", "extract-pdf-text"]
  ] },
  { id: "edit", title: "Edit PDF", entries: [
    ["Rotate PDF", "rotate-pdf"], ["Add page numbers", "add-page-numbers"],
    ["Add watermark", "watermark-pdf"], ["Crop PDF", "crop-pdf"], ["Edit PDF", "pdf-metadata"], ["PDF Forms", "pdf-forms"]
  ] },
  { id: "security", title: "PDF Security", entries: [
    ["Unlock PDF"], ["Protect PDF"], ["Sign PDF", "sign-pdf"], ["Redact PDF"], ["Compare PDF", "compare-pdf"]
  ] },
  { id: "intelligence", title: "PDF Intelligence", entries: [
    ["AI summarizer"], ["Translate PDF"], ["Extract text", "extract-pdf-text"],
    ["Extract images", "extract-pdf-images"], ["Page thumbnails", "pdf-thumbnails"]
  ] }
];

function createEntry(label, tool, categoryId) {
  const entry = document.createElement(tool ? "a" : "div");
  entry.className = `directory-entry${tool ? "" : " is-unavailable"}`;
  entry.dataset.searchText = `${label} ${tool?.description || "not available yet"}`.toLowerCase();
  if (tool) entry.href = tool.url;

  const mark = document.createElement("span");
  mark.className = `directory-mark category-${categoryId}`;
  mark.setAttribute("aria-hidden", "true");
  mark.textContent = label.split(/\s+/).map((word) => word[0]).join("").slice(0, 2).toUpperCase();

  const copy = document.createElement("span");
  copy.className = "directory-copy";
  const name = document.createElement("span");
  name.className = "directory-name";
  name.textContent = label;
  copy.append(name);
  if (!tool) {
    const availability = document.createElement("span");
    availability.className = "directory-availability";
    availability.textContent = "Not available yet";
    copy.append(availability);
    entry.setAttribute("aria-disabled", "true");
  }
  entry.append(mark, copy);
  return entry;
}

function renderCategories(toolIndex) {
  const container = document.querySelector("[data-public-categories]");
  categories.forEach((category) => {
    const section = document.createElement("section");
    section.className = "directory-category";
    section.dataset.category = category.id;
    const heading = document.createElement("h2");
    heading.textContent = category.title;
    const list = document.createElement("div");
    list.className = "directory-list";
    category.entries.forEach(([label, id]) => list.append(createEntry(label, id ? toolIndex.get(id) : null, category.id)));
    section.append(heading, list);
    container.append(section);
  });
}

function initDirectorySearch() {
  const input = document.querySelector("[data-public-search]");
  const entries = [...document.querySelectorAll(".directory-entry")];
  const groups = [...document.querySelectorAll(".directory-category")];
  const empty = document.querySelector("[data-public-empty]");
  const status = document.querySelector("[data-public-search-status]");
  const filter = () => {
    const query = input.value.trim().toLowerCase();
    let count = 0;
    entries.forEach((entry) => {
      const visible = !query || entry.dataset.searchText.includes(query);
      entry.hidden = !visible;
      if (visible) count += 1;
    });
    groups.forEach((group) => { group.hidden = !group.querySelector(".directory-entry:not([hidden])"); });
    empty.hidden = count !== 0;
    status.textContent = query ? `${count} ${count === 1 ? "tool" : "tools"} found` : "";
  };
  input.addEventListener("input", filter);
  document.addEventListener("keydown", (event) => {
    if (event.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)) {
      event.preventDefault();
      input.focus();
    }
  });
}

initTheme();
const registry = await fetch("/assets/tools.json", { cache: "no-store" }).then((response) => response.json());
renderCategories(new Map(registry.map((tool) => [tool.id, tool])));
initDirectorySearch();
if (matchMedia("(min-width: 700px)").matches) document.querySelector("[data-public-search]").focus();