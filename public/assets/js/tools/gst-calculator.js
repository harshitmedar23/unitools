import { clearMessage, formatNumberIN, initTheme, showError } from "/assets/common.js";
const amountInput = document.querySelector("#amount"); const rateSelect = document.querySelector("#rate"); const customRate = document.querySelector("#custom-rate"); const amountLabel = document.querySelector("[data-amount-label]"); const outputs = { net: document.querySelector("[data-net]"), gst: document.querySelector("[data-gst]"), gross: document.querySelector("[data-gross]"), cgst: document.querySelector("[data-cgst]"), sgst: document.querySelector("[data-sgst]") }; const working = document.querySelector("[data-working]"); const message = document.querySelector("[data-message]"); const reset = document.querySelector("[data-reset]"); const tabs = [...document.querySelectorAll("[data-mode]")];
let calculationMode = "add";
initTheme();
function money(value) { return Number.isFinite(value) ? `₹${formatNumberIN(Number(value.toFixed(2)))}` : "—"; }
function selectedRate() { return customRate.value.trim() === "" ? Number(rateSelect.value) : Number(customRate.value); }
function updateLabel() { amountLabel.textContent = calculationMode === "add" ? "Net amount (₹)" : "Gross amount (₹)"; }
function update() {
  updateLabel(); clearMessage(message); Object.values(outputs).forEach((output) => { output.textContent = "—"; }); working.textContent = "";
  const amount = amountInput.value.trim() === "" ? null : Number(amountInput.value); const rate = selectedRate();
  if (amount === null || rateSelect.value === "" && customRate.value.trim() === "") return;
  if (!Number.isFinite(amount) || !Number.isFinite(rate) || amount < 0 || rate < 0) return showError(message, "Enter an amount and a GST rate of zero or more.");
  const net = calculationMode === "add" ? amount : amount / (1 + rate / 100); const gross = calculationMode === "add" ? amount * (1 + rate / 100) : amount; const gst = gross - net; const half = gst / 2;
  if (![net, gross, gst, half].every(Number.isFinite)) return showError(message, "Those values are too large to calculate safely.");
  outputs.net.textContent = money(net); outputs.gst.textContent = money(gst); outputs.gross.textContent = money(gross); outputs.cgst.textContent = money(half); outputs.sgst.textContent = money(half);
  working.textContent = calculationMode === "add" ? `Gross = net × (1 + rate ÷ 100)\n${money(gross)} = ${money(amount)} × (1 + ${rate} ÷ 100)` : `Net = gross ÷ (1 + rate ÷ 100)\n${money(net)} = ${money(amount)} ÷ (1 + ${rate} ÷ 100)`;
}
fetch("/assets/data/gst-rates.json").then((response) => response.json()).then((data) => { (data.rates || []).forEach((rate) => { const value = typeof rate === "object" ? rate.value : rate; const label = typeof rate === "object" ? rate.name || `${value}%` : `${value}%`; const option = document.createElement("option"); option.value = value; option.textContent = `${label}${data.verify ? " (verify)" : ""}`; rateSelect.append(option); }); }).catch(() => showError(message, "Could not read the local GST rate data. Enter a custom rate."));
tabs.forEach((tab) => tab.addEventListener("click", () => { calculationMode = tab.dataset.mode; tabs.forEach((item) => { const active = item === tab; item.classList.toggle("is-active", active); item.setAttribute("aria-selected", String(active)); }); update(); }));
[amountInput, rateSelect, customRate].forEach((element) => element.addEventListener("input", update));
reset.addEventListener("click", () => { amountInput.value = ""; rateSelect.value = ""; customRate.value = ""; update(); amountInput.focus(); });
update();
