import { clearMessage, downloadBlob, initDropzone, initTheme, loadScript, showError, showProgress } from "/assets/common.js";

const supportedTypes = ["txt", "md", "html", "json", "csv", "xml"];
const textExtensions = { txt: "text/plain", md: "text/markdown", markdown: "text/markdown", html: "text/html", htm: "text/html", json: "application/json", csv: "text/csv", xml: "application/xml" };

function elements() {
  return {
    page: document.body.dataset.conversion,
    dropzone: document.querySelector("[data-dropzone]"),
    input: document.querySelector("[data-input]"),
    fileInput: document.querySelector("[data-file-input]"),
    output: document.querySelector("[data-output]"),
    run: document.querySelector("[data-run]"),
    print: document.querySelector("[data-print]"),
    reset: document.querySelector("[data-reset]"),
    progress: document.querySelector("[data-progress]"),
    message: document.querySelector("[data-message]"),
    result: document.querySelector("[data-result]"),
    summary: document.querySelector("[data-result-summary]"),
    download: document.querySelector("[data-download]"),
    filename: document.querySelector("[data-filename]"),
    fileList: document.querySelector("[data-file-list]")
  };
}

function extension(name) { return name.toLowerCase().split(".").pop(); }
function baseName(name) { return name.replace(/\.[^.]+$/u, ""); }
function nextFrame() { return new Promise((resolve) => setTimeout(resolve, 0)); }
function escapeHtml(value) { return String(value).replace(/&/gu, "&amp;").replace(/</gu, "&lt;").replace(/>/gu, "&gt;").replace(/"/gu, "&quot;").replace(/'/gu, "&#39;"); }
function escapeXml(value) { return String(value).replace(/&/gu, "&amp;").replace(/</gu, "&lt;").replace(/>/gu, "&gt;").replace(/"/gu, "&quot;").replace(/'/gu, "&apos;"); }

function csvRows(value) {
  const rows = [];
  let row = [], cell = "", quoted = false;
  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];
    if (character === '"' && quoted && value[index + 1] === '"') { cell += '"'; index += 1; continue; }
    if (character === '"') { quoted = !quoted; continue; }
    if (character === "," && !quoted) { row.push(cell); cell = ""; continue; }
    if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && value[index + 1] === "\n") index += 1;
      row.push(cell); cell = ""; if (row.some((item) => item !== "")) rows.push(row); row = []; continue;
    }
    cell += character;
  }
  if (cell || row.length) { row.push(cell); if (row.some((item) => item !== "")) rows.push(row); }
  return rows;
}

function csvToJson(value) {
  const rows = csvRows(value);
  if (!rows.length) throw new Error("CSV input is empty.");
  const headers = rows[0].map((header, index) => header.trim() || `column_${index + 1}`);
  return rows.slice(1).map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ""])));
}

function csvCell(value) { const text = value == null ? "" : typeof value === "object" ? JSON.stringify(value) : String(value); return /[",\n\r]/u.test(text) ? `"${text.replace(/"/gu, '""')}"` : text; }
function jsonToCsv(value) {
  if (!Array.isArray(value) || !value.length || value.some((item) => !item || typeof item !== "object" || Array.isArray(item))) throw new Error("JSON to CSV needs a non-empty array of objects.");
  const headers = [...new Set(value.flatMap((item) => Object.keys(item)))];
  return [headers.map(csvCell).join(","), ...value.map((item) => headers.map((header) => csvCell(item[header])).join(","))].join("\n");
}

function xmlToObject(element) {
  const children = [...element.children];
  const attributes = Object.fromEntries([...element.attributes].map((attribute) => [`@${attribute.name}`, attribute.value]));
  const text = [...element.childNodes].filter((node) => node.nodeType === Node.TEXT_NODE).map((node) => node.nodeValue.trim()).filter(Boolean).join(" ");
  if (!children.length) return Object.keys(attributes).length ? { ...attributes, ...(text ? { "#text": text } : {}) } : text;
  const result = { ...attributes };
  if (text) result["#text"] = text;
  children.forEach((child) => { const childValue = xmlToObject(child); if (result[child.tagName] === undefined) result[child.tagName] = childValue; else result[child.tagName] = Array.isArray(result[child.tagName]) ? [...result[child.tagName], childValue] : [result[child.tagName], childValue]; });
  return result;
}
function xmlToJson(value) {
  const documentValue = new DOMParser().parseFromString(value, "application/xml");
  if (documentValue.querySelector("parsererror")) throw new Error("This XML is not valid. Check the tags and try again.");
  const root = documentValue.documentElement;
  if (!root) throw new Error("XML input is empty.");
  return JSON.stringify({ [root.tagName]: xmlToObject(root) }, null, 2);
}
function jsonToXml(value) {
  const rootName = Object.keys(value || {}).length === 1 && typeof value === "object" && !Array.isArray(value) ? Object.keys(value)[0] : "root";
  const rootValue = rootName === "root" ? value : value[rootName];
  const build = (name, item) => {
    if (Array.isArray(item)) return item.map((entry) => build(name, entry)).join("");
    if (item === null || typeof item !== "object") return `<${name}>${escapeXml(item ?? "")}</${name}>`;
    const attributes = Object.entries(item).filter(([key]) => key.startsWith("@")).map(([key, entry]) => ` ${key.slice(1)}="${escapeXml(entry)}"`).join("");
    const text = item["#text"] == null ? "" : escapeXml(item["#text"]);
    const children = Object.entries(item).filter(([key]) => !key.startsWith("@") && key !== "#text").map(([key, entry]) => build(key, entry)).join("");
    return `<${name}${attributes}>${text}${children}</${name}>`;
  };
  return `<?xml version="1.0" encoding="UTF-8"?>\n${build(rootName, rootValue)}`;
}

function markdownToHtml(markdown) {
  const lines = markdown.replace(/\r\n?/gu, "\n").split("\n");
  const output = []; let listOpen = false; let codeOpen = false;
  const inline = (value) => escapeHtml(value).replace(/`([^`]+)`/gu, "<code>$1</code>").replace(/\*\*([^*]+)\*\*/gu, "<strong>$1</strong>").replace(/\*([^*]+)\*/gu, "<em>$1</em>").replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/gu, '<a href="$2">$1</a>');
  const closeList = () => { if (listOpen) { output.push("</ul>"); listOpen = false; } };
  lines.forEach((line) => {
    if (line.trim().startsWith("```")) { closeList(); if (codeOpen) output.push("</code></pre>"); else output.push("<pre><code>"); codeOpen = !codeOpen; return; }
    if (codeOpen) { output.push(`${escapeHtml(line)}\n`); return; }
    const heading = line.match(/^(#{1,6})\s+(.+)$/u);
    if (heading) { closeList(); output.push(`<h${heading[1].length}>${inline(heading[2])}</h${heading[1].length}>`); return; }
    const bullet = line.match(/^\s*[-*+]\s+(.+)$/u);
    if (bullet) { if (!listOpen) { output.push("<ul>"); listOpen = true; } output.push(`<li>${inline(bullet[1])}</li>`); return; }
    closeList(); if (line.trim()) output.push(`<p>${inline(line)}</p>`);
  });
  closeList(); if (codeOpen) output.push("</code></pre>"); return output.join("\n");
}
function markdownText(markdown) { return markdown.replace(/^```.*$/gmu, "").replace(/^#{1,6}\s+/gmu, "").replace(/^\s*[-*+]\s+/gmu, "- ").replace(/\[([^\]]+)\]\([^)]*\)/gu, "$1").replace(/[*_`]/gu, ""); }

async function pdfFromText(value, title) {
  await loadScript("/assets/vendor/pdf-lib-1.17.1.min.js");
  const { PDFDocument, StandardFonts, rgb } = window.PDFLib;
  const pdf = await PDFDocument.create(); const font = await pdf.embedFont(StandardFonts.Helvetica);
  const margin = 48; const size = 11; const lineHeight = 16; const pageWidth = 595; const pageHeight = 842; const maxWidth = pageWidth - margin * 2;
  const lines = [];
  value.replace(/\r\n?/gu, "\n").split("\n").forEach((sourceLine) => { const words = sourceLine.split(/\s+/u); let line = ""; if (!sourceLine) lines.push(""); words.forEach((word) => { const candidate = line ? `${line} ${word}` : word; if (font.widthOfTextAtSize(candidate, size) > maxWidth && line) { lines.push(line); line = word; } else line = candidate; }); if (line) lines.push(line); });
  let page = pdf.addPage([pageWidth, pageHeight]); let y = pageHeight - margin; page.drawText(title, { x: margin, y, size: 15, font, color: rgb(0.11, 0.1, 0.09) }); y -= 28;
  for (const line of lines) { if (y < margin) { page = pdf.addPage([pageWidth, pageHeight]); y = pageHeight - margin; } if (line) page.drawText(line, { x: margin, y, size, font, color: rgb(0.11, 0.1, 0.09) }); y -= lineHeight; await nextFrame(); }
  return pdf.save();
}

async function readFile(file) { return file.text(); }
function acceptedFor(page, file) { const ext = extension(file.name); if (page === "batch") return supportedTypes.includes(ext) || ext === "markdown"; return page === "txt-pdf" ? ext === "txt" : page === "markdown-html" || page === "markdown-pdf" ? ["md", "markdown"].includes(ext) : page === "html-pdf" ? ["html", "htm"].includes(ext) : ext === page.split("-")[0] || ext === page.split("-")[2]; }

function renderBatchList(c, files) { c.fileList.replaceChildren(...files.map((file) => { const item = document.createElement("li"); item.className = "file-row"; item.textContent = `${file.name} (${file.type || "text"})`; return item; })); c.fileList.hidden = !files.length; }

export function initConversionTool() {
  const c = elements(); initTheme(); let files = []; let outputUrl = ""; let outputBlob = null;
  const setReady = () => { c.run.disabled = !((c.input?.value.trim()) || files.length); c.reset.hidden = !((c.input?.value.trim()) || files.length || !c.result.hidden); };
  const setOutput = (blob, name, summary) => { outputBlob = blob; if (outputUrl) URL.revokeObjectURL(outputUrl); outputUrl = URL.createObjectURL(blob); c.download.href = outputUrl; c.download.download = name; c.summary.textContent = summary; c.result.hidden = false; c.progress.hidden = true; c.reset.hidden = false; };
  async function run() {
    clearMessage(c.message); c.result.hidden = true; c.run.disabled = true;
    try {
      if (c.page === "batch") {
        if (!files.length) throw new Error("Choose TXT, Markdown, JSON, CSV or XML files first.");
        const outputs = {}; for (let index = 0; index < files.length; index += 1) { const file = files[index]; showProgress(c.progress, `Converting file ${index + 1} of ${files.length}`, index / files.length); const text = await readFile(file); const ext = extension(file.name); let converted, name; if (ext === "json") { converted = jsonToCsv(JSON.parse(text)); name = `${baseName(file.name)}.csv`; } else if (ext === "csv") { converted = JSON.stringify(csvToJson(text), null, 2); name = `${baseName(file.name)}.json`; } else if (ext === "xml") { converted = xmlToJson(text); name = `${baseName(file.name)}.json`; } else if (["md", "markdown"].includes(ext)) { converted = markdownToHtml(text); name = `${baseName(file.name)}.html`; } else { converted = text; name = `${baseName(file.name)}.txt`; } outputs[name] = new TextEncoder().encode(converted); await nextFrame(); }
        await loadScript("/assets/vendor/fflate-0.8.2.min.js"); const zip = window.fflate.zipSync(outputs); setOutput(new Blob([zip], { type: "application/zip" }), "converted-files.zip", `Done. ${files.length} file${files.length === 1 ? "" : "s"} converted into converted-files.zip.`); return;
      }
      const text = c.input.value.trim(); if (!text) throw new Error("Paste text into the input or choose a file first."); showProgress(c.progress, "Converting locally", 0.25); await nextFrame();
      let value, name, blob, summary;
      if (c.page === "txt-pdf") { const bytes = await pdfFromText(c.input.value, "Text document"); blob = new Blob([bytes], { type: "application/pdf" }); name = "text-document.pdf"; summary = "Done. The TXT content is ready as a PDF."; }
      if (c.page === "markdown-html") { value = markdownToHtml(c.input.value); blob = new Blob([`<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Markdown document</title></head><body>${value}</body></html>`], { type: "text/html" }); name = "markdown-document.html"; summary = "Done. Markdown was converted to HTML."; if (c.output) c.output.value = value; }
      if (c.page === "markdown-pdf") { const bytes = await pdfFromText(markdownText(c.input.value), "Markdown document"); blob = new Blob([bytes], { type: "application/pdf" }); name = "markdown-document.pdf"; summary = "Done. Markdown text is ready as a PDF."; }
      if (c.page === "html-pdf") { const popup = window.open("", "_blank"); if (!popup) throw new Error("The print window was blocked. Allow pop-ups for this page and try again."); popup.document.open(); popup.document.write(c.input.value); popup.document.close(); popup.focus(); popup.print(); c.print.hidden = false; c.summary.textContent = "The browser print dialog is open. Choose Save as PDF."; c.result.hidden = false; c.progress.hidden = true; c.reset.hidden = false; return; }
      if (c.page === "json-csv") { value = jsonToCsv(JSON.parse(c.input.value)); blob = new Blob([value], { type: "text/csv" }); name = "data.csv"; summary = "Done. JSON was converted to CSV."; if (c.output) c.output.value = value; }
      if (c.page === "csv-json") { value = JSON.stringify(csvToJson(c.input.value), null, 2); blob = new Blob([value], { type: "application/json" }); name = "data.json"; summary = "Done. CSV was converted to JSON."; if (c.output) c.output.value = value; }
      if (c.page === "xml-json") { value = xmlToJson(c.input.value); blob = new Blob([value], { type: "application/json" }); name = "data.json"; summary = "Done. XML was converted to JSON."; if (c.output) c.output.value = value; }
      if (c.page === "json-xml") { value = jsonToXml(JSON.parse(c.input.value)); blob = new Blob([value], { type: "application/xml" }); name = "data.xml"; summary = "Done. JSON was converted to XML."; if (c.output) c.output.value = value; }
      if (blob) setOutput(blob, name, summary);
    } catch (error) { c.progress.hidden = true; showError(c.message, error instanceof SyntaxError ? "The input is not valid JSON. Check commas, quotes and brackets." : error.message || "Could not convert this input. Check the format and try again."); }
    c.run.disabled = false; setReady();
  }
  c.input?.addEventListener("input", () => { files = []; if (c.fileInput) c.fileInput.value = ""; setReady(); });
  if (c.dropzone) initDropzone(c.dropzone, { multiple: c.page === "batch", accept: (file) => acceptedFor(c.page, file), onError: (error) => showError(c.message, error), onFiles: async (selected) => { files = selected; if (c.page !== "batch") { c.input.value = await readFile(selected[0]); c.filename.textContent = selected[0].name; } else renderBatchList(c, files); setReady(); } });
  c.run.addEventListener("click", run); c.print?.addEventListener("click", () => window.print()); c.reset.addEventListener("click", () => { files = []; c.input.value = ""; if (c.output) c.output.value = ""; c.fileInput.value = ""; c.filename.textContent = "No file chosen"; c.result.hidden = true; c.progress.hidden = true; c.fileList.hidden = true; clearMessage(c.message); if (outputUrl) URL.revokeObjectURL(outputUrl); outputUrl = ""; outputBlob = null; setReady(); }); setReady();
}
