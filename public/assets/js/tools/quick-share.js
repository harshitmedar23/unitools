import { bytesToBase64Url, clearMessage, copyText, formatBytes, getShareApiBase, initDropzone, initTheme, showError, showProgress } from "/assets/common.js";

const fileInput = document.querySelector("[data-file]");
const dropzone = document.querySelector("[data-dropzone]");
const fileName = document.querySelector("[data-file-name]");
const passwordToggle = document.querySelector("[data-password-toggle]");
const passwordFields = document.querySelector("[data-password-fields]");
const passwordInput = document.querySelector("[data-password]");
const uploadButton = document.querySelector("[data-upload]");
const resetButton = document.querySelector("[data-reset]");
const hint = document.querySelector("[data-hint]");
const progress = document.querySelector("[data-progress]");
const message = document.querySelector("[data-message]");
const result = document.querySelector("[data-result]");
const codeOutput = document.querySelector("[data-code]");
const countdownOutput = document.querySelector("[data-countdown]");
const copyButton = document.querySelector("[data-copy]");
const maxBytes = 50 * 1024 * 1024;
let file;
let countdownTimer;

initTheme();

function formatTime(milliseconds) {
  const seconds = Math.max(0, Math.ceil(milliseconds / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

function startCountdown(expiry) {
  clearInterval(countdownTimer);
  const update = () => {
    const remaining = expiry - Date.now();
    countdownOutput.textContent = formatTime(remaining);
    if (remaining <= 0) { clearInterval(countdownTimer); hint.textContent = "This code has expired."; }
  };
  update();
  countdownTimer = setInterval(update, 1000);
}

async function derivePasswordKey(password, salt) {
  const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey({ name: "PBKDF2", salt, iterations: 210000, hash: "SHA-256" }, material, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
}

async function encryptWithPassword(value, password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await derivePasswordKey(password, salt);
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, value));
  const packed = new Uint8Array(salt.length + iv.length + ciphertext.length);
  packed.set(salt, 0); packed.set(iv, salt.length); packed.set(ciphertext, salt.length + iv.length);
  return packed;
}

async function upload() {
  if (!file) return;
  if (file.size > maxBytes) { showError(message, "That file is over 50 MB. Choose a smaller one."); return; }
  if (passwordToggle.checked && passwordInput.value.length < 8) { showError(message, "Use a password with at least 8 characters, or turn password protection off."); return; }
  uploadButton.disabled = true; clearMessage(message); showProgress(progress, "Preparing the file...", 0.2);
  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const body = passwordToggle.checked ? await encryptWithPassword(bytes, passwordInput.value) : bytes;
    showProgress(progress, "Uploading 1 file...", 0.6);
    const response = await fetch(`${getShareApiBase()}/upload`, { method: "POST", headers: { "Content-Type": "application/octet-stream", "X-Share-Mode": "quick", "X-Share-Password": String(passwordToggle.checked), "X-File-Name": encodeURIComponent(file.name) }, body });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "The upload could not be completed. Try again.");
    codeOutput.textContent = data.code;
    result.hidden = false; resetButton.hidden = false; dropzone.hidden = true; fileName.textContent = ""; hint.textContent = `Uploaded ${formatBytes(file.size)}.`;
    startCountdown(Date.now() + 10 * 60 * 1000);
  } catch (error) { showError(message, error.message); uploadButton.disabled = false; }
  progress.hidden = true;
}

function setFile(selected) {
  file = selected[0];
  if (!file) return;
  if (file.size > maxBytes) { file = null; uploadButton.disabled = true; showError(message, "That file is over 50 MB. Choose a smaller one."); return; }
  clearMessage(message); fileName.textContent = `${file.name} - ${formatBytes(file.size)}`; uploadButton.disabled = false; hint.textContent = "Ready to upload.";
}

function reset() {
  clearInterval(countdownTimer); file = null; fileInput.value = ""; dropzone.hidden = false; result.hidden = true; resetButton.hidden = true; uploadButton.disabled = true; passwordToggle.checked = false; passwordFields.hidden = true; passwordInput.value = ""; hint.textContent = "Choose a file to begin."; fileName.textContent = ""; clearMessage(message);
}

initDropzone(dropzone, { maxSizeMB: 50, onFiles: setFile, onError: (error) => showError(message, error) });
passwordToggle.addEventListener("change", () => { passwordFields.hidden = !passwordToggle.checked; if (!passwordToggle.checked) passwordInput.value = ""; });
uploadButton.addEventListener("click", upload);
resetButton.addEventListener("click", reset);
copyButton.addEventListener("click", async () => { try { await copyText(codeOutput.textContent); copyButton.textContent = "Copied"; setTimeout(() => { copyButton.textContent = "Copy code"; }, 1200); } catch { showError(message, "Could not copy automatically. Select the code and copy it manually."); } });