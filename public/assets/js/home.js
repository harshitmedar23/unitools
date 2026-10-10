import { initSearch, initTheme } from "/assets/common.js";

const categories = ["PDF", "Image", "Share", "Text and Code", "Calculators", "Student"];

function makeToolCard(tool) {
  const card = document.createElement("a");
  card.className = "tool-card";
  card.href = tool.url;
  card.dataset.searchText = [tool.name, tool.description, tool.category, ...tool.keywords].join(" ").toLowerCase();
  card.innerHTML = `<h3>${tool.name}</h3><p>${tool.description}</p><span class="tag">${tool.runs === "server" ? "Server" : "Browser"}</span>`;
  return card;
}

function renderTools(tools, container) {
  categories.forEach((category) => {
    const group = document.createElement("section");
    group.className = "tool-group";
    group.dataset.toolGroup = "";
    group.innerHTML = `<h2>${category}</h2><div class="tool-grid"></div>`;
    const grid = group.querySelector(".tool-grid");
    tools.filter((tool) => tool.category === category).forEach((tool) => grid.append(makeToolCard(tool)));
    container.append(group);
  });
}

initTheme();
const toolList = document.querySelector("[data-tool-list]");
const searchInput = document.querySelector("[data-tool-search]");
const tools = await fetch("/assets/tools.json", { cache: "no-store" }).then((response) => response.json());
renderTools(tools, toolList);
initSearch(searchInput, toolList);
if (matchMedia("(min-width: 700px)").matches) searchInput.focus();