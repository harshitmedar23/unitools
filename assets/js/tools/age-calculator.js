import { clearMessage, formatNumberIN, initTheme, showError } from "/assets/common.js";

const birthInput = document.querySelector("#birth-date");
const ageInput = document.querySelector("#age-date");
const ageOutput = document.querySelector("[data-age]");
const totalDaysOutput = document.querySelector("[data-total-days]");
const nextBirthdayOutput = document.querySelector("[data-next-birthday]");
const working = document.querySelector("[data-working]");
const message = document.querySelector("[data-message]");
const reset = document.querySelector("[data-reset]");
initTheme();

function parseDate(value) {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return Number.isFinite(date.getTime()) && date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null;
}
function daysInMonth(year, month) { return new Date(year, month + 1, 0).getDate(); }
function birthdayForYear(birth, year) { return new Date(year, birth.getMonth(), Math.min(birth.getDate(), daysInMonth(year, birth.getMonth()))); }
function update() {
  clearMessage(message);
  ageOutput.textContent = totalDaysOutput.textContent = nextBirthdayOutput.textContent = "—";
  working.textContent = "";
  const birth = parseDate(birthInput.value);
  const end = parseDate(ageInput.value);
  if (!birth || !end) return;
  if (end < birth) return showError(message, "The age-on date must be on or after the date of birth.");
  let years = end.getFullYear() - birth.getFullYear();
  let anniversary = new Date(end.getFullYear(), birth.getMonth(), Math.min(birth.getDate(), daysInMonth(end.getFullYear(), birth.getMonth())));
  if (anniversary > end) {
    years -= 1;
    anniversary = new Date(end.getFullYear() - 1, birth.getMonth(), Math.min(birth.getDate(), daysInMonth(end.getFullYear() - 1, birth.getMonth())));
  }
  let months = end.getMonth() - anniversary.getMonth();
  if (months < 0) months += 12;
  let monthiversary = new Date(anniversary.getFullYear(), anniversary.getMonth() + months, Math.min(anniversary.getDate(), daysInMonth(anniversary.getFullYear(), anniversary.getMonth() + months)));
  if (monthiversary > end) {
    months -= 1;
    monthiversary = new Date(anniversary.getFullYear(), anniversary.getMonth() + months, Math.min(anniversary.getDate(), daysInMonth(anniversary.getFullYear(), anniversary.getMonth() + months)));
  }
  const days = Math.round((Date.UTC(end.getFullYear(), end.getMonth(), end.getDate()) - Date.UTC(monthiversary.getFullYear(), monthiversary.getMonth(), monthiversary.getDate())) / 86400000);
  const totalDays = Math.round((Date.UTC(end.getFullYear(), end.getMonth(), end.getDate()) - Date.UTC(birth.getFullYear(), birth.getMonth(), birth.getDate())) / 86400000);
  const birthdayThisYear = birthdayForYear(birth, end.getFullYear());
  const nextBirthday = birthdayThisYear >= end ? birthdayThisYear : birthdayForYear(birth, end.getFullYear() + 1);
  const daysToBirthday = Math.round((Date.UTC(nextBirthday.getFullYear(), nextBirthday.getMonth(), nextBirthday.getDate()) - Date.UTC(end.getFullYear(), end.getMonth(), end.getDate())) / 86400000);
  ageOutput.textContent = `${years} years, ${months} months, ${days} days`;
  totalDaysOutput.textContent = formatNumberIN(totalDays);
  nextBirthdayOutput.textContent = formatNumberIN(daysToBirthday);
  working.textContent = `Age = ${years} years + ${months} months + ${days} days\nTotal days = ${formatNumberIN(totalDays)}\nNext birthday = ${formatNumberIN(daysToBirthday)} days`;
}
birthInput.addEventListener("input", update); ageInput.addEventListener("input", update);
reset.addEventListener("click", () => { birthInput.value = ""; ageInput.value = new Date().toISOString().slice(0, 10); update(); birthInput.focus(); });
ageInput.value = new Date().toISOString().slice(0, 10); update();
