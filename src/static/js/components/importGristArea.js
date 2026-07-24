/**
 * Import type selector for the Grist import step.
 *
 * Usage:
 * `const block = new mv.components.grist.importGristArea();`
 * `target.appendChild(block.render());`
 */
import UploadFile from "./uploadFile.js";
import ListGristTables from "./listGristTables.js";
import Table from "./table.js";
import Input from "./input.js";
import verifyUploadedFile from "../utils/grist/verifyUploadedFile.js";
import {
  disableSelectLayersButton,
  updateSelectLayersButtonForImportedFile,
} from "../utils/grist/validation.js";

function getFileNameWithoutExtension(fileName) {
  return fileName ? fileName.replace(/\.[^.]+$/, "") : "";
}

const importGristArea = function (activeType = "file", options = {}) {
  if (typeof activeType === "object") {
    options = activeType;
    activeType = options.activeType || "file";
  }

  this.activeType = activeType;
  this.options = options;
  this.file = null;
  this.fileVerification = null;
  this.fileTableName = "";
  this.onFileChange = options.onFileChange || function () {};
  this.element = document.createElement("div");
  this.element.className = "import-type-buttons";
  this.tableNameInput = new Input({
    label: "Nom de la table :",
    classes: "table-name-input my-3",
    placeholder: "Nom de la table...",
    onChange: (value) => {
      this.fileTableName = value;
      this.filePreviewTable.setTitle(
        this.fileTableName || "Fichier importe",
        "Apercu des 5 premieres lignes"
      );
    },
  });
  this.filePreviewTable = new Table({
    maxRows: 5,
    emptyMessage: "Aucune donnee a previsualiser.",
    classes: "mb-0",
  });
  this.uploadFile = new UploadFile({
    accept: [".csv", ".xls", ".xlsx"],
    placeholder:
      "Glissez-deposez un fichier CSV ou Excel,\nou selectionnez un fichier\nLe fichier doit contenir une information geographique (adresse, code administratif ou coordonnees X/Y).",
    buttonLabel: "Choisir un fichier",
    verifyFile: verifyUploadedFile,
    onChange: (file, verification) => {
      this.file = file;
      this.fileVerification = verification;
      this.fileTableName = getFileNameWithoutExtension(file?.name);
      this.tableNameInput.setValue(this.fileTableName);
      this.updateFilePreview();
      updateSelectLayersButtonForImportedFile(verification);
      this.onFileChange(file, verification, this.fileTableName);
    },
  });
  this.listGristTables = new ListGristTables({
    apiKey: options.apiKey || "",
    autoload: false,
  });
};

importGristArea.prototype.setActiveType = function (type) {
  this.activeType = type;
  this.update();

  if (type === "grist") {
    disableSelectLayersButton();
    this.listGristTables.load();
    return;
  }

  updateSelectLayersButtonForImportedFile(this.fileVerification);
};

importGristArea.prototype.update = function () {
  const fileButton = this.element.querySelector('[data-import-type="file"]');
  const gristButton = this.element.querySelector('[data-import-type="grist"]');
  const fileContent = this.element.querySelector('[data-import-content="file"]');
  const gristContent = this.element.querySelector('[data-import-content="grist"]');

  const isFileActive = this.activeType === "file";

  fileButton?.classList.toggle("active", isFileActive);
  gristButton?.classList.toggle("active", !isFileActive);
  fileContent?.classList.toggle("d-none", !isFileActive);
  gristContent?.classList.toggle("d-none", isFileActive);
  this.updateFilePreview();
};

importGristArea.prototype.getFileTableName = function () {
  return this.tableNameInput.getValue();
};

importGristArea.prototype.updateFilePreview = function () {
  const previewContainer = this.element.querySelector("[data-upload-file-preview]");
  const parsedData = this.fileVerification?.parsedData;
  const canPreview = this.activeType === "file" && this.fileVerification?.valid && parsedData;

  if (!previewContainer) {
    return;
  }

  previewContainer.replaceChildren();
  previewContainer.classList.toggle("d-none", !canPreview);

  if (!canPreview) {
    return;
  }

  previewContainer.appendChild(this.tableNameInput.render());

  this.filePreviewTable.title = this.fileTableName || "Fichier importe";
  this.filePreviewTable.subtitle = "Apercu des 5 premieres lignes";
  previewContainer.appendChild(this.filePreviewTable.setData(parsedData));
};

importGristArea.prototype.render = function () {
  this.element.innerHTML = `
    <div class="import-type-buttons__actions">
      <button
        type="button"
        class="import-type-buttons__button"
        data-import-type="file"
      >
        <span class="import-type-buttons__title">Importer un fichier</span>
        <span class="import-type-buttons__description">Ajoutez facilement vos donnees depuis un fichier CSV ou Excel</span>
      </button>
      <button
        type="button"
        class="import-type-buttons__button"
        data-import-type="grist"
      >
        <span class="import-type-buttons__title">Choisir une table Grist</span>
        <span class="import-type-buttons__description">Selectionnez une table existante dans votre espace Grist</span>
      </button>
    </div>
    <div class="import-type-buttons__content" data-import-content="file">
      <div data-upload-file-area></div>
      <div class="d-none" data-upload-file-preview></div>
    </div>
    <div class="import-type-buttons__content d-none" data-import-content="grist">
      <div data-list-grist-tables-area></div>
    </div>
  `;

  this.element
    .querySelector('[data-import-type="file"]')
    ?.addEventListener("click", () => this.setActiveType("file"));

  this.element
    .querySelector('[data-import-type="grist"]')
    ?.addEventListener("click", () => this.setActiveType("grist"));

  this.element
    .querySelector("[data-upload-file-area]")
    ?.appendChild(this.uploadFile.render());

  this.element
    .querySelector("[data-list-grist-tables-area]")
    ?.appendChild(this.listGristTables.render());

  this.update();

  if (this.activeType === "grist") {
    this.listGristTables.load();
  }

  return this.element;
};

export default importGristArea;
