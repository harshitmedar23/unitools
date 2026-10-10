import { clearMessage, formatNumberIN, initTheme, showError } from "/assets/common.js";
const principalInput = document.querySelector("#principal"); const rateInput = document.querySelector("#rate"); const tenureInput = document.querySelector("#tenure"); const unitInput = document.querySelector("#unit");
const emiOutput = document.querySelector("[data-emi]"); const interestOutput = document.querySelector("[data-interest]"); const paymentOutput = document.querySelector("[data-payment]"); const working = document.querySelector("[data-working]"); const schedule = document.querySelector("[data-schedule]"); const bar = document.querySelector("[data-principal-bar]"); const barLabel = document.querySelector("[data-bar-label]"); const message = document.querySelector("[data-message]"); const reset = document.querySelector("[data-reset]");
initTheme();
function valueOf(input) { return input.value.trim() === "" ? null : Number(input.value); }
function money(value) { return Number.isFinite(value) ? `₹${formatNumberIN(Number(value.toFixed(2)))}` : "—"; }
function update() {
  clearMessage(message); schedule.replaceChildren(); emiOutput.textContent = interestOutput.textContent = paymentOutput.textContent = "—"; working.textContent = ""; bar.style.width = "0%"; barLabel.textContent = "";
  const principal = valueOf(principalInput); const rate = valueOf(rateInput); const tenure = valueOf(tenureInput);
  if ([principal, rate, tenure].some((value) => value === null)) return;
  if (![principal, rate, tenure].every(Number.isFinite) || principal <= 0 || rate < 0 || tenure <= 0) return showError(message, "Enter a positive principal and tenure, with a rate of zero or more.");
  const months = unitInput.value === "years" ? Math.round(tenure * 12) : Math.round(tenure);
  if (months < 1 || months > 1200) return showError(message, "Tenure must be between 1 and 1,200 months.");
  const monthlyRate = rate / 12 / 100;
  const emi = monthlyRate === 0 ? principal / months : principal * monthlyRate * (1 + monthlyRate) ** months / ((1 + monthlyRate) ** months - 1);
  const totalPayment = emi * months; const totalInterest = totalPayment - principal;
  if (![emi, totalPayment, totalInterest].every(Number.isFinite)) return showError(message, "Those values are too large to calculate safely.");
  emiOutput.textContent = money(emi); interestOutput.textContent = money(totalInterest); paymentOutput.textContent = money(totalPayment);
  bar.style.width = `${Math.max(0, Math.min(100, principal / totalPayment * 100))}%`; barLabel.textContent = `${money(principal)} principal and ${money(totalInterest)} interest.`;
  working.textContent = `Monthly rate r = ${rate} ÷ 12 ÷ 100 = ${monthlyRate}\nPayments n = ${months}\nEMI = P × r × (1 + r)^n ÷ ((1 + r)^n − 1) = ${money(emi)}`;
  let balance = principal;
  for (let month = 1; month <= months; month += 1) { const interest = balance * monthlyRate; const principalPart = Math.min(balance, emi - interest); balance = Math.max(0, balance - principalPart); const row = document.createElement("tr"); [month, money(emi), money(principalPart), money(interest), money(balance)].forEach((value) => { const cell = document.createElement("td"); cell.textContent = value; row.append(cell); }); schedule.append(row); }
}
[principalInput, rateInput, tenureInput, unitInput].forEach((element) => element.addEventListener("input", update));
reset.addEventListener("click", () => { principalInput.value = ""; rateInput.value = ""; tenureInput.value = ""; update(); principalInput.focus(); });
update();
