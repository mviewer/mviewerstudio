/**
 * Import type selector for the Grist import step.
 *
 * Usage:
 * `const block = new mv.components.grist.importGristArea();`
 * `target.appendChild(block.render());`
 */
import UploadFile from "../../uploadFile/uploadFile.js";
import ListGristTables from "../listGristTables/listGristTables.js";
import Table from "../../table/table.js";
import Input from "../../input/input.js";
import Select from "../../select/select.js";
import OpenGristTableBtn from "../openGristTableBtn/openGristTableBtn.js";
import verifyUploadedFile from "../../../utils/grist/verifyUploadedFile.js";
import { getTableRecords } from "../../../utils/grist/requests.js";
import {
  disableGristWizardNextButton,
  disableSelectLayersButton,
  setGristWizardNextButtonReady,
  updateGristWizardNextButtonForSelectedTable,
  updateGristWizardNextButtonForSentTable,
  updateSelectLayersButtonForImportedFile,
} from "../../../utils/grist/validation.js";
import {
  getGristConfig,
  getGristTableUrl,
  listDocs,
} from "../../../utils/grist/utils.js";
import { sendParsedFileToGrist } from "./utils.js";

/**
 * Remove the extension from a file name.
 *
 * @param {string} fileName File name to normalize.
 * @returns {string} File name without its extension.
 */
function getFileNameWithoutExtension(fileName) {
  if (!fileName) {
    return "";
  }

  return fileName.replace(/\.[^.]+$/, "");
}

/**
 * Extract the identifier from a Grist entity.
 *
 * @param {Object} entity Grist document entity.
 * @returns {string|number|undefined} Document identifier.
 */
const getGristEntityId = (entity) => {
  if (!entity) {
    return undefined;
  }

  return entity.id || entity.name;
};

/**
 * Extract the display name from a Grist entity.
 *
 * @param {Object} entity Grist document entity.
 * @returns {string|number|undefined} Document display name.
 */
const getGristEntityName = (entity) => {
  if (!entity) {
    return undefined;
  }

  return entity.name || entity.title || getGristEntityId(entity);
};

const getRows = (data) => {
  if (Array.isArray(data)) {
    return data;
  }

  if (data && Array.isArray(data.data)) {
    return data.data;
  }

  return [];
};

const getHeaders = (rows, data) => {
  if (data && data.meta && Array.isArray(data.meta.fields) && data.meta.fields.length) {
    return data.meta.fields;
  }

  const firstRow = rows.find((row) => row && typeof row === "object");

  if (!firstRow) {
    return [];
  }

  if (Array.isArray(firstRow)) {
    return firstRow.map((_, index) => `column_${index + 1}`);
  }

  return Object.keys(firstRow);
};

const readJson = async (response) => {
  if (!response.ok) {
    throw new Error(`Grist request failed with status ${response.status}`);
  }

  return response.json();
};

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
  this.fileDocumentName = "";
  this.sentTable = null;
  this.documentOptionsPromise = null;
  this.apiKey = options.apiKey || "";
  this.onFileChange = options.onFileChange || function () {};
  this.onColumnsChange = options.onColumnsChange || function () {};
  this.element = document.createElement("div");
  this.element.className = "import-type-buttons";

  this.documentNameSelect = new Select({
    label: "Document Grist :",
    placeholder: "Sélectionner ou créer un document",
    classes: "row align-items-center my-3",
    labelClasses: "col-3 col-form-label",
    selectClasses: "col-6",
    onChange: (value) => {
      this.fileDocumentName = value;
      this.sentTable = null;

      if (value === "create") {
        this.fileDocumentName = this.documentNameInput.getValue();
      }
      this.updateGristWizardNextButtonForFile();
      this.updateFilePreview();
    },
    onLoad: (select) => this.loadDocumentOptions(select),
  });

  this.documentNameInput = new Input({
    label: "Nom du document :",
    classes: "row align-items-center my-3",
    labelClasses: "col-3 col-form-label",
    inputClasses: "col-6",
    placeholder: "Nom du document...",
    onChange: (value) => {
      this.fileDocumentName = value;
      this.sentTable = null;
      this.updateGristWizardNextButtonForFile();
    },
  });

  this.tableNameInput = new Input({
    label: "Nom de la table :",
    classes: "row align-items-center my-3",
    labelClasses: "col-3 col-form-label",
    inputClasses: "col-6",
    placeholder: "Nom de la table...",
    onChange: (value) => {
      this.fileTableName = value;
      this.sentTable = null;
      this.updateGristWizardNextButtonForFile();
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
      const parsedData = verification && verification.parsedData;
      let columns = [];

      if (verification && verification.columns) {
        columns = verification.columns;
      } else if (parsedData && parsedData.meta) {
        columns = parsedData.meta.fields;
      }

      this.file = file;
      this.fileVerification = verification;
      this.sentTable = null;
      this.fileTableName = getFileNameWithoutExtension(file && file.name);
      this.onColumnsChange(columns);
      this.tableNameInput.setValue(this.fileTableName);
      this.updateFilePreview();
      this.updateGristWizardNextButtonForFile();
      updateSelectLayersButtonForImportedFile(verification);
      this.onFileChange(file, verification, this.fileTableName);
    },
  });
  this.listGristTables = new ListGristTables({
    apiKey: this.apiKey,
    autoload: false,
    onChange: updateGristWizardNextButtonForSelectedTable,
    onFieldsChange: this.onColumnsChange,
  });
};

/**
 * Load the Grist documents once and populate the document select.
 *
 * @param {Select} select Document select component.
 * @returns {Promise<Array<{label: string, value: string|number}>>} Available document options.
 */
importGristArea.prototype.loadDocumentOptions = function (select) {
  if (!this.documentOptionsPromise) {
    this.documentOptionsPromise = listDocs(this.apiKey)
      .then((documents) => [
        { label: "Créer un document", value: "create" },
        ...documents
          .map((document) => ({
            label: getGristEntityName(document),
            value: getGristEntityId(document),
          }))
          .filter((option) => option.label && option.value),
      ])
      .catch((error) => {
        console.error("Error loading Grist documents:", error);
        return [{ label: "Créer un document", value: "create" }];
      });
  }

  return this.documentOptionsPromise.then((options) => {
    select.setOptions(options);
    select.setDisabled(false);
    this.fileDocumentName = select.getValue();
    this.updateGristWizardNextButtonForFile();

    return options;
  });
};

importGristArea.prototype.setActiveType = function (type) {
  this.activeType = type;
  this.update();

  if (type === "grist") {
    updateGristWizardNextButtonForSelectedTable(this.listGristTables.getSelectedTable());
    disableSelectLayersButton();
    this.listGristTables.load();
    return;
  }

  this.updateGristWizardNextButtonForFile();
  updateSelectLayersButtonForImportedFile(this.fileVerification);
};

importGristArea.prototype.update = function () {
  const fileButton = this.element.querySelector('[data-import-type="file"]');
  const gristButton = this.element.querySelector('[data-import-type="grist"]');
  const fileContent = this.element.querySelector('[data-import-content="file"]');
  const gristContent = this.element.querySelector('[data-import-content="grist"]');

  const isFileActive = this.activeType === "file";
  const isGristActive = this.activeType === "grist";

  if (fileButton) {
    fileButton.classList.toggle("active", isFileActive);
  }

  if (gristButton) {
    gristButton.classList.toggle("active", isGristActive);
  }

  if (fileContent) {
    fileContent.classList.toggle("d-none", !isFileActive);
  }

  if (gristContent) {
    gristContent.classList.toggle("d-none", isFileActive);
  }
  this.updateFilePreview();
};

importGristArea.prototype.getFileTableName = function () {
  return this.tableNameInput.getValue();
};

/**
 * Return the selected Grist document identifier or the entered document name.
 *
 * @returns {string} Document value used when creating the Grist table.
 */
importGristArea.prototype.getFileDocumentName = function () {
  if (this.documentNameSelect.getValue() === "create") {
    return this.documentNameInput.getValue().trim();
  }

  return this.documentNameSelect.getValue().trim();
};

/**
 * Enable the wizard navigation only when the imported file and its Grist
 * destination have both been provided.
 *
 * @returns {void}
 */
importGristArea.prototype.updateGristWizardNextButtonForFile = function () {
  if (this.activeType !== "file") {
    return;
  }

  const parsedData = this.fileVerification && this.fileVerification.parsedData;
  const rows = getRows(parsedData);
  const headers = getHeaders(rows, parsedData);
  const ready =
    this.fileVerification &&
    this.fileVerification.valid &&
    rows.length > 0 &&
    headers.length > 0 &&
    this.getFileTableName().trim() &&
    this.getFileDocumentName();

  setGristWizardNextButtonReady(ready);
};

importGristArea.prototype.getTargetTable = function () {
  if (this.activeType === "grist") {
    const selectedTable = this.listGristTables.getSelectedTable();

    if (!selectedTable) {
      return null;
    }

    return {
      docId: selectedTable.docId,
      tableId: selectedTable.tableId,
      name: selectedTable.tableName,
      tableRef: selectedTable.tableRef,
      url: selectedTable.url,
    };
  }

  if (!this.sentTable) {
    return null;
  }

  return {
    docId: this.sentTable.docId,
    tableId: this.sentTable.tableId,
    name: this.fileTableName,
    tableRef: this.sentTable.tableRef,
    url: this.sentTable.url,
  };
};

/**
 * Return the Grist interface URL for the selected or imported target table.
 *
 * @returns {Promise<string|null>} URL that opens the target table in Grist.
 */
importGristArea.prototype.getTargetTableUrl = async function () {
  const targetTable = this.getTargetTable();

  if (!targetTable) {
    return null;
  }

  if (targetTable.url) {
    return targetTable.url;
  }

  if (!targetTable.tableRef) {
    return null;
  }

  const gristConfig = getGristConfig();

  return getGristTableUrl(
    gristConfig.instanceUrl,
    gristConfig.orgId,
    targetTable.docId,
    targetTable.tableId,
    targetTable.tableRef
  );
};

importGristArea.prototype.getSourceData = async function () {
  const targetTable = this.getTargetTable();
  if (targetTable) {
    const gristConfig = getGristConfig();
    const payload = await getTableRecords(
      gristConfig.apiUrl,
      targetTable.docId,
      targetTable.tableId,
      this.apiKey
    ).then(readJson);
    const records = payload.records || [];
    const rows = records.map((record) => ({
      ...(record.fields || record),
    }));

    return {
      docId: targetTable.docId,
      tableId: targetTable.tableId,
      fields: getHeaders(rows, { data: rows }),
      records,
      rows,
    };
  }

  if (this.activeType === "file") {
    let parsedData = null;

    if (this.fileVerification) {
      parsedData = this.fileVerification.parsedData;
    }

    const rows = getRows(parsedData);

    return {
      fields: getHeaders(rows, parsedData),
      rows,
    };
  }

  return {
    fields: [],
    records: [],
    rows: [],
  };
};

/**
 * Send the currently previewed file data to Grist.
 *
 * @returns {Promise<Object>} Created Grist table information.
 */
importGristArea.prototype.sendFileToGrist = async function () {
  let parsedData = null;

  if (this.fileVerification) {
    parsedData = this.fileVerification.parsedData;
  }

  if (!this.fileVerification || !this.fileVerification.valid || !parsedData) {
    throw new Error("Le fichier n'a pas pu être lu correctement.");
  }

  const result = await sendParsedFileToGrist(
    parsedData,
    this.getFileTableName(),
    this.getFileDocumentName(),
    this.apiKey
  );

  this.sentTable = result;
  updateGristWizardNextButtonForSentTable(result);

  const openTableContainer = this.element.querySelector(
    "[data-open-created-grist-table]"
  );

  if (openTableContainer) {
    openTableContainer.replaceChildren(
      new OpenGristTableBtn({ url: result.url }).render()
    );
  }

  return result;
};

/**
 * Send the imported file when needed, then verify that the target Grist table
 * can be read and contains usable data.
 *
 * @returns {Promise<Object>} Validated Grist source data.
 * @throws {Error} When the source cannot be imported or read.
 */
importGristArea.prototype.prepareForLocationStep = async function () {
  if (this.activeType === "file" && !this.sentTable) {
    await this.sendFileToGrist();
  }

  const sourceData = await this.getSourceData();

  if (!sourceData.rows.length || !sourceData.fields.length) {
    throw new Error("La table Grist ne contient aucune donnée exploitable.");
  }

  this.onColumnsChange(sourceData.fields);

  return sourceData;
};

/**
 * Render the file preview and the actions available for the selected file.
 *
 * @returns {void}
 */
importGristArea.prototype.updateFilePreview = function () {
  const previewContainer = this.element.querySelector("[data-upload-file-preview]");
  let parsedData = null;

  if (this.fileVerification) {
    parsedData = this.fileVerification.parsedData;
  }

  const canPreview =
    this.activeType === "file" &&
    this.fileVerification &&
    this.fileVerification.valid &&
    parsedData;

  if (!previewContainer) {
    return;
  }

  previewContainer.replaceChildren();
  previewContainer.classList.toggle("d-none", !canPreview);

  if (!canPreview) {
    return;
  }

  previewContainer.appendChild(this.documentNameSelect.render());
  if (this.documentNameSelect.getValue() === "create") {
    previewContainer.appendChild(this.documentNameInput.render());
  }
  previewContainer.appendChild(this.tableNameInput.render());

  this.filePreviewTable.title = this.fileTableName || "Fichier importe";
  this.filePreviewTable.subtitle = "Apercu des 5 premieres lignes";
  previewContainer.appendChild(this.filePreviewTable.setData(parsedData));

  const openTableContainer = document.createElement("div");
  openTableContainer.dataset.openCreatedGristTable = "";
  previewContainer.appendChild(openTableContainer);
};

importGristArea.prototype.render = function () {
  this.element.innerHTML = `
    <div class="import-type-buttons__actions">
      <button
        type="button"
        class="import-type-buttons__button${this.activeType === "file" ? " active" : ""}"
        data-import-type="file"
      >
        <span class="import-type-buttons__title">Importer un fichier</span>
        <span class="import-type-buttons__description">Ajoutez facilement vos donnees depuis un fichier CSV ou Excel</span>
      </button>
      <button
        type="button"
        class="import-type-buttons__button${this.activeType === "grist" ? " active" : ""}"
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

  const fileButton = this.element.querySelector('[data-import-type="file"]');
  const gristButton = this.element.querySelector('[data-import-type="grist"]');
  const uploadFileArea = this.element.querySelector("[data-upload-file-area]");
  const listGristTablesArea = this.element.querySelector("[data-list-grist-tables-area]");

  if (fileButton) {
    fileButton.addEventListener("click", () => this.setActiveType("file"));
  }

  if (gristButton) {
    gristButton.addEventListener("click", () => this.setActiveType("grist"));
  }

  if (uploadFileArea) {
    uploadFileArea.appendChild(this.uploadFile.render());
  }

  if (listGristTablesArea) {
    listGristTablesArea.appendChild(this.listGristTables.render());
  }

  this.update();

  if (this.activeType === "grist") {
    this.listGristTables.load();
  }

  return this.element;
};

export default importGristArea;
