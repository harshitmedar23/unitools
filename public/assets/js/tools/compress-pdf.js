import { clearMessage, initDropzone, initTheme, loadScript, showError, showProgress, showWarning } from "/assets/common.js";

const dropzone = document.querySelector("[data-dropzone]");
const input = dropzone.querySelector("input");
const options = document.querySelector("[data-options]");
const mode = document.querySelector("[data-mode]");
const strongOptions = document.querySelector("[data-strong-options]");
const quality = document.querySelector("[data-quality]");
const qualityValue = document.querySelector("[data-quality-value]");
const pageCount = document.querySelector("[data-page-count]");
const run = document.querySelector("[data-run]");
const resetButton = document.querySelector("[data-reset]");
const hint = document.querySelector("[data-run-hint]");
const progress = document.querySelector("[data-progress]");
const message = document.querySelector("[data-message]");
const result = document.querySelector("[data-result]");
const summary = document.querySelector("[data-result-summary]");
const download = document.querySelector("[data-download]");
let file = null;
let outputUrl = "";

initTheme();

function updateOptions() {
  strongOptions.hidden = mode.value !== "strong";
  qualityValue.value = `${quality.value}%`;
  qualityValue.textContent = `${quality.value}%`;
}

async function readPdf(selected) {
  file = selected[0];
  options.hidden = false;
  run.disabled = false;
  resetButton.hidden = false;
  result.hidden = true;
  clearMessage(message);
  hint.textContent = "Ready to compress.";
  pageCount.textContent = "";
  showProgress(progress, "Reading PDF", 0);
  try {
    await loadScript("/assets/vendor/pdf-lib-1.17.1.min.js");
    const source = await window.PDFLib.PDFDocument.load(await file.arrayBuffer());
    pageCount.textContent = `${source.getPageCount()} ${source.getPageCount() === 1 ? "page" : "pages"} found.`;
    progress.hidden = true;
  } catch {
    progress.hidden = true;
    run.disabled = true;
    showError(message, "This PDF is locked or could not be read. Remove its password and try again.");
  }
}

async function renderStrong(bytes, qualityNumber) {
  const pdfjs = await import("/assets/vendor/pdfjs-4.10.38.min.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc = "/assets/vendor/pdfjs-4.10.38.worker.min.mjs";
  const pdf = await pdfjs.getDocument({ data: bytes }).promise;
  const output = await window.PDFLib.PDFDocument.create();
  for (let index = 1; index <= pdf.numPages; index += 1) {
    showProgress(progress, `Rendering page ${index} of ${pdf.numPages}`, (index - 1) / pdf.numPages);
    const sourcePage = await pdf.getPage(index);
    const baseViewport = sourcePage.getViewport({ scale: 1 });
    const limit = Math.sqrt(16000000 / (baseViewport.width * baseViewport.height));
    const viewport = sourcePage.getViewport({ scale: Math.min(qualityNumber / 70, Math.max(0.5, limit)) });
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.floor(viewport.width));
    canvas.height = Math.max(1, Math.floor(viewport.height));
    await sourcePage.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;
    const imageBlob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", qualityNumber / 100));
    if (!imageBlob) throw new Error("Could not render a PDF page as an image.");
    const image = await output.embedJpg(await imageBlob.arrayBuffer());
    const outputPage = output.addPage([baseViewport.width, baseViewport.height]);
    outputPage.drawImage(image, { x: 0, y: 0, width: baseViewport.width, height: baseViewport.height });
    canvas.width = 0;
    canvas.height = 0;
    sourcePage.cleanup();
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
  showProgress(progress, "Saving compressed PDF", 0.95);
  return output.save({ useObjectStreams: true });
}

async function compress() {
  if (!file) return;
  run.disabled = true;
  clearMessage(message);
  try {
    const sourceBytes = new Uint8Array(await file.arrayBuffer());
    await loadScript("/assets/vendor/pdf-lib-1.17.1.min.js");
    let outputBytes;
    if (mode.value === "strong") {
      outputBytes = await renderStrong(sourceBytes, Number(quality.value));
    } else {
      showProgress(progress, "Rewriting PDF", 0.35);
      const source = await window.PDFLib.PDFDocument.load(sourceBytes);
      source.setTitle("");
      source.setAuthor("");
      source.setSubject("");
      source.setKeywords([]);
      source.setProducer("");
      source.setCreator("");
      outputBytes = await source.save({ useObjectStreams: true, addDefaultPage: false });
    }
    const smaller = outputBytes.length < sourceBytes.length;
    const outputBlob = new Blob([smaller ? outputBytes : sourceBytes], { type: "application/pdf" });
    if (!smaller) showWarning(message, "This file is already well compressed.");
    const saved = Math.max(0, sourceBytes.length - outputBlob.size);
    const percent = sourceBytes.length ? Math.round((saved / sourceBytes.length) * 100) : 0;
    summary.textContent = smaller ? `Saved ${formatSize(saved)} (${percent}% smaller). Output ${formatSize(outputBlob.size)}.` : `The original file is ${formatSize(outputBlob.size)}.`;
    if (outputUrl) URL.revokeObjectURL(outputUrl);
    outputUrl = URL.createObjectURL(outputBlob);
    download.href = outputUrl;
    download.download = "compressed.pdf";
    result.hidden = false;
    progress.hidden = true;
    resetButton.hidden = false;
  } catch (error) {
    progress.hidden = true;
    showError(message, error.message || "Could not compress this PDF. Try removing its password first.");
    run.disabled = false;
  }
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function reset() {
  file = null;
  input.value = "";
  options.hidden = true;
  result.hidden = true;
  progress.hidden = true;
  clearMessage(message);
  if (outputUrl) URL.revokeObjectURL(outputUrl);
  outputUrl = "";
  run.disabled = true;
  resetButton.hidden = true;
  hint.textContent = "Choose a PDF first.";
  pageCount.textContent = "";
}

initDropzone(dropzone, { accept: (item) => item.type === "application/pdf" || item.name.toLowerCase().endsWith(".pdf"), multiple: false, maxSizeMB: 100, onError: () => showError(message, "Compress PDF needs a PDF file. Choose a PDF and try again."), onFiles: readPdf });
mode.addEventListener("change", updateOptions);
quality.addEventListener("input", updateOptions);
run.addEventListener("click", compress);
resetButton.addEventListener("click", reset);
updateOptions();
