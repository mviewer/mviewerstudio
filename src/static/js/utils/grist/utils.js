import {
  createOrgWorkspace,
  getOrgWorkspaces,
  getUserOrgs,
  getWorkspaceDocsList,
} from "./requests.js";

let configPromise = null;

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
 */

/**
 * Read Grist settings from the static application config.
 *
 * @returns {Promise<GristConfig>} Grist settings.
 * @throws {Error} When the Grist config is missing or incomplete.
 */
export const getGristConfig = async () => {
  if (!configPromise) {
    configPromise = fetch("config.json")
      .then(readJson)
      .then((config) => {
        const gristConfig =
          config.app_conf && config.app_conf.grist ? config.app_conf.grist : {};
        const instanceUrl = gristConfig.instance_url;
        const apiUrl = gristConfig.api_url || instanceUrl;
        // use personal workspace as default if no org_id is provided
        const orgId = gristConfig.org_id || "Personal";
        const workspaceName = gristConfig.workspace_name;

        if (!instanceUrl || !apiUrl || !orgId || !workspaceName) {
          throw new Error("Missing Grist configuration");
        }

        return {
          instanceUrl,
          apiUrl,
          orgId,
          workspaceName,
        };
      });
  }

  return configPromise;
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
  const gristConfig = await getGristConfig();
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
  const gristConfig = await getGristConfig();
  const workspaceId = await getOrCreateWorkspace(gristApiKey);

  if (!hasGristId(workspaceId)) {
    throw new Error("Unable to list Grist documents without a workspace id");
  }

  return getWorkspaceDocsList(gristConfig.apiUrl, workspaceId, gristApiKey);
};
