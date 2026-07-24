import {
  createOrgWorkspace,
  getOrgWorkspaces,
  getTableRecords,
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
 * @property {string} instanceUrl Grist instance URL.
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
        const gristConfig = config?.app_conf?.grist || {};
        const instanceUrl = gristConfig.instance_url;
        const orgId = gristConfig.org_id;
        const workspaceName = gristConfig.workspace_name;

        if (!instanceUrl || !orgId || !workspaceName) {
          throw new Error("Missing Grist configuration");
        }

        return {
          instanceUrl,
          orgId,
          workspaceName,
        };
      });
  }

  return configPromise;
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
 * Normalize Grist API list responses, which may be arrays or keyed objects.
 *
 * @param {*[]|Object|null|undefined} payload Grist API response payload.
 * @param {string} key Object property that contains the list.
 * @returns {*[]} Normalized list.
 */
const normalizeList = (payload, key) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.[key])) {
    return payload[key];
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (Array.isArray(payload?.data?.[key])) {
    return payload.data[key];
  }

  return [];
};

const hasGristId = (id) => id !== undefined && id !== null && id !== "";

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

  return (
    item?.id ??
    item?.data?.id ??
    item?.workspace?.id ??
    item?.name ??
    item?.domain
  );
};

const getWorkspaceId = (item) => {
  if (typeof item === "string" || typeof item === "number") {
    return item;
  }

  if (typeof item?.data === "string" || typeof item?.data === "number") {
    return item.data;
  }

  if (
    typeof item?.workspace === "string" ||
    typeof item?.workspace === "number"
  ) {
    return item.workspace;
  }

  return item?.id ?? item?.data?.id ?? item?.workspace?.id;
};

/**
 * Read the display name exposed by a Grist entity.
 *
 * @param {GristEntity|null|undefined} item Grist entity.
 * @returns {string|number|undefined} Entity display name.
 */
const getGristName = (item) => item?.name ?? item?.title ?? item?.id;

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
  const orgsPayload = await getUserOrgs(
    gristConfig.instanceUrl,
    gristApiKey
  ).then(readJson);
  const org = normalizeList(orgsPayload, "orgs").find(
    (item) =>
      getGristId(item) === gristConfig.orgId ||
      getGristName(item) === gristConfig.orgId ||
      item?.domain === gristConfig.orgId
  );

  if (!org) {
    throw new Error(`Grist organization "${gristConfig.orgId}" not found`);
  }

  const workspacesPayload = await getOrgWorkspaces(
    gristConfig.instanceUrl,
    gristConfig.orgId,
    gristApiKey
  ).then(readJson);
  const workspace = normalizeList(workspacesPayload, "workspaces").find(
    (item) => getGristName(item) === gristConfig.workspaceName
  );

  if (workspace) {
    const workspaceId = getWorkspaceId(workspace);

    if (!hasGristId(workspaceId)) {
      throw new Error(
        `Grist workspace "${gristConfig.workspaceName}" has no id`
      );
    }

    return workspaceId;
  }

  const createdWorkspace = await createOrgWorkspace(
    gristConfig.instanceUrl,
    gristConfig.orgId,
    gristConfig.workspaceName,
    gristApiKey
  ).then(readJson);

  const createdWorkspaceId = getWorkspaceId(createdWorkspace);

  if (!hasGristId(createdWorkspaceId)) {
    throw new Error(
      `Created Grist workspace "${gristConfig.workspaceName}" has no id`
    );
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

  return getWorkspaceDocsList(
    gristConfig.instanceUrl,
    workspaceId,
    gristApiKey
  );
};

/**
 * Fetch preview rows from a selected Grist table and format them for the table
 * preview component.
 *
 * @param {Object|null} selectedTable Selected table entry from ListGristTables.
 * @param {string|number} selectedTable.docId Grist document id.
 * @param {string|number} selectedTable.tableId Grist table id.
 * @param {string} gristApiKey Grist API key.
 * @returns {Promise<{data: Object[], meta: {fields: string[]}}>} Preview data.
 */
export const gristTableToPreview = async (selectedTable, gristApiKey) => {
  if (!selectedTable?.docId || !selectedTable?.tableId || !gristApiKey) {
    return { data: [], meta: { fields: [] } };
  }

  const gristConfig = await getGristConfig();
  const payload = await getTableRecords(
    gristConfig.instanceUrl,
    selectedTable.docId,
    selectedTable.tableId,
    gristApiKey,
    { limit: 5 }
  ).then(readJson);
  const rows = normalizeList(payload, "records").map((record) => ({
    ...(record?.fields || record),
  }));
  const fields = rows.reduce((headers, row) => {
    Object.keys(row || {}).forEach((key) => {
      if (!headers.includes(key)) {
        headers.push(key);
      }
    });

    return headers;
  }, []);

  return { data: rows, meta: { fields } };
};
