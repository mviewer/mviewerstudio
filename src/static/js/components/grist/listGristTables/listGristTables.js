/**
 * Grist tables select field.
 *
 * Usage:
 * `const list = new mv.components.grist.listGristTables({ apiKey });`
 * `target.appendChild(list.render());`
 */
import { getDocTables } from "../../../utils/grist/requests.js";
import {
  getGristConfig,
  getGristTableUrl,
  listDocs,
} from "../../../utils/grist/utils.js";
import Table from "../../table/table.js";
import Select from "../../select/select.js";
import SpinnerGrow from "../../spinnergrow/spinnergrow.js";
import { gristTableToPreview } from "./utils.js";
import OpenGristTableBtn from "../openGristTableBtn/openGristTableBtn.js";

let listGristTablesInstanceId = 0;

const readJson = (response) => {
  if (!response.ok) {
    throw new Error(`Grist request failed with status ${response.status}`);
  }

  return response.json();
};

const getGristId = (item) => item?.id ?? item?.name ?? item?.domain;
const getGristName = (item) => item?.name ?? item?.title ?? item?.id;
const getGristTableRef = (table) =>
  table?.fields?.tableRef ?? table?.tableRef ?? getGristId(table);
const getTablesCountLabel = (count) =>
  `${count} table${count > 1 ? "s" : ""} disponible${count > 1 ? "s" : ""}`;

const ListGristTables = function (options = {}) {
  listGristTablesInstanceId += 1;

  this.id = `list-grist-tables-${listGristTablesInstanceId}`;
  this.apiKey = options.apiKey || "";
  this.placeholder = options.placeholder || "Choisir une table Grist";
  this.autoload = options.autoload !== false;
  this.onChange = options.onChange || function () {};
  this.onFieldsChange = options.onFieldsChange || function () {};

  this.tables = [];
  this.loadPromise = null;
  this.previewRequestId = 0;
  this.previewTable = new Table({
    maxRows: 5,
    emptyMessage: "Aucune donnee a previsualiser.",
    classes: "mb-0",
  });
  this.select = new Select({
    id: this.id,
    label: "",
    placeholder: this.placeholder,
    classes: "list-grist-tables-select-wrapper",
    selectClasses: "list-grist-tables-select",
    disabled: true,
    onChange: () => {
      const selectedTable = this.getSelectedTable();
      this.onChange(selectedTable);
      this.onFieldsChange([]);
      this.updatePreview(selectedTable);
      this.updateOpenTableButton(selectedTable);
    },
  });
  this.element = document.createElement("div");
  this.element.className = "list-grist-tables";
  this.spinner = new SpinnerGrow({
    label: "Chargement des tables Grist...",
    classes: "d-flex justify-content-center align-items-center",
    visible: false,
  });
};

ListGristTables.prototype.setStatus = function (message, type = "muted") {
  const status = this.element.querySelector("[data-list-grist-tables-status]");

  if (!status) {
    return;
  }

  status.className = `list-grist-tables-status list-grist-tables-status-${type}`;
  status.textContent = message;
  status.classList.toggle("d-none", !message);
};

ListGristTables.prototype.setLoading = function (loading) {
  this.select.setDisabled(loading || !this.tables.length);
};

ListGristTables.prototype.setListVisible = function (visible) {
  this.element
    .querySelector("[data-list-grist-tables-select]")
    ?.classList.toggle("d-none", !visible);
};

ListGristTables.prototype.getDocsTables = function () {
  return Promise.all([getGristConfig(), listDocs(this.apiKey)]).then(
    ([gristConfig, docs]) => {
      const tablesRequests = docs.map((doc) =>
        getDocTables(gristConfig.apiUrl, getGristId(doc), this.apiKey)
          .then(readJson)
          .then((payload) =>
            (payload.tables || []).map((table) => ({
              doc,
              table,
              docId: getGristId(doc),
              docName: getGristName(doc),
              tableId: getGristId(table),
              tableName: getGristName(table),
              tableRef: getGristTableRef(table),
            }))
          )
      );

      return Promise.all(tablesRequests).then((tablesByDoc) =>
        tablesByDoc.flat()
      );
    }
  );
};

ListGristTables.prototype.updateOptions = function () {
  this.select.setOptions(
    this.tables.map((entry) => ({
      label: `${entry.docName}/${entry.tableName}`,
      value: `${entry.docId}:${entry.tableId}`,
    }))
  );
  this.select.setDisabled(!this.tables.length);
};

ListGristTables.prototype.load = function () {
  if (this.loadPromise) {
    return this.loadPromise;
  }

  if (!this.apiKey) {
    this.setStatus("Clé API Grist manquante.", "danger");
    return Promise.resolve([]);
  }

  this.setLoading(true);
  this.setListVisible(false);

  this.spinner.setVisible(true);

  this.loadPromise = this.getDocsTables()
    .then((tables) => {
      this.tables = tables;
      this.updateOptions();

      if (!tables.length) {
        this.setStatus("Aucune table trouvée dans le workspace configuré.");
        return tables;
      }

      this.setStatus(getTablesCountLabel(tables.length), "success");
      this.setListVisible(true);
      return tables;
    })
    .catch((error) => {
      this.tables = [];
      this.updateOptions();
      this.setStatus("Impossible de charger les tables Grist.", "danger");
      console.error("Error loading Grist tables:", error);
      return [];
    })
    .finally(() => {
      this.spinner.setVisible(false);
      this.setLoading(false);
      this.loadPromise = null;
    });

  return this.loadPromise;
};

ListGristTables.prototype.getSelectedTable = function () {
  const value = this.select.getValue();

  if (!value) {
    return null;
  }

  return this.tables.find(
    (entry) => `${entry.docId}:${entry.tableId}` === value
  );
};

ListGristTables.prototype.updatePreview = function (selectedTable) {
  const previewContainer = this.element.querySelector(
    "[data-list-grist-tables-preview]"
  );
  const requestId = this.previewRequestId + 1;

  this.previewRequestId = requestId;

  if (!previewContainer) {
    return;
  }

  previewContainer.replaceChildren();
  previewContainer.classList.toggle("d-none", !selectedTable);

  if (!selectedTable) {
    return;
  }

  const loading = document.createElement("p");
  loading.className = "text-muted mb-0";
  loading.textContent = "Chargement de l'apercu...";
  previewContainer.appendChild(loading);

  gristTableToPreview(selectedTable, this.apiKey)
    .then((previewData) => {
      if (requestId !== this.previewRequestId) {
        return;
      }

      this.previewTable.title = selectedTable.tableName || "Table Grist";
      this.previewTable.subtitle = "Apercu des 5 premieres lignes";
      this.onFieldsChange(previewData?.meta?.fields || []);
      previewContainer.replaceChildren(
        this.previewTable.setData(previewData)
      );
    })
    .catch((error) => {
      if (requestId !== this.previewRequestId) {
        return;
      }

      previewContainer.replaceChildren();
      const message = document.createElement("p");
      message.className = "text-danger mb-0";
      message.textContent = "Impossible de previsualiser cette table Grist.";
      previewContainer.appendChild(message);
      this.onFieldsChange([]);
      console.error("Error loading Grist table preview:", error);
    });
};

/**
 * Display the button that opens the document containing the selected table.
 *
 * @param {Object|null} selectedTable Selected Grist table entry.
 * @param {string|number} selectedTable.docId Grist document id.
 * @param {string|number} selectedTable.tableRef Grist table reference.
 * @returns {void}
 */
ListGristTables.prototype.updateOpenTableButton = function (selectedTable) {
  const container = this.element.querySelector("#open-table-into-grist");

  if (!container || !selectedTable) {
    container?.replaceChildren();
    return;
  }

  getGristConfig().then((gristConfig) => {
    if (this.getSelectedTable() !== selectedTable) {
      return;
    }

    container.replaceChildren(
      new OpenGristTableBtn({
        url: getGristTableUrl(
          gristConfig.instanceUrl,
          gristConfig.orgId,
          selectedTable.docId,
          selectedTable.tableId,
          selectedTable.tableRef
        ),
      }).render()
    );
  });
};

ListGristTables.prototype.render = function () {
  this.element.innerHTML = `
    <div class="list-grist-tables-card">
      <div class="list-grist-tables-header">
        <div>
          <label class="list-grist-tables-label" for="${this.id}">Table Grist</label>
          <p class="list-grist-tables-help">Choisissez la table source contenant les adresses à géocoder.</p>
        </div>
        <span class="list-grist-tables-status list-grist-tables-status-muted d-none" data-list-grist-tables-status></span>
      </div>
      <div data-list-grist-tables-spinner></div>
      <div class="d-none" data-list-grist-tables-select>
        <div class="list-grist-tables-select-field">
          <i class="ri-table-line list-grist-tables-select-icon" aria-hidden="true"></i>
        </div>
        <p class="list-grist-tables-format">
          <i class="ri-information-line" aria-hidden="true"></i>
          Format : <code>document / table</code>
        </p>
      </div>
    </div>
    <div class="list-grist-tables-preview d-none" data-list-grist-tables-preview></div>
    <div id="open-table-into-grist"></div>
  `;

  this.element
    .querySelector(".list-grist-tables-select-field")
    ?.appendChild(this.select.render());
  this.element
    .querySelector("[data-list-grist-tables-spinner]")
    ?.appendChild(this.spinner.render());

  this.updateOptions();
  if (this.autoload) {
    this.load();
  }

  return this.element;
};

export default ListGristTables;
