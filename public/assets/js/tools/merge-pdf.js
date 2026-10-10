import {
  clearMessage,
  formatBytes,
  initDropzone,
  initTheme,
  loadScript,
  renderFileList,
  showError,
  showProgress,
  showWarning
} from "/assets/common.js";

const dropzone = document.querySelector("[data-dropzone]");
const fileList = document.querySelector("[data-file-list]");
const mergeButton = document.querySelector("[data-merge]");
const resetButton = document.querySelector("[data-reset]");
const runHint = document.querySelector("[data-run-hint]");
const progress = document.querySelector("[data-progress]");
const message = document.querySelector("[data-message]");
const result = document.querySelector("[data-result]");
const resultSummary = document.querySelector("[data-result-summary]");
const download = document.querySelector("[data-download]");
let files = [];
let outputUrl = "";

initTheme();

function updateReadyState() {
  renderFileList(fileList, files, { onRemove: removeFile, onMove: moveFile });
  mergeButton.disabled = files.length < 2;
  runHint.textContent = files.length < 2 ? "Add at least 2 PDF files." : "Ready to merge in this order.";
  resetButton.hidden = files.length === 0 && result.hidden;
}

function removeFile(index) {
  files.splice(index, 1);
  clearMessage(message);
  updateReadyState();
}

function moveFile(from, to) {
  if (from === to || from < 0 || to < 0 || from >= files.length || to >= files.length) return;
  const [item] = files.splice(from, 1);
  files.splice(to, 0, item);
  updateReadyState();
}

function showFileError(error) {
  const text = String(error?.message || error || "");
  if (/encrypt|password|locked|decrypt/i.test(text)) return showError(message, "This PDF is locked. Remove its password and try again.");
  showError(message, "Merge PDF needs PDF files. For images, use JPG to PDF.");
}

async function readFiles(selectedFiles) {
  clearMessage(message);
  result.hidden = true;
  showProgress(progress, "Reading PDF files", 0);
  try {
    await loadScript("/assets/vendor/pdf-lib-1.17.1.min.js");
    for (let index = 0; index < selectedFiles.length; index += 1) {
      const file = selectedFiles[index];
      showProgress(progress, `Reading file ${index + 1} of ${selectedFiles.length}`, index / selectedFiles.length);
      const source = await window.PDFLib.PDFDocument.load(await file.arrayBuffer());
      files.push({ file, pages: source.getPageCount() });
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
    progress.hidden = true;
    updateReadyState();
  } catch (error) {
    progress.hidden = true;
    showFileError(error);
    updateReadyState();
  }
}

async function mergeFiles() {
  if (files.length < 2) return;
  mergeButton.disabled = true;
  resetButton.hidden = true;
  clearMessage(message);
  try {
    await loadScript("/assets/vendor/pdf-lib-1.17.1.min.js");
    const merged = await window.PDFLib.PDFDocument.create();
    let totalPages = 0;
    for (let index = 0; index < files.length; index += 1) {
      showProgress(progress, `Merging ${index + 1} of ${files.length}`, index / files.length);
      const source = await window.PDFLib.PDFDocument.load(await files[index].file.arrayBuffer());
      const pages = await merged.copyPages(source, source.getPageIndices());
      pages.forEach((page) => merged.addPage(page));
      totalPages += pages.length;
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
    showProgress(progress, `Merging ${files.length} of ${files.length}`, 1);
    const bytes = await merged.save();
    if (outputUrl) URL.revokeObjectURL(outputUrl);
    outputUrl = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
    download.href = outputUrl;
    resultSummary.textContent = `Done. ${totalPages} ${totalPages === 1 ? "page" : "pages"}, ${formatBytes(bytes.length)}.`;
    result.hidden = false;
    progress.hidden = true;
    resetButton.hidden = false;
  } catch (error) {
    progress.hidden = true;
    showFileError(error);
    mergeButton.disabled = false;
    resetButton.hidden = false;
  }
}

function reset() {
  files = [];
  dropzone.querySelector("input").value = "";
  if (outputUrl) URL.revokeObjectURL(outputUrl);
  outputUrl = "";
  result.hidden = true;
  progress.hidden = true;
  clearMessage(message);
  updateReadyState();
}

initDropzone(dropzone, {
  accept: (file) => file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf"),
  multiple: true,
  maxSizeMB: 100,
  onError: () => showError(message, "Merge PDF needs PDF files. For images, use JPG to PDF."),
  onSizeWarning: () => showWarning(message, "These files are over 100 MB in total. Your device may need more memory to merge them."),
  onFiles: readFiles
});
mergeButton.addEventListener("click", mergeFiles);
resetButton.addEventListener("click", reset);
updateReadyState();