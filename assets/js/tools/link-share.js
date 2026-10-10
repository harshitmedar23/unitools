import { base64UrlToBytes, bytesToBase64Url, clearMessage, copyText, formatBytes, getShareApiBase, initDropzone, initTheme, loadScript, showError, showProgress } from "/assets/common.js";

const dropzone = document.querySelector("[data-dropzone]"), fileInput = document.querySelector("[data-file]"), fileName = document.querySelector("[data-file-name]"), expiryInput = document.querySelector("[data-expiry]"), downloadLimit = document.querySelector("[data-download-limit]"), passwordToggle = document.querySelector("[data-password-toggle]"), passwordFields = document.querySelector("[data-password-fields]"), passwordInput = document.querySelector("[data-password]"), uploadButton = document.querySelector("[data-upload]"), resetButton = document.querySelector("[data-reset]"), hint = document.querySelector("[data-hint]"), progress = document.querySelector("[data-progress]"), message = document.querySelector("[data-message]"), result = document.querySelector("[data-result]"), linkOutput = document.querySelector("[data-link]"), countdownOutput = document.querySelector("[data-countdown]"), linkIdOutput = document.querySelector("[data-link-id]"), copyButton = document.querySelector("[data-copy]"), qrButton = document.querySelector("[data-qr]"), qrPreview = document.querySelector("[data-qr-preview]"), deleteButton = document.querySelector("[data-delete]");
const maxBytes = 50 * 1024 * 1024;
let file, deleteToken, countdownTimer;

initTheme();

function formatTime(milliseconds) { const seconds = Math.max(0, Math.ceil(milliseconds / 1000)); return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`; }
function startCountdown(expiry) { clearInterval(countdownTimer); const update = () => { const remaining = expiry - Date.now(); countdownOutput.textContent = formatTime(remaining); if (remaining <= 0) { clearInterval(countdownTimer); hint.textContent = "This link has expired."; } }; update(); countdownTimer = setInterval(update, 1000); }
async function derivePasswordKey(password, salt) { const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]); return crypto.subtle.deriveKey({ name: "PBKDF2", salt, iterations: 210000, hash: "SHA-256" }, material, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]); }
async function makePayload(value) {
  const fileKeyBytes = crypto.getRandomValues(new Uint8Array(32));
  const fileKey = await crypto.subtle.importKey("raw", fileKeyBytes, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
  const fileIv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: fileIv }, fileKey, value));
  const payload = new Uint8Array(fileIv.length + ciphertext.length); payload.set(fileIv); payload.set(ciphertext, fileIv.length);
  if (!passwordToggle.checked) return { payload, fragment: `k=${bytesToBase64Url(fileKeyBytes)}` };
  if (passwordInput.value.length < 8) throw new Error("Use a password with at least 8 characters, or turn password protection off.");
  const salt = crypto.getRandomValues(new Uint8Array(16)); const wrapIv = crypto.getRandomValues(new Uint8Array(12)); const passwordKey = await derivePasswordKey(passwordInput.value, salt); const wrapped = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: wrapIv }, passwordKey, fileKeyBytes));
  return { payload: new Uint8Array([...salt, ...wrapIv, ...wrapped, ...payload]), fragment: `p=${bytesToBase64Url(salt)}.${bytesToBase64Url(wrapIv)}.${bytesToBase64Url(wrapped)}` };
}
async function upload() {
  if (!file) return;
  if (file.size > maxBytes) { showError(message, "That file is over 50 MB. Choose a smaller one."); return; }
  uploadButton.disabled = true; clearMessage(message); showProgress(progress, "Encrypting the file in your browser...", 0.25);
  try {
    const encrypted = await makePayload(new Uint8Array(await file.arrayBuffer())); showProgress(progress, "Uploading encrypted file...", 0.7);
    const response = await fetch(`${getShareApiBase()}/upload`, { method: "POST", headers: { "Content-Type": "application/octet-stream", "X-Share-Mode": "link", "X-Share-Expiry": expiryInput.value, "X-Share-Password": String(passwordToggle.checked), "X-Share-Downloads": downloadLimit.value, "X-File-Name": encodeURIComponent(file.name) }, body: encrypted.payload });
    const data = await response.json().catch(() => ({})); if (!response.ok) throw new Error(data.error || "The upload could not be completed. Try again.");
    deleteToken = data.deleteToken; const shareUrl = new URL("/tools/receive-file.html", location.origin); shareUrl.searchParams.set("id", data.id); shareUrl.hash = encrypted.fragment; linkOutput.value = shareUrl.href; linkIdOutput.textContent = data.id; result.hidden = false; resetButton.hidden = false; dropzone.hidden = true; hint.textContent = `Uploaded ${formatBytes(file.size)}.`; startCountdown(Date.now() + Number(expiryInput.value) * 60 * 1000);
  } catch (error) { showError(message, error.message); uploadButton.disabled = false; }
  progress.hidden = true;
}
function setFile(selected) { file = selected[0]; if (!file) return; if (file.size > maxBytes) { file = null; uploadButton.disabled = true; showError(message, "That file is over 50 MB. Choose a smaller one."); return; } clearMessage(message); fileName.textContent = `${file.name} - ${formatBytes(file.size)}`; uploadButton.disabled = false; hint.textContent = "Ready to encrypt and upload."; }
function reset() { clearInterval(countdownTimer); file = null; deleteToken = null; fileInput.value = ""; dropzone.hidden = false; result.hidden = true; resetButton.hidden = true; uploadButton.disabled = true; passwordToggle.checked = false; passwordFields.hidden = true; passwordInput.value = ""; qrPreview.hidden = true; qrPreview.replaceChildren(); hint.textContent = "Choose a file to begin."; fileName.textContent = ""; clearMessage(message); }
initDropzone(dropzone, { maxSizeMB: 50, onFiles: setFile, onError: (error) => showError(message, error) });
passwordToggle.addEventListener("change", () => { passwordFields.hidden = !passwordToggle.checked; if (!passwordToggle.checked) passwordInput.value = ""; }); uploadButton.addEventListener("click", upload); resetButton.addEventListener("click", reset);
copyButton.addEventListener("click", async () => { try { await copyText(linkOutput.value); copyButton.textContent = "Copied"; setTimeout(() => { copyButton.textContent = "Copy link"; }, 1200); } catch { showError(message, "Could not copy automatically. Select the link and copy it manually."); } });
qrButton.addEventListener("click", async () => { qrPreview.hidden = false; qrPreview.textContent = "Loading local QR code generator..."; try { await loadScript("/assets/vendor/qrcode-generator-1.4.4.js"); const qr = window.qrcode(0, "M"); qr.addData(linkOutput.value); qr.make(); qrPreview.innerHTML = qr.createSvgTag({ scalable: true, margin: 2 }); } catch { qrPreview.textContent = "QR is unavailable in this build. Copy the link instead."; } });
deleteButton.addEventListener("click", async () => { if (!deleteToken || !linkIdOutput.textContent) return; deleteButton.disabled = true; try { const response = await fetch(`${getShareApiBase()}/file/${encodeURIComponent(linkIdOutput.textContent)}`, { method: "DELETE", headers: { "X-Delete-Token": deleteToken } }); if (!response.ok) throw new Error("The file could not be deleted yet."); hint.textContent = "The file was deleted."; clearInterval(countdownTimer); } catch (error) { showError(message, error.message); deleteButton.disabled = false; } });