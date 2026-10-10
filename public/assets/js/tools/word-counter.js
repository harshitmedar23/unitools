import { initTheme } from "/assets/common.js";

const text = document.querySelector("[data-text]");
const reset = document.querySelector("[data-reset]");
const words = document.querySelector("[data-words]");
const characters = document.querySelector("[data-characters]");
const noSpaces = document.querySelector("[data-no-spaces]");
const sentences = document.querySelector("[data-sentences]");
const paragraphs = document.querySelector("[data-paragraphs]");
const reading = document.querySelector("[data-reading]");
const speaking = document.querySelector("[data-speaking]");
initTheme();

function countWords(value) {
  if (!value.trim()) return 0;
  if (typeof Intl.Segmenter === "function") return [...new Intl.Segmenter(undefined, { granularity: "word" }).segment(value)].filter((part) => part.isWordLike).length;
  return (value.match(/[\p{L}\p{N}]+(?:['’_-][\p{L}\p{N}]+)*/gu) || []).length;
}
function minutes(words, rate) { return words ? `${Math.max(1, Math.ceil(words / rate))} min` : "0 min"; }
function update() {
  const value = text.value;
  const wordCount = countWords(value);
  words.textContent = wordCount.toLocaleString("en-IN");
  characters.textContent = value.length.toLocaleString("en-IN");
  noSpaces.textContent = value.replace(/\s/gu, "").length.toLocaleString("en-IN");
  sentences.textContent = value.trim() ? (value.match(/[^.!?…。！？]+[.!?…。！？]+|[^.!?…。！？]+$/gu) || []).filter((item) => item.trim()).length.toLocaleString("en-IN") : "0";
  paragraphs.textContent = value.trim() ? value.trim().split(/(?:\r?\n){2,}/u).filter(Boolean).length.toLocaleString("en-IN") : "0";
  reading.textContent = minutes(wordCount, 200);
  speaking.textContent = minutes(wordCount, 130);
}
text.addEventListener("input", update);
reset.addEventListener("click", () => { text.value = ""; update(); text.focus(); });
update();
