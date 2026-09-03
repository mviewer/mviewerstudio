import {
  createOrgWorkspace,
  getOrgWorkspaces,
  getUserOrgs,
  getWorkspaceDocsList,
} from "./requests.js";

/**
 * @typedef {Object} GristEntity
 * @property {string|number} [id] Entity identifier.
 * @property {string} [name] Entity name.
 * @property {string} [title] Entity title.
 * @property {string} [domain] Organization domain.
 */

/**
 * @typedef {Object} GristConfig
 * @property {string} instanceUrl Grist interface URL.
 * @property {string} apiUrl Grist REST API URL.
 * @property {string} orgId Grist organization id or domain.
 * @property {string} workspaceName Workspace name used by mviewerstudio.
 * @property {string} geocodingBanControlType BAN result control mode.
 * @property {number} geocodingScoreThreshold Minimum accepted BAN score.
 * @property {string[]} geocodingBanTypeOrder BAN result type quality order.
 * @property {string} geocodingBanMinimalType Minimum accepted BAN result type.
 */

/**
 * Read Grist settings from the static application config.
 *
 * @returns {GristConfig} Grist settings.
 * @throws {Error} When the Grist config is missing or incomplete.
 */
export const getGristConfig = () => {
  const appConfig = window._conf;

  if (!appConfig) {
    throw new Error("MviewerStudio configuration is not loaded");
  }

  const gristConfig = appConfig.grist || {};
  const instanceUrl = gristConfig.instance_url;
  const apiUrl = gristConfig.api_url || instanceUrl;
  const orgId = gristConfig.org_id || "Personal";
  const workspaceName = gristConfig.workspace_name;
  const geocodingBanControlType = gristConfig.geocoding_ban_control_type || "score";
  const geocodingScoreThreshold = gristConfig.geocoding_score_threshold || 0.8;
  const geocodingBanTypeOrder = gristConfig.geocoding_ban_type_order || [];
  const geocodingBanMinimalType =
    gristConfig.geocoding_ban_minimal_type || "street";

  if (!instanceUrl || !apiUrl || !orgId || !workspaceName) {
    throw new Error("Missing Grist configuration");
  }

  return {
    instanceUrl,
    apiUrl,
    orgId,
    workspaceName,
    geocodingBanControlType,
    geocodingScoreThreshold,
    geocodingBanTypeOrder,
    geocodingBanMinimalType,
  };
};

/**
 * Build the Grist interface URL for a document table.
 *
 * @param {string} instanceUrl Base URL of the Grist instance.
 * @param {string|number} orgId Grist organization id or domain.
 * @param {string|number} docId Grist document id.
 * @param {string|number} tableId Grist table id.
 * @param {string|number} tableRef Grist table reference.
 * @returns {string} URL that opens the table in Grist.
 */
export const getGristTableUrl = (instanceUrl, orgId, docId, tableId, tableRef) => {
  const baseUrl = `${instanceUrl}`.replace(/\/+$/, "");
  const encodedDocId = encodeURIComponent(docId);
  const encodedTableRef = encodeURIComponent(tableRef);

  if (`${orgId}`.toLowerCase() === "personal") {
    return `${baseUrl}/o/docs/${encodedDocId}/${encodeURIComponent(tableId)}/p/${encodedTableRef}`;
  }

  return `${baseUrl}/o/${encodeURIComponent(orgId)}/${encodedDocId}/data/p/${encodedTableRef}`;
};

/**
 * Extract the Grist document and table identifiers from a CSV download URL.
 *
 * @param {string} url Grist CSV download URL.
 * @returns {{docId: string, tableId: string}|null} Identifiers, or null when the URL is not a Grist CSV URL.
 */
export const getGristCsvTableInfo = (url) => {
  const gristUrl = new URL(url, window.location.origin);
  const documentMatch = gristUrl.pathname.match(/\/api\/docs\/([^/]+)\/download\/csv$/);
  const tableId = gristUrl.searchParams.get("tableId");

  if (!documentMatch || !tableId) {
    return null;
  }

  return {
    docId: documentMatch[1],
    tableId,
  };
};

/**
 * Parse a successful Grist API response as JSON.
 *
 * @param {Response} response Fetch response.
 * @returns {Promise<*>} Parsed JSON body.
 * @throws {Error} When the Grist API response is not successful.
 */
const readJson = async (response) => {
  if (!response.ok) {
    throw new Error(`Grist request failed with status ${response.status}`);
  }

  return response.json();
};

/**
 * Check whether a value can be used as a Grist identifier.
 *
 * @param {*} id Candidate identifier.
 * @returns {boolean} True when the identifier is present.
 */
const hasGristId = (id) => {
  if (!id) {
    return false;
  }

  return true;
};

/**
 * Read the most stable identifier exposed by a Grist entity.
 *
 * @param {GristEntity|null|undefined} item Grist entity.
 * @returns {string|number|undefined} Entity identifier.
 */
const getGristId = (item) => {
  if (typeof item === "string" || typeof item === "number") {
    return item;
  }

  if (!item) {
    return undefined;
  }

  if (item.id) {
    return item.id;
  }

  if (item.data && item.data.id) {
    return item.data.id;
  }

  if (item.workspace && item.workspace.id) {
    return item.workspace.id;
  }

  return item.name || item.domain;
};

/**
 * Read the workspace id from the different shapes returned by the Grist API.
 *
 * @param {GristEntity|string|number|null|undefined} item Grist workspace entity.
 * @returns {string|number|undefined} Workspace identifier.
 */
const getWorkspaceId = (item) => {
  if (typeof item === "string" || typeof item === "number") {
    return item;
  }

  if (!item) {
    return undefined;
  }

  if (typeof item.data === "string" || typeof item.data === "number") {
    return item.data;
  }

  if (typeof item.workspace === "string" || typeof item.workspace === "number") {
    return item.workspace;
  }

  if (item.id) {
    return item.id;
  }

  if (item.data && item.data.id) {
    return item.data.id;
  }

  if (item.workspace && item.workspace.id) {
    return item.workspace.id;
  }

  return undefined;
};

/**
 * Read the display name exposed by a Grist entity.
 *
 * @param {GristEntity|null|undefined} item Grist entity.
 * @returns {string|number|undefined} Entity display name.
 */
const getGristName = (item) => {
  if (!item) {
    return undefined;
  }

  return item.name || item.title || item.id;
};

/**
 * Return the configured Grist workspace id, creating the workspace when it does
 * not already exist.
 *
 * @param {string} gristApiKey Grist API key.
 * @returns {Promise<string|number|undefined>} Workspace id.
 * @throws {Error} When the configured organization is not available or a Grist request fails.
 */
export const getOrCreateWorkspace = async (gristApiKey) => {
  const gristConfig = getGristConfig();
  const orgsPayload = await getUserOrgs(gristConfig.apiUrl, gristApiKey).then(readJson);
  const org = (orgsPayload || []).find(
    (item) =>
      getGristId(item) === gristConfig.orgId ||
      getGristName(item) === gristConfig.orgId ||
      (item && item.domain === gristConfig.orgId)
  );

  if (!org) {
    throw new Error(`Grist organization "${gristConfig.orgId}" not found`);
  }

  const workspacesPayload = await getOrgWorkspaces(
    gristConfig.apiUrl,
    getGristId(org),
    gristApiKey
  ).then(readJson);
  const workspace = (workspacesPayload || []).find(
    (item) => getGristName(item) === gristConfig.workspaceName
  );

  if (workspace) {
    const workspaceId = getWorkspaceId(workspace);

    if (!hasGristId(workspaceId)) {
      throw new Error(`Grist workspace "${gristConfig.workspaceName}" has no id`);
    }

    return workspaceId;
  }

  const createdWorkspace = await createOrgWorkspace(
    gristConfig.apiUrl,
    getGristId(org),
    gristConfig.workspaceName,
    gristApiKey
  ).then(readJson);

  const createdWorkspaceId = getWorkspaceId(createdWorkspace);

  if (!hasGristId(createdWorkspaceId)) {
    throw new Error(`Created Grist workspace "${gristConfig.workspaceName}" has no id`);
  }

  return createdWorkspaceId;
};

/**
 * List all documents from the configured Grist workspace.
 *
 * @param {string} gristApiKey Grist API key.
 * @returns {Promise<GristEntity[]>} Workspace documents.
 * @throws {Error} When workspace lookup or document listing fails.
 */
export const listDocs = async (gristApiKey) => {
  const gristConfig = getGristConfig();
  const workspaceId = await getOrCreateWorkspace(gristApiKey);

  if (!hasGristId(workspaceId)) {
    throw new Error("Unable to list Grist documents without a workspace id");
  }

  return getWorkspaceDocsList(gristConfig.apiUrl, workspaceId, gristApiKey);
};
