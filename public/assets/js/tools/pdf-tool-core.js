import { clearMessage, downloadBlob, initDropzone, initTheme, loadScript, showError, showProgress } from "/assets/common.js";

const pdfLibUrl = "/assets/vendor/pdf-lib-1.17.1.min.js";
const pdfJsUrl = "/assets/vendor/pdfjs-4.10.38.min.mjs";
let pdfJsPromise;

function pdfAccept(file) { return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf"); }
function nextFrame() { return new Promise((resolve) => setTimeout(resolve, 0)); }
function revoke(url) { if (url) URL.revokeObjectURL(url); }
function pageIndexes(value, count) {
  const indexes = [];
  for (const part of value.split(",").map((item) => item.trim()).filter(Boolean)) {
    const match = /^(\d+)(?:-(\d+))?$/.exec(part);
    if (!match) throw new Error(`Could not read “${part}”. Use page numbers like 1-3, 5.`);
    const start = Number(match[1]);
    const end = Number(match[2] || match[1]);
    if (start < 1 || end < start || end > count) throw new Error(`Page ${Math.max(start, end)} does not exist. This PDF has ${count} pages.`);
    for (let page = start; page <= end; page += 1) indexes.push(page - 1);
  }
  return [...new Set(indexes)];
}
async function loadPdfLib() { await loadScript(pdfLibUrl); return window.PDFLib; }
async function loadPdfJs() {
  if (!pdfJsPromise) pdfJsPromise = import(pdfJsUrl).then((pdfjs) => { pdfjs.GlobalWorkerOptions.workerSrc = "/assets/vendor/pdfjs-4.10.38.worker.min.mjs"; return pdfjs; });
  return pdfJsPromise;
}
async function readPdf(file) { const PDFLib = await loadPdfLib(); return PDFLib.PDFDocument.load(await file.arrayBuffer()); }
function setResult(result, summary, bytes, filename, type = "application/pdf") {
  const blob = new Blob([bytes], { type });
  result.querySelector("[data-result-summary]").textContent = summary;
  const link = result.querySelector("[data-download]");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  result.hidden = false;
}
function controls(root) {
  return { root, dropzone: root.querySelector("[data-dropzone]"), input: root.querySelector("input[type=file]"), run: root.querySelector("[data-run]"), reset: root.querySelector("[data-reset]"), hint: root.querySelector("[data-run-hint]"), progress: root.querySelector("[data-progress]"), message: root.querySelector("[data-message]"), result: root.querySelector("[data-result]"), options: root.querySelector("[data-options]") };
}
function option(root, name) { return root.querySelector(`[data-option="${name}"]`); }

async function createPageFile(source, index, PDFLib) {
  const output = await PDFLib.PDFDocument.create();
  const [page] = await output.copyPages(source, [index]);
  output.addPage(page);
  return output;
}
async function savePdf(document) { return document.save({ useObjectStreams: true }); }

async function renderPage(pdf, index, scale = 1) {
  const page = await pdf.getPage(index + 1);
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.floor(viewport.width));
  canvas.height = Math.max(1, Math.floor(viewport.height));
  await page.render({ canvasContext: canvas.getContext("2d", { alpha: false }), viewport }).promise;
  return { canvas, page, viewport };
}
async function pdfJsDocument(file) { const pdfjs = await loadPdfJs(); return pdfjs.getDocument({ data: await file.arrayBuffer() }).promise; }

async function runPdfOperation(kind, source, c) {
  const PDFLib = await loadPdfLib();
  if (kind === "rotate") {
    const pdf = await readPdf(source); const indexes = pageIndexes(option(c.root, "pages").value || `1-${pdf.getPageCount()}`, pdf.getPageCount());
    const angle = Number(option(c.root, "angle").value); indexes.forEach((index) => pdf.getPage(index).setRotation(PDFLib.degrees(angle)));
    return { bytes: await savePdf(pdf), filename: "rotated.pdf", summary: `Done. Rotated ${indexes.length} ${indexes.length === 1 ? "page" : "pages"}.` };
  }
  if (kind === "pages") {
    const pdf = await readPdf(source); const count = pdf.getPageCount(); const selected = pageIndexes(option(c.root, "pages").value, count); const mode = option(c.root, "mode").value;
    if (!selected.length) throw new Error("Enter at least one page number.");
    const indexes = mode === "delete" ? pdf.getPageIndices().filter((index) => !selected.includes(index)) : selected;
    const output = await PDFLib.PDFDocument.create(); const copied = await output.copyPages(pdf, indexes); copied.forEach((page) => output.addPage(page));
    return { bytes: await savePdf(output), filename: mode === "delete" ? "pages-deleted.pdf" : "pages-reordered.pdf", summary: `Done. ${indexes.length} ${indexes.length === 1 ? "page" : "pages"} in the new PDF.` };
  }
  if (kind === "numbers") {
    const pdf = await readPdf(source); const position = option(c.root, "position").value; const start = Number(option(c.root, "start").value || 1); const font = await pdf.embedFont(PDFLib.StandardFonts.Helvetica);
    pdf.getPages().forEach((page, index) => { const { width, height } = page.getSize(); const text = String(start + index); const size = 10; const x = position.includes("right") ? width - 32 : position.includes("center") ? width / 2 - 4 : 24; const y = position.includes("top") ? height - 24 : 18; page.drawText(text, { x, y, size, font, color: PDFLib.rgb(0.2, 0.2, 0.2) }); });
    return { bytes: await savePdf(pdf), filename: "numbered.pdf", summary: `Done. Added page numbers to ${pdf.getPageCount()} pages.` };
  }
  if (kind === "watermark") {
    const pdf = await readPdf(source); const font = await pdf.embedFont(PDFLib.StandardFonts.Helvetica); const text = option(c.root, "text").value.trim(); if (!text) throw new Error("Enter watermark text first."); const opacity = Number(option(c.root, "opacity").value) / 100;
    pdf.getPages().forEach((page) => { const { width, height } = page.getSize(); page.drawText(text, { x: width / 2 - Math.min(width / 3, text.length * 8), y: height / 2, size: 32, font, rotate: PDFLib.degrees(-35), opacity, color: PDFLib.rgb(0.45, 0.45, 0.45) }); });
    return { bytes: await savePdf(pdf), filename: "watermarked.pdf", summary: `Done. Added a watermark to ${pdf.getPageCount()} pages.` };
  }
  if (kind === "headers-footers") {
    const pdf = await readPdf(source); const font = await pdf.embedFont(PDFLib.StandardFonts.Helvetica); const header = option(c.root, "header").value; const footer = option(c.root, "footer").value;
    if (!header && !footer) throw new Error("Enter a header, footer, or both.");
    pdf.getPages().forEach((page, index) => { const { width, height } = page.getSize(); if (header) page.drawText(header.replace("{page}", String(index + 1)), { x: 24, y: height - 24, size: 9, font }); if (footer) page.drawText(footer.replace("{page}", String(index + 1)), { x: 24, y: 18, size: 9, font }); });
    return { bytes: await savePdf(pdf), filename: "header-footer.pdf", summary: `Done. Added headers and footers to ${pdf.getPageCount()} pages.` };
  }
  if (kind === "crop") {
    const pdf = await readPdf(source);
    const left = Number(option(c.root, "left").value || 0);
    const right = Number(option(c.root, "right").value || 0);
    const top = Number(option(c.root, "top").value || 0);
    const bottom = Number(option(c.root, "bottom").value || 0);
    if ([left, right, top, bottom].some((value) => value < 0 || !Number.isFinite(value))) throw new Error("Margins must be zero or greater.");
    pdf.getPages().forEach((page) => {
      const box = page.getCropBox();
      const width = box.width - left - right;
      const height = box.height - top - bottom;
      if (width <= 0 || height <= 0) throw new Error("Those margins leave no printable page area. Reduce the crop amounts.");
      page.setCropBox(box.x + left, box.y + bottom, width, height);
    });
    return { bytes: await savePdf(pdf), filename: "cropped.pdf", summary: `Done. Cropped ${pdf.getPageCount()} pages.` };
  }
  if (kind === "metadata") {
    const pdf = await readPdf(source); pdf.setTitle(option(c.root, "title").value); pdf.setAuthor(option(c.root, "author").value); pdf.setSubject(option(c.root, "subject").value); pdf.setKeywords(option(c.root, "keywords").value.split(",").map((item) => item.trim()).filter(Boolean));
    return { bytes: await savePdf(pdf), filename: "metadata-edited.pdf", summary: "Done. Updated the PDF metadata." };
  }
  if (kind === "sign") {
    const imageFile = option(c.root, "signature").files[0]; if (!imageFile) throw new Error("Choose a PNG or JPG signature image."); const pdf = await readPdf(source); const imageBytes = await imageFile.arrayBuffer(); const image = imageFile.type === "image/png" ? await pdf.embedPng(imageBytes) : await pdf.embedJpg(imageBytes); const page = pdf.getPage(Math.max(1, Number(option(c.root, "page").value || 1)) - 1); const width = Number(option(c.root, "width").value || 160); const ratio = image.height / image.width; page.drawImage(image, { x: Number(option(c.root, "x").value || 40), y: Number(option(c.root, "y").value || 40), width, height: width * ratio });
    return { bytes: await savePdf(pdf), filename: "signed.pdf", summary: "Done. Added the signature image to the PDF." };
  }
  throw new Error("This PDF operation is not available.");
}

async function extractText(source, c) {
  const pdf = await pdfJsDocument(source); let text = "";
  for (let index = 0; index < pdf.numPages; index += 1) { showProgress(c.progress, `Extracting text from page ${index + 1} of ${pdf.numPages}`, index / pdf.numPages); const page = await pdf.getPage(index + 1); const content = await page.getTextContent(); text += `Page ${index + 1}\n${content.items.map((item) => item.str).join(" ")}\n\n`; await nextFrame(); }
  return { bytes: new TextEncoder().encode(text.trim()), filename: "extracted-text.txt", type: "text/plain", summary: `Done. Extracted text from ${pdf.numPages} pages.` };
}
async function extractMarkdown(source, c) {
  const pdf = await pdfJsDocument(source); let markdown = `# ${source.name.replace(/\.pdf$/iu, "")}\n\n`;
  for (let index = 0; index < pdf.numPages; index += 1) {
    showProgress(c.progress, `Extracting page ${index + 1} of ${pdf.numPages}`, index / pdf.numPages);
    const page = await pdf.getPage(index + 1); const content = await page.getTextContent();
    const lines = content.items.map((item) => item.str.trim()).filter(Boolean);
    markdown += `## Page ${index + 1}\n\n${lines.join(" ")}\n\n`;
    await nextFrame();
  }
  return { bytes: new TextEncoder().encode(markdown.trim()), filename: "converted.md", type: "text/markdown", summary: `Done. Extracted text from ${pdf.numPages} pages into Markdown.` };
}

async function compare(source, c) {
  const other = option(c.root, "other").files[0]; if (!other) throw new Error("Choose a second PDF to compare."); const [a, b] = await Promise.all([pdfJsDocument(source), pdfJsDocument(other)]); let same = a.numPages === b.numPages; let report = `PDF comparison\n\nFirst file: ${source.name}\nSecond file: ${other.name}\nPages: ${a.numPages} vs ${b.numPages}\n`;
  for (let index = 0; index < Math.max(a.numPages, b.numPages); index += 1) { const getText = async (doc) => { if (index >= doc.numPages) return ""; const content = await (await doc.getPage(index + 1)).getTextContent(); return content.items.map((item) => item.str).join(" ").replace(/\s+/gu, " ").trim(); }; const [left, right] = await Promise.all([getText(a), getText(b)]); const equal = left === right; same &&= equal; report += `Page ${index + 1}: ${equal ? "same text" : "different text"}\n`; }
  report += `\nResult: ${same ? "No page-count or extractable-text differences found." : "The PDFs differ in page count or extractable text."}`;
  c.root.querySelector("[data-text-output]").value = report; return { bytes: new TextEncoder().encode(report), filename: "pdf-comparison.txt", type: "text/plain", summary: same ? "Done. No extractable differences found." : "Done. Differences found. Read the report for page details." };
}
async function thumbnails(source, c) {
  const pdf = await pdfJsDocument(source); const first = await renderPage(pdf, 0, 0.28); const columns = Math.min(4, pdf.numPages); const gap = 16; const thumbWidth = first.canvas.width; const thumbHeight = first.canvas.height; const sheet = document.createElement("canvas"); sheet.width = columns * thumbWidth + (columns + 1) * gap; sheet.height = Math.ceil(pdf.numPages / columns) * thumbHeight + (Math.ceil(pdf.numPages / columns) + 1) * gap; const context = sheet.getContext("2d"); context.fillStyle = "#ffffff"; context.fillRect(0, 0, sheet.width, sheet.height);
  for (let index = 0; index < pdf.numPages; index += 1) { showProgress(c.progress, `Making thumbnail ${index + 1} of ${pdf.numPages}`, index / pdf.numPages); const rendered = index === 0 ? first : await renderPage(pdf, index, 0.28); const x = gap + (index % columns) * (thumbWidth + gap); const y = gap + Math.floor(index / columns) * (thumbHeight + gap); context.drawImage(rendered.canvas, x, y); rendered.canvas.width = 1; rendered.canvas.height = 1; await nextFrame(); }
  const blob = await new Promise((resolve) => sheet.toBlob(resolve, "image/jpeg", 0.9)); return { bytes: await blob.arrayBuffer(), filename: "pdf-page-thumbnails.jpg", type: "image/jpeg", summary: `Done. Created ${pdf.numPages} page thumbnails.` };
}
async function extractImages(source, c) {
  const pdfjs = await loadPdfJs(); const pdf = await pdfJsDocument(source); await loadScript("/assets/vendor/fflate-0.8.2.min.js"); const archive = {}; let found = 0;
  for (let pageIndex = 0; pageIndex < pdf.numPages; pageIndex += 1) {
    showProgress(c.progress, `Checking images on page ${pageIndex + 1} of ${pdf.numPages}`, pageIndex / pdf.numPages);
    const page = await pdf.getPage(pageIndex + 1); const operators = await page.getOperatorList();
    const imageNames = operators.fnArray.map((fn, index) => ({ fn, args: operators.argsArray[index] })).filter((item) => item.fn === pdfjs.OPS.paintImageXObject || item.fn === pdfjs.OPS.paintInlineImageXObject).map((item) => item.args[0]);
    for (const name of [...new Set(imageNames)]) {
      const image = await new Promise((resolve) => page.objs.get(name, resolve)); if (!image?.width || !image?.height || !image?.data) continue;
      const canvas = document.createElement("canvas"); canvas.width = image.width; canvas.height = image.height; const context = canvas.getContext("2d"); const imageData = image.data instanceof Uint8ClampedArray ? new Uint8ClampedArray(image.data) : new Uint8ClampedArray(image.data.buffer);
      context.putImageData(new ImageData(imageData, image.width, image.height), 0, 0); const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png")); archive[`page-${pageIndex + 1}-image-${found + 1}.png`] = new Uint8Array(await blob.arrayBuffer()); found += 1; canvas.width = 1; canvas.height = 1;
    }
    await nextFrame();
  }
  if (!found) throw new Error("No embedded raster images were found in this PDF. Scanned pages may be stored as a full page image or use a format the browser cannot extract.");
  const bytes = window.fflate.zipSync(archive); return { bytes, filename: "extracted-images.zip", type: "application/zip", summary: `Done. Extracted ${found} ${found === 1 ? "image" : "images"} in a ZIP.` };
}

export function initPdfTool(kind) {
  initTheme(); const c = controls(document.querySelector("[data-pdf-tool]")); let source; let outputUrl = "";
  function update() { c.run.disabled = !source; c.hint.textContent = source ? "Ready to process this PDF." : "Choose a PDF to begin."; c.reset.hidden = !source && c.result.hidden; }
  function fail(error) { c.progress.hidden = true; showError(c.message, error.message || "Could not read this PDF. Try saving it again and retry."); update(); }
  async function read(files) { source = files[0]; c.result.hidden = true; c.options.hidden = false; clearMessage(c.message); showProgress(c.progress, "Reading PDF", 0); try { const pdf = await readPdf(source); const pageCount = pdf.getPageCount(); c.root.querySelector("[data-page-count]").textContent = `${pageCount} ${pageCount === 1 ? "page" : "pages"} found.`; if (kind === "metadata") { option(c.root, "title").value = pdf.getTitle() || ""; option(c.root, "author").value = pdf.getAuthor() || ""; option(c.root, "subject").value = pdf.getSubject() || ""; } c.progress.hidden = true; update(); } catch { fail(new Error("This PDF could not be read. It may be locked or damaged.")); } }
  async function run() { if (!source) return; c.run.disabled = true; clearMessage(c.message); c.result.hidden = true; showProgress(c.progress, "Preparing PDF", 0); try { const result = kind === "text" ? await extractText(source, c) : kind === "markdown" ? await extractMarkdown(source, c) : kind === "compare" ? await compare(source, c) : kind === "thumbnails" ? await thumbnails(source, c) : kind === "images" ? await extractImages(source, c) : await runPdfOperation(kind, source, c); revoke(outputUrl); const blob = new Blob([result.bytes], { type: result.type || "application/pdf" }); outputUrl = URL.createObjectURL(blob); const link = c.result.querySelector("[data-download]"); link.href = outputUrl; link.download = result.filename; c.result.querySelector("[data-result-summary]").textContent = result.summary; c.result.hidden = false; c.progress.hidden = true; c.reset.hidden = false; } catch (error) { fail(error); c.run.disabled = false; } }
  function reset() { source = null; c.input.value = ""; c.options.hidden = true; c.result.hidden = true; c.progress.hidden = true; revoke(outputUrl); outputUrl = ""; clearMessage(c.message); c.root.querySelector("[data-page-count]").textContent = ""; c.root.querySelector("[data-text-output]")?.replaceChildren?.(); update(); }
  initDropzone(c.dropzone, { accept: pdfAccept, multiple: false, maxSizeMB: 100, onError: () => showError(c.message, "This tool needs a PDF file. Choose a PDF and try again."), onFiles: read });
  c.run.addEventListener("click", run); c.reset.addEventListener("click", reset); update();
}