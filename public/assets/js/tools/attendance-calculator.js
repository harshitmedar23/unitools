import { clearMessage, formatNumberIN, initTheme, showError } from "/assets/common.js";
const attendedInput = document.querySelector("#attended"); const totalInput = document.querySelector("#total"); const targetInput = document.querySelector("#target"); const current = document.querySelector("[data-current]"); const action = document.querySelector("[data-action]"); const actionLabel = document.querySelector("[data-action-label]"); const working = document.querySelector("[data-working]"); const message = document.querySelector("[data-message]"); const reset = document.querySelector("[data-reset]");
initTheme();
function valueOf(input) { return input.value.trim() === "" ? null : Number(input.value); }
function update() {
  clearMessage(message); current.textContent = action.textContent = "—"; working.textContent = "";
  const attended = valueOf(attendedInput); const total = valueOf(totalInput); const target = valueOf(targetInput);
  if ([attended, total, target].some((value) => value === null)) return;
  if (![attended, total, target].every(Number.isFinite) || !Number.isInteger(attended) || !Number.isInteger(total) || attended < 0 || total < 0 || attended > total || target < 0 || target > 100) return showError(message, "Enter valid whole class counts and a target between 0% and 100%.");
  if (total === 0) return showError(message, "Enter at least one total class to calculate attendance.");
  const percentage = attended / total * 100; current.textContent = `${percentage.toFixed(2)}%`;
  if (percentage < target) {
    actionLabel.textContent = "Classes to attend in a row";
    const needed = target === 100 ? total - attended : Math.max(0, Math.ceil((target * total - 100 * attended) / (100 - target)));
    action.textContent = formatNumberIN(needed); working.textContent = `Needed = ceil((${target} × ${total} − 100 × ${attended}) ÷ (100 − ${target})) = ${needed}`;
  } else {
    actionLabel.textContent = "Classes you can miss";
    const canMiss = target === 0 ? 0 : Math.max(0, Math.floor((100 * attended - target * total) / target));
    action.textContent = formatNumberIN(canMiss); working.textContent = `Can miss = floor((100 × ${attended} − ${target} × ${total}) ÷ ${target || "target"}) = ${canMiss}`;
  }
}
[attendedInput, totalInput, targetInput].forEach((element) => element.addEventListener("input", update));
reset.addEventListener("click", () => { attendedInput.value = ""; totalInput.value = ""; targetInput.value = "75"; update(); attendedInput.focus(); });
update();
