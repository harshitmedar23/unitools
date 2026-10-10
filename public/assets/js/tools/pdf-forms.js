import { clearMessage, initDropzone, initTheme, loadScript, showError, showProgress } from "/assets/common.js";

const PDF_LIB_URL = "/assets/vendor/pdf-lib-1.17.1.min.js";
const root = document.querySelector("[data-forms-tool]");
const dropzone = root.querySelector("[data-dropzone]");
const input = root.querySelector('input[type="file"]');
const fieldsContainer = root.querySelector("[data-form-fields]");
const status = root.querySelector("[data-form-status]");
const runButton = root.querySelector("[data-run]");
const resetButton = root.querySelector("[data-reset]");
const hint = root.querySelector("[data-run-hint]");
const progress = root.querySelector("[data-progress]");
const message = root.querySelector("[data-message]");
const result = root.querySelector("[data-result]");
const summary = root.querySelector("[data-result-summary]");
const download = root.querySelector("[data-download]");
let sourceFile = null;
let pdfDocument = null;
let outputUrl = "";

initTheme();

function isPdf(file) {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

function addTextField(field, wrapper, label) {
  const inputField = field.isMultiline() ? document.createElement("textarea") : document.createElement("input");
  inputField.className = field.isMultiline() ? "input text-area" : "input";
  inputField.value = field.getText() || "";
  inputField.dataset.fieldType = "text";
  label.append(inputField);
  wrapper.append(label);
}

function addSelectField(field, wrapper, label, multiple = false) {
  const select = document.createElement("select");
  select.className = "select";
  select.multiple = multiple;
  const options = field.getOptions();
  options.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    option.selected = (field.getSelected() || []).includes(value) || field.getSelected() === value;
    select.append(option);
  });
  select.dataset.fieldType = multiple ? "option-list" : "dropdown";
  label.append(select);
  wrapper.append(label);
}

function renderFields(form, fields) {
  fieldsContainer.replaceChildren();
  let editableCount = 0;
  fields.forEach((field, index) => {
    const wrapper = document.createElement("div");
    wrapper.className = "field-group";
    wrapper.dataset.fieldName = field.getName();
    const label = document.createElement("label");
    label.className = "field-label";
    label.textContent = field.getName();

    if (field instanceof window.PDFLib.PDFTextField) {
      addTextField(field, wrapper, label);
      editableCount += 1;
    } else if (field instanceof window.PDFLib.PDFCheckBox) {
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = field.isChecked();
      checkbox.dataset.fieldType = "checkbox";
      label.append(checkbox);
      wrapper.append(label);
      editableCount += 1;
    } else if (field instanceof window.PDFLib.PDFDropdown) {
      addSelectField(field, wrapper, label);
      editableCount += 1;
    } else if (field instanceof window.PDFLib.PDFRadioGroup) {
      addSelectField(field, wrapper, label);
      editableCount += 1;
    } else if (field instanceof window.PDFLib.PDFOptionList) {
      addSelectField(field, wrapper, label, true);
      editableCount += 1;
    }

    if (wrapper.children.length) fieldsContainer.append(wrapper);
  });
  return editableCount;
}

async function loadForm(files) {
  sourceFile = files[0];
  result.hidden = true;
  clearMessage(message);
  fieldsContainer.replaceChildren();
  status.textContent = "";
  showProgress(progress, "Reading PDF form", 0.15);
  try {
    await loadScript(PDF_LIB_URL);
    pdfDocument = await window.PDFLib.PDFDocument.load(await sourceFile.arrayBuffer());
    const fields = pdfDocument.getForm().getFields();
    const editableCount = renderFields(pdfDocument.getForm(), fields);
    if (!editableCount) throw new Error("No supported AcroForm fields were found. XFA forms and scanned paper forms cannot be filled here.");
    status.textContent = `${editableCount} supported ${editableCount === 1 ? "field" : "fields"} found. Unsupported field types are not shown.`;
    hint.textContent = "Fill the fields, then save a copy.";
    runButton.disabled = false;
    resetButton.hidden = false;
    progress.hidden = true;
  } catch (error) {
    pdfDocument = null;
    fieldsContainer.replaceChildren();
    progress.hidden = true;
    showError(message, error.message || "Could not read this PDF form. Try another file.");
    hint.textContent = "Choose a supported fillable PDF.";
    runButton.disabled = true;
    resetButton.hidden = false;
  }
}

async function saveFilledForm() {
  if (!pdfDocument) return;
  runButton.disabled = true;
  clearMessage(message);
  showProgress(progress, "Saving filled PDF", 0.5);
  try {
    const form = pdfDocument.getForm();
    fieldsContainer.querySelectorAll("[data-field-name]").forEach((wrapper) => {
      const field = form.getField(wrapper.dataset.fieldName);
      const control = wrapper.querySelector("[data-field-type]");
      switch (control.dataset.fieldType) {
        case "text":
          field.setText(control.value);
          break;
        case "checkbox":
          if (control.checked) field.check(); else field.uncheck();
          break;
        case "dropdown":
        case "radio":
          if (control.value) field.select(control.value);
          break;
        case "option-list":
          field.select(Array.from(control.selectedOptions, (option) => option.value));
          break;
      }
    });
    const bytes = await pdfDocument.save();
    if (outputUrl) URL.revokeObjectURL(outputUrl);
    outputUrl = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
    download.href = outputUrl;
    summary.textContent = `Done. Saved filled PDF (${(bytes.length / 1024).toFixed(bytes.length > 1024 * 1024 ? 0 : 1)} KB).`;
    result.hidden = false;
    progress.hidden = true;
    runButton.disabled = false;
  } catch (error) {
    progress.hidden = true;
    showError(message, error.message || "Could not save the filled form. Check the entered values and try again.");
    runButton.disabled = false;
  }
}

function reset() {
  sourceFile = null;
  pdfDocument = null;
  input.value = "";
  fieldsContainer.replaceChildren();
  status.textContent = "";
  result.hidden = true;
  progress.hidden = true;
  runButton.disabled = true;
  hint.textContent = "Choose a fillable PDF to begin.";
  resetButton.hidden = true;
  if (outputUrl) URL.revokeObjectURL(outputUrl);
  outputUrl = "";
  clearMessage(message);
}

initDropzone(dropzone, {
  accept: isPdf,
  multiple: false,
  maxSizeMB: 100,
  onError: () => showError(message, "This tool needs a PDF file. Choose a PDF and try again."),
  onFiles: loadForm
});
runButton.addEventListener("click", saveFilledForm);
resetButton.addEventListener("click", reset);
