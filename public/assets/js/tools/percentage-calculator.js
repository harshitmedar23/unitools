import { clearMessage, formatNumberIN, initTheme, showError } from "/assets/common.js";
const mode = document.querySelector("#mode");
const xInput = document.querySelector("#x");
const yInput = document.querySelector("#y");
const direction = document.querySelector("#direction");
const directionField = document.querySelector("[data-direction-field]");
const xLabel = document.querySelector("[data-x-label]");
const yLabel = document.querySelector("[data-y-label]");
const result = document.querySelector("[data-result]");
const working = document.querySelector("[data-working]");
const message = document.querySelector("[data-message]");
const reset = document.querySelector("[data-reset]");
initTheme();
function number(input) { return input.value.trim() === "" ? null : Number(input.value); }
function fmt(value) { return Number.isFinite(value) ? formatNumberIN(Number(value.toFixed(2))) : "—"; }
function updateLabels() {
  const value = mode.value;
  directionField.hidden = value !== "adjust";
  xLabel.textContent = value === "of" || value === "is" ? "X (%)" : value === "change" ? "From X" : "X (%)";
  yLabel.textContent = value === "change" ? "To Y" : "Y";
}
function update() {
  updateLabels(); clearMessage(message); result.textContent = "—"; working.textContent = "";
  const x = number(xInput); const y = number(yInput);
  if (x === null || y === null || !Number.isFinite(x) || !Number.isFinite(y)) return;
  let value; let formula;
  if (mode.value === "of") { value = x * y / 100; formula = `${x}% × ${y} = ${fmt(value)}`; }
  if (mode.value === "is") { if (y === 0) return showError(message, "Y must not be zero for a percentage ratio."); value = x / y * 100; formula = `${x} ÷ ${y} × 100 = ${fmt(value)}%`; }
  if (mode.value === "change") { if (x === 0) return showError(message, "From X must not be zero for percentage change."); value = (y - x) / Math.abs(x) * 100; formula = `(${y} − ${x}) ÷ |${x}| × 100 = ${fmt(value)}%`; }
  if (mode.value === "adjust") { value = direction.value === "increase" ? y * (1 + x / 100) : y * (1 - x / 100); formula = `${y} ${direction.value === "increase" ? "×" : "×"} ${direction.value === "increase" ? `(1 + ${x}/100)` : `(1 − ${x}/100)`} = ${fmt(value)}`; }
  if (!Number.isFinite(value)) return showError(message, "Those values are too large to calculate safely.");
  result.textContent = mode.value === "is" || mode.value === "change" ? `${fmt(value)}%` : fmt(value);
  working.textContent = `Formula: ${formula}`;
}
[mode, xInput, yInput, direction].forEach((element) => element.addEventListener("input", update));
reset.addEventListener("click", () => { xInput.value = ""; yInput.value = ""; mode.value = "of"; direction.value = "increase"; update(); xInput.focus(); });
update();
