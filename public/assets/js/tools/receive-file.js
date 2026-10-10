import { base64UrlToBytes, clearMessage, downloadBlob, formatBytes, getShareApiBase, initTheme, showError, showProgress } from "/assets/common.js";

const input = document.querySelector("[data-share-input]"), checkButton = document.querySelector("[data-check]"), resetButton = document.querySelector("[data-reset]"), message = document.querySelector("[data-message]"), progress = document.querySelector("[data-progress]"), details = document.querySelector("[data-details]"), sizeOutput = document.querySelector("[data-size]"), countdownOutput = document.querySelector("[data-countdown]"), passwordFields = document.querySelector("[data-password-fields]"), passwordInput = document.querySelector("[data-password]"), downloadButton = document.querySelector("[data-download]"), result = document.querySelector("[data-result]"), resultText = document.querySelector("[data-result-text]"), resetResult = document.querySelector("[data-reset-result]");
let fileState, countdownTimer;

initTheme();

function formatTime(milliseconds) { const seconds = Math.max(0, Math.ceil(milliseconds / 1000)); return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`; }
function startCountdown(expiry) { clearInterval(countdownTimer); const update = () => { const remaining = expiry - Date.now(); countdownOutput.textContent = formatTime(remaining); if (remaining <= 0) clearInterval(countdownTimer); }; update(); countdownTimer = setInterval(update, 1000); }
function parseInput() {
  const value = input.value.trim();
  if (/^\d{5}$/u.test(value)) return { code: value, mode: "quick" };
  try {
    const url = new URL(value, location.href); const id = url.searchParams.get("id") || url.pathname.match(/\/api\/meta\/([^/]+)$/u)?.[1];
    if (id && url.hash) return { id, mode: "link", fragment: url.hash.slice(1) };
  } catch { /* handled below */ }
  throw new Error("Enter a 5-digit code or the complete private link, including its # part.");
}
async function getMeta(state) { const response = await fetch(`${getShareApiBase()}/meta/${encodeURIComponent(state.code || state.id)}`); const data = await response.json().catch(() => ({})); if (!response.ok) throw new Error(data.error || "That file was not found or has expired."); return data; }
function resetView() { clearInterval(countdownTimer); fileState = null; details.hidden = true; passwordFields.hidden = true; passwordInput.value = ""; resetButton.hidden = true; result.hidden = true; input.value = ""; clearMessage(message); }
async function check() {
  checkButton.disabled = true; clearMessage(message); details.hidden = true;
  try { const state = parseInput(); const meta = await getMeta(state); fileState = { ...state, meta }; sizeOutput.textContent = formatBytes(meta.size); passwordFields.hidden = !meta.hasPassword; details.hidden = false; resetButton.hidden = false; startCountdown(meta.exp); }
  catch (error) { showError(message, error.message); }
  checkButton.disabled = false;
}
async function derivePasswordKey(password, salt) { const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]); return crypto.subtle.deriveKey({ name: "PBKDF2", salt, iterations: 210000, hash: "SHA-256" }, material, { name: "AES-GCM", length: 256 }, false, ["decrypt"]); }
async function decryptQuick(bytes, password) { if (bytes.length < 29) throw new Error("The encrypted file is incomplete."); const key = await derivePasswordKey(password, bytes.slice(0, 16)); return new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv: bytes.slice(16, 28) }, key, bytes.slice(28))); }
async function decryptLink(bytes, fragment, password) {
  const parts = new URLSearchParams(fragment); let keyBytes, payload;
  if (parts.has("k")) { keyBytes = base64UrlToBytes(parts.get("k")); payload = bytes; }
  else if (parts.has("p")) { if (!password) throw new Error("Enter the password for this link."); const values = parts.get("p").split("."); if (values.length !== 3) throw new Error("This private link is incomplete."); const salt = base64UrlToBytes(values[0]), wrapIv = base64UrlToBytes(values[1]), wrapped = base64UrlToBytes(values[2]); const passwordKey = await derivePasswordKey(password, salt); keyBytes = new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv: wrapIv }, passwordKey, wrapped)); payload = bytes.slice(28 + wrapped.length); }
  else throw new Error("This private link has no decryption key.");
  if (keyBytes.length !== 32 || payload.length < 13) throw new Error("This private link is invalid."); const fileKey = await crypto.subtle.importKey("raw", keyBytes, { name: "AES-GCM" }, false, ["decrypt"]); return new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv: payload.slice(0, 12) }, fileKey, payload.slice(12)));
}
async function download() {
  if (!fileState) return; downloadButton.disabled = true; clearMessage(message); showProgress(progress, "Downloading encrypted file...", 0.2);
  try {
    const response = await fetch(`${getShareApiBase()}/download`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(fileState.mode === "quick" ? { code: fileState.code } : { id: fileState.id }) }); const bytes = new Uint8Array(await response.arrayBuffer());
    if (!response.ok) { let error = "The file could not be downloaded."; try { error = JSON.parse(new TextDecoder().decode(bytes)).error || error; } catch { /* binary response */ } throw new Error(error); }
    showProgress(progress, "Decrypting in your browser...", 0.75); let plain = bytes; if (fileState.mode === "quick" && fileState.meta.hasPassword) plain = await decryptQuick(bytes, passwordInput.value); if (fileState.mode === "link") plain = await decryptLink(bytes, fileState.fragment, passwordInput.value); const encodedName = response.headers.get("X-Share-Name"); let filename = "shared-file"; try { filename = encodedName ? decodeURIComponent(encodedName) : filename; } catch { /* use fallback */ } downloadBlob(new Blob([plain], { type: "application/octet-stream" }), filename); resultText.textContent = `Downloaded ${filename}.`; result.hidden = false; details.hidden = true;
  } catch (error) { showError(message, error.name === "OperationError" ? "The password is wrong or the file is damaged." : error.message); }
  progress.hidden = true; downloadButton.disabled = false;
}
checkButton.addEventListener("click", check); downloadButton.addEventListener("click", download); resetButton.addEventListener("click", resetView); resetResult.addEventListener("click", resetView); input.addEventListener("keydown", (event) => { if (event.key === "Enter") check(); });
const linkId = new URLSearchParams(location.search).get("id"); if (linkId && location.hash) { input.value = location.href; check(); }