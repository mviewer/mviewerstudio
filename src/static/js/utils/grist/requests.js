/** fetch request to list user organizations in a Grist instance.
 * Request example:
 * curl -X 'GET' \
  'https://grist.numerique.gouv.fr/api/orgs' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer XXXXXXXXXXX'
 */
export const getUserOrgs = (instanceUrl, apiKey) => {
  return fetch(`${instanceUrl}/api/orgs`, {
    method: "GET",
    credentials: "omit",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });
};


/**
 * fetch request to list documents in a Grist instance.
 * Request example:
 * curl -X 'POST' \
  'https://grist.numerique.gouv.fr/api/workspaces/24314/docs' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer XXXXXXXXXXX' \
  -H 'Content-Type: application/json' \
  -d '{
  "name": "Competitive Analysis",
  "isPinned": false
}'
 * @param {*} instanceUrl 
 * @returns 
 */
export const getWorkspaceDocsList = (instanceUrl, workspaceId, apiKey) => {
  return fetch(`${instanceUrl}/api/workspaces/${workspaceId}/docs`, {
    method: "GET",
    credentials: "omit",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });
};

/**
 * Fetch org workspace list
 * Request example:
 * curl -X 'GET' \
  'https://grist.numerique.gouv.fr/api/orgs' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer XXXXXXXXXXX'
 */

export const getOrgWorkspaces = (instanceUrl, orgId, apiKey) => {
  return fetch(`${instanceUrl}/api/orgs/${orgId}/workspaces`, {
    method: "GET",
    credentials: "omit",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });
};

export const createOrgWorkspace = (instanceUrl, orgId, workspaceName, apiKey) => {
  return fetch(`${instanceUrl}/api/orgs/${orgId}/workspaces`, {
    method: "POST",
    credentials: "omit",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      name: workspaceName,
    }),
  });
};

export const createWorkspaceDoc = (instanceUrl, workspaceId, documentName, apiKey) => {
  return fetch(`${instanceUrl}/api/workspaces/${workspaceId}/docs`, {
    method: "POST",
    credentials: "omit",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      name: documentName,
      isPinned: false,
    }),
  });
};


/**
 * Generate the URL for accessing tables in a Grist document.
 * @param {*} instanceUrl 
 * @param {*} docid 
 * @returns 
 */
const tablesUrl = (instanceUrl, docid) => {
  return `${instanceUrl}/api/docs/${docid}/tables`;
};

/**
 * fetch the Grist API key from the specified Grist instance.
 * @param {*} instanceUrl 
 * @returns 
 */
export const getApiKey = (instanceUrl) => {
  return fetch(`${instanceUrl}/api/profile/apikey`);
};

/**
 * fetch the Grist user info from the specified Grist instance.
 * @param {*} instanceUrl 
 * @param {*} apiKey 
 * @returns 
 */
export const getUserInfo = (instanceUrl) => {
  return fetch(`${instanceUrl}/api/profile/user`);
};

/**
 * Send a POST request to the Grist API to create tables in a document.
 * request exemple
 curl -X 'POST' \
  'https://grist.numerique.gouv.fr/api/docs/[KEY]/tables' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer XXXXXXXXXXX' \
  -H 'Content-Type: application/json' \
  -d '{"tables": [{"id": "People","columns": [{"id": "pet","fields": {"label": "Pet"}}]}]}'
 * @param {string} instanceUrl - The base URL of the Grist instance.
 * @param {string} docid - The ID of the document where tables will be created.
 * @param {Array} tablesData - An array of table data to be sent in the request body.
 * @param {string} apiKey - The Grist API key for authentication.
 */
export const postTablesToDoc = (instanceUrl, docid, tablesData, apiKey) => {
  return fetch(`${tablesUrl(instanceUrl, docid)}`, {
    method: "POST",
    credentials: "omit",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify(tablesData)
  });
};

/**
 * Retrieve the list of tables in a Grist document.
 * curl -X 'GET' \
  'https://grist.numerique.gouv.fr/api/docs/[KEY]/tables' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer XXXXXXXXXXX'
 * @param {*} instanceUrl 
 * @param {*} docid 
 * @param {*} apiKey 
 * @returns 
 */
export const getDocTables = (instanceUrl, docid, apiKey) => {
  return fetch(`${tablesUrl(instanceUrl, docid)}`, {
    method: "GET",
    credentials: "omit",
    headers: {
      "Authorization": `Bearer ${apiKey}`
    }
  });
};
