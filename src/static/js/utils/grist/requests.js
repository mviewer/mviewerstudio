/**
 * Build the authorization headers used by Grist API requests.
 *
 * @param {string} apiKey Grist API key.
 * @returns {Object} Headers containing the bearer token.
 */
const getAuthHeaders = (apiKey) => {
  return {
    Authorization: `Bearer ${apiKey}`,
  };
};

/**
 * Build the headers used by Grist API requests with a JSON body.
 *
 * @param {string} apiKey Grist API key.
 * @returns {Object} Headers containing content type and bearer token.
 */
const getJsonHeaders = (apiKey) => {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };
};

/**
 * Build the URL used to access tables from a Grist document.
 *
 * @param {string} instanceUrl Base URL of the Grist instance or nginx proxy.
 * @param {string|number} docId Grist document id.
 * @returns {string} Grist tables API URL.
 */
const getTablesUrl = (instanceUrl, docId) => {
  return `${instanceUrl}/api/docs/${docId}/tables`;
};

/**
 * Build the URL used to access records from a Grist table.
 *
 * @param {string} instanceUrl Base URL of the Grist instance or nginx proxy.
 * @param {string|number} docId Grist document id.
 * @param {string|number} tableId Grist table id.
 * @param {number} [limit] Maximum number of records to fetch.
 * @returns {string} Grist table records API URL.
 */
const getTableRecordsUrl = (instanceUrl, docId, tableId, limit) => {
  const url = `${instanceUrl}/api/docs/${docId}/tables/${encodeURIComponent(tableId)}/records`;

  return limit ? `${url}?limit=${encodeURIComponent(limit)}` : url;
};

const hasGristId = (id) => id !== undefined && id !== null && id !== "";

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

/**
 * List organizations available to the current Grist API key.
 *
 * @param {string} instanceUrl Base URL of the Grist instance or nginx proxy.
 * @param {string} apiKey Grist API key.
 * @returns {Promise<Response>} Fetch response from the Grist API.
 */
export const getUserOrgs = (instanceUrl, apiKey) => {
  return fetch(`${instanceUrl}/api/orgs`, {
    method: "GET",
    credentials: "omit",
    headers: getAuthHeaders(apiKey),
  });
};

/**
 * Get a Grist workspace description.
 *
 * The response contains the workspace documents in `data.docs`.
 *
 * @param {string} instanceUrl Base URL of the Grist instance or nginx proxy.
 * @param {string|number} workspaceId Grist workspace id.
 * @param {string} apiKey Grist API key.
 * @returns {Promise<Response>} Fetch response from the Grist API.
 */
export const getDescribeWorkspace = (instanceUrl, workspaceId, apiKey) => {
  if (!hasGristId(workspaceId)) {
    return Promise.reject(
      new Error("Unable to describe Grist workspace without a workspace id")
    );
  }

  return fetch(`${instanceUrl}/api/workspaces/${workspaceId}`, {
    method: "GET",
    credentials: "omit",
    headers: getAuthHeaders(apiKey),
  });
};

/**
 * List documents from a Grist workspace.
 *
 * This helper uses `getDescribeWorkspace` because the Grist workspace
 * description contains the documents in its `docs` property.
 *
 * @param {string} instanceUrl Base URL of the Grist instance or nginx proxy.
 * @param {string|number} workspaceId Grist workspace id.
 * @param {string} apiKey Grist API key.
 * @returns {Promise<Object[]>} Documents found in the workspace.
 * @throws {Error} When the Grist API response is not successful.
 */
export const getWorkspaceDocsList = (instanceUrl, workspaceId, apiKey) => {
  return getDescribeWorkspace(instanceUrl, workspaceId, apiKey)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Grist request failed with status ${response.status}`);
      }

      return response.json();
    })
    .then((workspaceDescription) => {
      return normalizeList(workspaceDescription, "docs");
    });
};

/**
 * List workspaces from a Grist organization.
 *
 * @param {string} instanceUrl Base URL of the Grist instance or nginx proxy.
 * @param {string|number} orgId Grist organization id or domain.
 * @param {string} apiKey Grist API key.
 * @returns {Promise<Response>} Fetch response from the Grist API.
 */
export const getOrgWorkspaces = (instanceUrl, orgId, apiKey) => {
  return fetch(`${instanceUrl}/api/orgs/${orgId}/workspaces`, {
    method: "GET",
    credentials: "omit",
    headers: getAuthHeaders(apiKey),
  });
};

/**
 * Create a workspace in a Grist organization.
 *
 * @param {string} instanceUrl Base URL of the Grist instance or nginx proxy.
 * @param {string|number} orgId Grist organization id or domain.
 * @param {string} workspaceName Name of the workspace to create.
 * @param {string} apiKey Grist API key.
 * @returns {Promise<Response>} Fetch response from the Grist API.
 */
export const createOrgWorkspace = (
  instanceUrl,
  orgId,
  workspaceName,
  apiKey
) => {
  const body = {
    name: workspaceName,
  };

  return fetch(`${instanceUrl}/api/orgs/${orgId}/workspaces`, {
    method: "POST",
    credentials: "omit",
    headers: getJsonHeaders(apiKey),
    body: JSON.stringify(body),
  });
};

/**
 * Create a document in a Grist workspace.
 *
 * @param {string} instanceUrl Base URL of the Grist instance or nginx proxy.
 * @param {string|number} workspaceId Grist workspace id.
 * @param {string} documentName Name of the document to create.
 * @param {string} apiKey Grist API key.
 * @returns {Promise<Response>} Fetch response from the Grist API.
 */
export const createWorkspaceDoc = (
  instanceUrl,
  workspaceId,
  documentName,
  apiKey
) => {
  const body = {
    name: documentName,
    isPinned: false,
  };

  return fetch(`${instanceUrl}/api/workspaces/${workspaceId}/docs`, {
    method: "POST",
    credentials: "omit",
    headers: getJsonHeaders(apiKey),
    body: JSON.stringify(body),
  });
};

/**
 * Get the Grist API key of the connected user.
 *
 * @param {string} instanceUrl Base URL of the Grist instance or nginx proxy.
 * @returns {Promise<Response>} Fetch response from the Grist API.
 */
export const getApiKey = (instanceUrl) => {
  return fetch(`${instanceUrl}/api/profile/apikey`);
};

/**
 * Get profile information for the connected Grist user.
 *
 * @param {string} instanceUrl Base URL of the Grist instance or nginx proxy.
 * @returns {Promise<Response>} Fetch response from the Grist API.
 */
export const getUserInfo = (instanceUrl) => {
  return fetch(`${instanceUrl}/api/profile/user`);
};

/**
 * Create tables in a Grist document.
 *
 * @param {string} instanceUrl Base URL of the Grist instance or nginx proxy.
 * @param {string|number} docId Grist document id.
 * @param {Object} tablesData Tables payload expected by the Grist API.
 * @param {string} apiKey Grist API key.
 * @returns {Promise<Response>} Fetch response from the Grist API.
 */
export const postTablesToDoc = (instanceUrl, docId, tablesData, apiKey) => {
  return fetch(getTablesUrl(instanceUrl, docId), {
    method: "POST",
    credentials: "omit",
    headers: getJsonHeaders(apiKey),
    body: JSON.stringify(tablesData),
  });
};

/**
 * List tables from a Grist document.
 *
 * @param {string} instanceUrl Base URL of the Grist instance or nginx proxy.
 * @param {string|number} docId Grist document id.
 * @param {string} apiKey Grist API key.
 * @returns {Promise<Response>} Fetch response from the Grist API.
 */
export const getDocTables = (instanceUrl, docId, apiKey) => {
  return fetch(getTablesUrl(instanceUrl, docId), {
    method: "GET",
    credentials: "omit",
    headers: getAuthHeaders(apiKey),
  });
};

/**
 * Get records from a Grist table.
 *
 * @param {string} instanceUrl Base URL of the Grist instance or nginx proxy.
 * @param {string|number} docId Grist document id.
 * @param {string|number} tableId Grist table id.
 * @param {string} apiKey Grist API key.
 * @param {Object} [options] Request options.
 * @param {number} [options.limit] Maximum number of records to fetch.
 * @returns {Promise<Response>} Fetch response from the Grist API.
 */
export const getTableRecords = (
  instanceUrl,
  docId,
  tableId,
  apiKey,
  options = {}
) => {
  return fetch(getTableRecordsUrl(instanceUrl, docId, tableId, options.limit), {
    method: "GET",
    credentials: "omit",
    headers: getAuthHeaders(apiKey),
  });
};
