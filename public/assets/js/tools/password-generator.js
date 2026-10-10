import { initTheme } from "/assets/common.js";

const modeButtons = document.querySelectorAll("[data-mode]");
const passwordOptions = document.querySelector("[data-password-options]");
const passphraseOptions = document.querySelector("[data-passphrase-options]");
const length = document.querySelector("[data-length]");
const lengthValue = document.querySelector("[data-length-value]");
const wordCount = document.querySelector("[data-word-count]");
const wordCountValue = document.querySelector("[data-word-count-value]");
const generated = document.querySelector("[data-generated]");
const copy = document.querySelector("[data-copy]");
const entropy = document.querySelector("[data-entropy]");
const generateButton = document.querySelector("[data-generate]");
const resetButton = document.querySelector("[data-reset]");
const message = document.querySelector("[data-message]");
let currentMode = "password";
let wordListPromise;
const sets = { lower: "abcdefghijklmnopqrstuvwxyz", upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ", numbers: "0123456789", symbols: "!@#$%^&*()-_=+[]{}:;,.?/" };

initTheme();

function randomIndex(max) {
  const limit = Math.floor(0x100000000 / max) * max;
  const values = new Uint32Array(1);
  do { crypto.getRandomValues(values); } while (values[0] >= limit);
  return values[0] % max;
}
function randomCharacter(pool) { return pool[randomIndex(pool.length)]; }
function getWordList() {
  if (!wordListPromise) wordListPromise = fetch("/assets/vendor/eff-short-wordlist-1.txt").then((response) => { if (!response.ok) throw new Error("Could not load the local passphrase word list."); return response.text(); }).then((text) => text.split(/\r?\n/u).map((line) => line.replace(/^\d+\s+/u, "").trim()).filter(Boolean));
  return wordListPromise;
}
function setMode(nextMode) {
  currentMode = nextMode;
  modeButtons.forEach((button) => { const active = button.dataset.mode === nextMode; button.classList.toggle("is-active", active); button.setAttribute("aria-selected", String(active)); });
  passwordOptions.hidden = nextMode !== "password";
  passphraseOptions.hidden = nextMode !== "passphrase";
  generateButton.textContent = nextMode === "password" ? "Generate password" : "Generate passphrase";
  generate();
}
function password() {
  const selected = Object.entries(sets).filter(([key]) => document.querySelector(`[data-set="${key}"]`).checked).map(([, value]) => value);
  if (!selected.length) throw new Error("Choose at least one character set.");
  let pool = selected.join("");
  if (document.querySelector("[data-exclude]").checked) pool = [...pool].filter((character) => !"O0Il1".includes(character)).join("");
  if (!pool) throw new Error("The selected options leave no usable characters.");
  const characters = selected.map((set) => randomCharacter([...set].filter((character) => !document.querySelector("[data-exclude]").checked || !"O0Il1".includes(character)).join("")));
  while (characters.length < Number(length.value)) characters.push(randomCharacter(pool));
  for (let index = characters.length - 1; index > 0; index -= 1) { const other = randomIndex(index + 1); [characters[index], characters[other]] = [characters[other], characters[index]]; }
  entropy.textContent = `Entropy: ${Math.floor(Number(length.value) * Math.log2(pool.length))} bits`;
  return characters.join("");
}
async function passphrase() {
  const list = await getWordList();
  const count = Number(wordCount.value);
  const result = Array.from({ length: count }, () => list[randomIndex(list.length)]).join("-");
  entropy.textContent = `Entropy: ${Math.floor(count * Math.log2(list.length))} bits`;
  return result;
}
async function generate() {
  clearMessage();
  try { generated.value = currentMode === "password" ? password() : await passphrase(); } catch (error) { generated.value = ""; showMessage(error.message); }
}
function clearMessage() { message.textContent = ""; message.hidden = true; }
function showMessage(value) { message.className = "message message-error"; message.textContent = `Error: ${value}`; message.hidden = false; }
modeButtons.forEach((button) => button.addEventListener("click", () => setMode(button.dataset.mode)));
length.addEventListener("input", () => { lengthValue.textContent = length.value; if (currentMode === "password") generate(); });
wordCount.addEventListener("input", () => { wordCountValue.textContent = wordCount.value; if (currentMode === "passphrase") generate(); });
document.querySelectorAll("[data-set], [data-exclude]").forEach((control) => control.addEventListener("change", generate));
generateButton.addEventListener("click", generate);
copy.addEventListener("click", async () => { if (!generated.value) return; try { await navigator.clipboard.writeText(generated.value); copy.textContent = "Copied"; setTimeout(() => { copy.textContent = "Copy"; }, 1200); } catch { showMessage("Could not copy automatically. Select the result and copy it manually."); } });
resetButton.addEventListener("click", () => { length.value = "16"; lengthValue.textContent = "16"; wordCount.value = "6"; wordCountValue.textContent = "6"; document.querySelectorAll("[data-set]").forEach((control) => { control.checked = true; }); document.querySelector("[data-exclude]").checked = true; setMode("password"); });
setMode("password");
