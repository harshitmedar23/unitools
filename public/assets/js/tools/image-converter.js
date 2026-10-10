import { clearMessage, initDropzone, initTheme, loadScript, showError, showProgress, showWarning } from "/assets/common.js";

const dropzone = document.querySelector("[data-dropzone]");
const input = dropzone.querySelector("input");
const fileList = document.querySelector("[data-file-list]");
const options = document.querySelector("[data-options]");
const format = document.querySelector("[data-format]");
const quality = document.querySelector("[data-quality]");
const qualityValue = document.querySelector("[data-quality-value]");
const qualityWrap = document.querySelector("[data-quality-wrap]");
const run = document.querySelector("[data-run]");
const resetButton = document.querySelector("[data-reset]");
const hint = document.querySelector("[data-run-hint]");
const progress = document.querySelector("[data-progress]");
const message = document.querySelector("[data-message]");
const result = document.querySelector("[data-result]");
const summary = document.querySelector("[data-result-summary]");
const downloads = document.querySelector("[data-downloads]");
let files = [];
let urls = [];

initTheme();

function extensionFor(type) { return type === "image/jpeg" ? "jpg" : type === "image/png" ? "png" : "webp"; }
function baseName(name) { return name.replace(/\.[^.]+$/, "") || "converted-image"; }
function updateOptions() { qualityWrap.hidden = format.value === "image/png"; qualityValue.textContent = `${quality.value}%`; }
function renderFiles() {
  fileList.replaceChildren();
  files.forEach((file) => { const row = document.createElement("li"); row.className = "file-row"; const name = document.createElement("span"); name.className = "file-row-name"; name.textContent = file.name; const details = document.createElement("span"); details.className = "file-row-details"; details.textContent = `${Math.round(file.size / 1024)} KB`; row.append(name, details); fileList.append(row); });
  fileList.hidden = files.length === 0;
}
function read(selected) {
  files = selected;
  renderFiles();
  options.hidden = false;
  run.disabled = files.length === 0;
  resetButton.hidden = false;
  result.hidden = true;
  clearMessage(message);
  hint.textContent = `${files.length} ${files.length === 1 ? "image" : "images"} ready.`;
}
function imageBitmap(file) { return createImageBitmap(file); }
async function convertOne(file, type) {
  const bitmap = await imageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const context = canvas.getContext("2d");
  if (type === "image/jpeg") { context.fillStyle = "white"; context.fillRect(0, 0, canvas.width, canvas.height); }
  context.drawImage(bitmap, 0, 0);
  bitmap.close();
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, type, Number(quality.value) / 100));
  canvas.width = 0;
  canvas.height = 0;
  if (!blob) throw new Error(type === "image/webp" ? "This browser cannot create WebP files. Choose JPG or PNG." : "Could not convert this image.");
  return blob;
}
async function convert() {
  run.disabled = true;
  clearMessage(message);
  downloads.replaceChildren();
  urls.forEach((url) => URL.revokeObjectURL(url));
  urls = [];
  try {
    const type = format.value;
    const extension = extensionFor(type);
    const outputs = [];
    for (let index = 0; index < files.length; index += 1) { showProgress(progress, `Converting image ${index + 1} of ${files.length}`, index / files.length); outputs.push({ name: `${baseName(files[index].name)}.${extension}`, blob: await convertOne(files[index], type) }); await new Promise((resolve) => setTimeout(resolve, 0)); }
    if (outputs.length === 1) {
      const url = URL.createObjectURL(outputs[0].blob); urls.push(url); const link = document.createElement("a"); link.className = "button button-primary"; link.href = url; link.download = outputs[0].name; link.textContent = `Download ${outputs[0].name}`; downloads.append(link); summary.textContent = `Done. ${outputs[0].name}, ${Math.round(outputs[0].blob.size / 1024)} KB.`;
    } else {
      await loadScript("/assets/vendor/fflate-0.8.2.min.js");
      const archive = {}; for (const output of outputs) archive[output.name] = new Uint8Array(await output.blob.arrayBuffer());
      const zipBlob = new Blob([window.fflate.zipSync(archive)], { type: "application/zip" }); const url = URL.createObjectURL(zipBlob); urls.push(url); const link = document.createElement("a"); link.className = "button button-primary"; link.href = url; link.download = "converted-images.zip"; link.textContent = "Download converted-images.zip"; downloads.append(link); summary.textContent = `Done. ${outputs.length} images in a ZIP, ${Math.round(zipBlob.size / 1024)} KB.`;
    }
    if (type === "image/jpeg" && files.some((file) => file.type === "image/png")) showWarning(message, "PNG transparency was filled with white in the JPG output.");
    result.hidden = false;
    progress.hidden = true;
    resetButton.hidden = false;
  } catch (error) { progress.hidden = true; showError(message, error.message || "Could not convert this image. Try saving it as JPG first."); run.disabled = false; }
}
function reset() { files = []; input.value = ""; renderFiles(); options.hidden = true; result.hidden = true; progress.hidden = true; clearMessage(message); urls.forEach((url) => URL.revokeObjectURL(url)); urls = []; downloads.replaceChildren(); run.disabled = true; resetButton.hidden = true; hint.textContent = "Choose one or more images first."; }
initDropzone(dropzone, { accept: (item) => ["image/jpeg", "image/png", "image/webp"].includes(item.type), multiple: true, maxSizeMB: 25, onError: () => showError(message, "Image converter needs JPG, PNG or WebP files. Choose a supported image."), onFiles: read });
format.addEventListener("change", updateOptions); quality.addEventListener("input", updateOptions); run.addEventListener("click", convert); resetButton.addEventListener("click", reset); updateOptions();
