import { initTheme } from "/assets/common.js";

const fileToolIds = [
  "merge-pdf",
  "split-pdf",
  "compress-pdf",
  "jpg-to-pdf",
  "pdf-to-jpg",
  "compress-image",
  "resize-image",
  "image-converter"
];

function makeToolCard(tool) {
  const card = document.createElement("a");
  card.className = "tool-card";
  card.href = tool.url;
  card.innerHTML = `<h3>${tool.name}</h3><p>${tool.description}</p><span class="tag">Browser</span>`;
  return card;
}

initTheme();
const container = document.querySelector("[data-public-file-tools]");
const tools = await fetch("/assets/tools.json", { cache: "no-store" }).then((response) => response.json());
tools.filter((tool) => fileToolIds.includes(tool.id)).forEach((tool) => container.append(makeToolCard(tool)));