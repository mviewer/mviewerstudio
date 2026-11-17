/**
 * Build a localized Grist API error using the response body or HTTP status.
 * @param {Response|Error} response Failed API response or request/decoding error.
 * @returns {Promise<Error>} Error containing the API message for display.
 */
export const createGristApiError = async (response) => {
  if (response.name === "GristApiError") {
    return response;
  }

  let apiMessage = response.message;
  if (response.status !== undefined) {
    apiMessage = `HTTP ${response.status}`;
  }
  if (typeof response.text === "function") {
    try {
      const content = (await response.text()).trim();
      if (content) {
        apiMessage = content;
        try {
          const payload = JSON.parse(content);
          if (typeof payload.error === "string") {
            apiMessage = payload.error;
          } else if (payload.error && typeof payload.error.message === "string") {
            apiMessage = payload.error.message;
          } else if (typeof payload.message === "string") {
            apiMessage = payload.message;
          } else if (typeof payload.description === "string") {
            apiMessage = payload.description;
            if (typeof payload.name === "string") {
              apiMessage = `${payload.name}: ${apiMessage}`;
            }
          }
        } catch {
          // Plain-text error responses are also supported.
        }
        const contentType = response.headers.get("Content-Type") || "";
        if (
          contentType.includes("text/html") ||
          /^<(?:!doctype\s+html|html|head|body)\b/i.test(content)
        ) {
          apiMessage = `HTTP ${response.status}`;
          const incident = content.match(/Incapsula incident ID:\s*([\d-]+)/i);
          if (incident) {
            apiMessage += ` - Request unsuccessful. Incapsula incident ID: ${incident[1]}`;
          }
        }
      }
    } catch {
      // Keep the HTTP status when the response body cannot be read.
    }
  }
  const message = mviewer.tr("api.error.message").replace("{message}", () => apiMessage);
  const error = new Error(message);
  error.name = "GristApiError";
  return error;
};

/**
 * Fetch a response and standardize failures with createGristApiError.
 * @param {string} url Grist API URL.
 * @param {Object} [options] Fetch options.
 * @returns {Promise<Response>} Successful API response.
 */
export const fetchWithApiError = async (url, options) => {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw await createGristApiError(response);
    }
    return response;
  } catch (error) {
    throw await createGristApiError(error);
  }
};

/**
 * Read a Grist response and standardize body reading or decoding failures.
 * @param {Response} response Grist response.
 * @param {string} [format="json"] Body format: json or text.
 * @returns {Promise<*>} Decoded response body.
 */
export const readGristResponse = async (response, format = "json") => {
  try {
    if (!response.ok) {
      throw await createGristApiError(response);
    }
    return await response[format]();
  } catch (error) {
    throw await createGristApiError(error);
  }
};
