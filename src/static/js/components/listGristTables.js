/**
 * Grist tables select field.
 *
 * Usage:
 * `const list = new mv.components.listGristTables({ apiKey });`
 * `target.appendChild(list.render());`
 */
import {
  createOrgWorkspace,
  createWorkspaceDoc,
  getDocTables,
  getOrgWorkspaces,
  getUserOrgs,
  getWorkspaceDocsList,
} from "../utils/grist/requests.js";

const DEFAULT_WORKSPACE_NAME = "mviewerstudio";
let listGristTablesInstanceId = 0;

const readJson = (response) => {
  if (!response.ok) {
    throw new Error(`Grist request failed with status ${response.status}`);
  }

  return response.json();
};

const normalizeList = (payload, key) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  return payload?.[key] || [];
};

const getGristId = (item) => item?.id ?? item?.name ?? item?.domain;
const getGristName = (item) => item?.name ?? item?.title ?? item?.id;

const ListGristTables = function (options = {}) {
  listGristTablesInstanceId += 1;

  this.id = `list-grist-tables-${listGristTablesInstanceId}`;
  this.instanceUrl = options.instanceUrl || "/grist";
  this.apiKey = options.apiKey || "";
  this.workspaceName = options.workspaceName || DEFAULT_WORKSPACE_NAME;
  this.documentName = options.documentName || "";
  this.placeholder = options.placeholder || "Choisir une table Grist";
  this.autoload = options.autoload !== false;
  this.onChange = options.onChange || function () {};

  this.tables = [];
  this.workspace = null;
  this.document = null;
  this.loadPromise = null;
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

ListGristTables.prototype.getFirstOrg = function () {
  return getUserOrgs(this.instanceUrl, this.apiKey)
    .then(readJson)
    .then((payload) => {
      const orgs = normalizeList(payload, "orgs");

      if (!orgs.length) {
        throw new Error("No Grist organization found");
      }

      return orgs[0];
    });
};

ListGristTables.prototype.ensureWorkspace = function (org) {
  const orgId = getGristId(org);

  return getOrgWorkspaces(this.instanceUrl, orgId, this.apiKey)
    .then(readJson)
    .then((payload) => {
      const workspaces = normalizeList(payload, "workspaces");
      const workspace = workspaces.find(
        (item) => getGristName(item) === this.workspaceName
      );

      if (workspace) {
        return workspace;
      }

      return createOrgWorkspace(
        this.instanceUrl,
        orgId,
        this.workspaceName,
        this.apiKey
      ).then(readJson);
    });
};

ListGristTables.prototype.ensureDocument = function (workspace) {
  if (!this.documentName) {
    return Promise.resolve(null);
  }

  const workspaceId = getGristId(workspace);

  return getWorkspaceDocsList(this.instanceUrl, workspaceId, this.apiKey)
    .then(readJson)
    .then((payload) => {
      const docs = normalizeList(payload, "docs");
      const doc = docs.find((item) => getGristName(item) === this.documentName);

      if (doc) {
        return doc;
      }

      return createWorkspaceDoc(
        this.instanceUrl,
        workspaceId,
        this.documentName,
        this.apiKey
      ).then(readJson);
    });
};

ListGristTables.prototype.getWorkspaceTables = function (workspace) {
  const workspaceId = getGristId(workspace);

  return getWorkspaceDocsList(this.instanceUrl, workspaceId, this.apiKey)
    .then(readJson)
    .then((payload) => normalizeList(payload, "docs"))
    .then((docs) =>
      Promise.all(
        docs.map((doc) =>
          getDocTables(this.instanceUrl, getGristId(doc), this.apiKey)
            .then(readJson)
            .then((payload) =>
              normalizeList(payload, "tables").map((table) => ({
                doc,
                table,
                docId: getGristId(doc),
                docName: getGristName(doc),
                tableId: getGristId(table),
                tableName: getGristName(table),
              }))
            )
        )
      )
    )
    .then((tablesByDoc) => tablesByDoc.flat());
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

  this.loadPromise = this.getFirstOrg()
    .then((org) => this.ensureWorkspace(org))
    .then((workspace) => {
      this.workspace = workspace;
      return this.ensureDocument(workspace).then((document) => {
        this.document = document;
        return workspace;
      });
    })
    .then((workspace) => this.getWorkspaceTables(workspace))
    .then((tables) => {
      this.tables = tables;
      this.updateOptions();

      if (!tables.length) {
        this.setStatus("Aucune table trouvée dans le workspace mviewerstudio.");
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

ListGristTables.prototype.render = function () {
  this.element.innerHTML = `
    <label class="list-grist-tables__label" for="${this.id}">
      Table Grist
    </label>
    <select
      id="${this.id}"
      class="form-control"
      data-list-grist-tables-select
      disabled
    ></select>
    <p class="list-grist-tables__status text-muted" data-list-grist-tables-status></p>
  `;

  this.element
    .querySelector("[data-list-grist-tables-select]")
    ?.addEventListener("change", () => this.onChange(this.getSelectedTable()));

  this.updateOptions();
  if (this.autoload) {
    this.load();
  }

  return this.element;
};

export default ListGristTables;
