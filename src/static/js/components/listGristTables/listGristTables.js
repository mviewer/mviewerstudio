/**
 * Grist tables select field.
 *
 * Usage:
 * `const list = new mv.components.grist.listGristTables({ apiKey });`
 * `target.appendChild(list.render());`
 */
import { getDocTables } from "../../utils/grist/requests.js";
import {
  getGristConfig,
  getGristTableUrl,
  listDocs,
} from "../../utils/grist/utils.js";
import Table from "../table/table.js";
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

const ListGristTables = function (options = {}) {
  listGristTablesInstanceId += 1;

  this.id = `list-grist-tables-${listGristTablesInstanceId}`;
  this.apiKey = options.apiKey || "";
  this.placeholder = options.placeholder || "Choisir une table Grist";
  this.autoload = options.autoload !== false;
  this.onChange = options.onChange || function () {};

  this.tables = [];
  this.loadPromise = null;
  this.previewRequestId = 0;
  this.previewTable = new Table({
    maxRows: 5,
    emptyMessage: "Aucune donnee a previsualiser.",
    classes: "mb-0",
  });
  this.element = document.createElement("div");
  this.element.className = "list-grist-tables";
};

ListGristTables.prototype.setStatus = function (message, type = "muted") {
  const status = this.element.querySelector("[data-list-grist-tables-status]");

  if (!status) {
    return;
  }

  status.className = `list-grist-tables__status text-${type}`;
  status.textContent = message;
};

ListGristTables.prototype.setLoading = function (loading) {
  const select = this.element.querySelector("[data-list-grist-tables-select]");

  if (select) {
    select.disabled = loading || !this.tables.length;
  }
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
  const select = this.element.querySelector("[data-list-grist-tables-select]");

  if (!select) {
    return;
  }

  select.innerHTML = "";
  const placeholder = new Option(this.placeholder, "");
  placeholder.disabled = true;
  placeholder.selected = true;
  select.appendChild(placeholder);

  this.tables.forEach((entry) => {
    const option = new Option(
      `${entry.docName} / ${entry.tableName}`,
      `${entry.docId}:${entry.tableId}`
    );
    option.dataset.docId = entry.docId;
    option.dataset.tableId = entry.tableId;
    select.appendChild(option);
  });

  select.disabled = !this.tables.length;
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
  this.setStatus("Chargement des tables Grist...");

  this.loadPromise = this.getDocsTables()
    .then((tables) => {
      this.tables = tables;
      this.updateOptions();

      if (!tables.length) {
        this.setStatus("Aucune table trouvée dans le workspace configuré.");
        return tables;
      }

      this.setStatus(`${tables.length} table(s) disponible(s).`, "success");
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
      this.setLoading(false);
      this.loadPromise = null;
    });

  return this.loadPromise;
};

ListGristTables.prototype.getSelectedTable = function () {
  const select = this.element.querySelector("[data-list-grist-tables-select]");

  if (!select?.value) {
    return null;
  }

  return this.tables.find(
    (entry) => `${entry.docId}:${entry.tableId}` === select.value
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
          selectedTable.tableRef
        ),
      }).render()
    );
  });
};

ListGristTables.prototype.render = function () {
  this.element.innerHTML = `
    <label class="list-grist-tables__label" for="${this.id}">
      Table Grist
    </label>
    <p class="list-grist-tables__status text-muted" data-list-grist-tables-status></p>
    <select
      id="${this.id}"
      class="form-control my-3"
      data-list-grist-tables-select
      disabled
    ></select>
    <div class="list-grist-tables__preview d-none" data-list-grist-tables-preview></div>
    <div id="open-table-into-grist"></div>
  `;

  this.element
    .querySelector("[data-list-grist-tables-select]")
    ?.addEventListener("change", () => {
      const selectedTable = this.getSelectedTable();
      this.onChange(selectedTable);
      this.updatePreview(selectedTable);
      this.updateOpenTableButton(selectedTable);
    });

  this.updateOptions();
  if (this.autoload) {
    this.load();
  }

  return this.element;
};

export default ListGristTables;
