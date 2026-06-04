import qgisToMviewer from "./qgisToMviewer.js";

const escapeHtmlAttribute = function (value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
};

// QGIS project import utilities
const qgis = {
  /**
   * Tracks whether the QGIS project search UI listeners have been registered.
   *
   * @type {boolean}
   */
  _qgsProjectSearchInitialized: false,
  /**
   * Tracks whether the QGIS import-by-URL listeners have been registered.
   *
   * @type {boolean}
   */
  _qgisImportUrlInitialized: false,
  /**
   * Tracks whether the local QGIS file import listener has been registered.
   *
   * @type {boolean}
   */
  _qgisLocalFileImportInitialized: false,
  /**
   * Tracks whether the stored QGIS projects list listeners have been registered.
   *
   * @type {boolean}
   */
  _qgisProjectsListInitialized: false,
  /**
   * Imports a QGIS project file content.
   *
   * @param {string} content Raw `.qgs` file content.
   * @returns {string|undefined} Generated mviewer XML, or `undefined` when the converter is unavailable.
   */
  importQgs: function (content) {
    const mviewerXml = qgisToMviewer.convertQgsContentToMviewerXml(content);
    if (typeof window.mv !== "undefined" && typeof window.mv.parseApplication === "function") {
      const xmlDoc = new DOMParser().parseFromString(mviewerXml, "text/xml");
      window.mv.parseApplication(xmlDoc);
    }
    return mviewerXml;
  },
  /**
   * Parses a mviewer XML document into the Studio state.
   *
   * @param {Document} xml Parsed mviewer XML document.
   * @returns {void}
   */
  parseMviewerApplicationXml: function (xml) {
    const idApp = xml.getElementsByTagName("dc:identifier")[0]?.innerHTML;

    if (!idApp) {
      window.mv.parseApplication(xml);
      return;
    }

    window.mv.appExists(idApp, (response) =>
      window.mv.parseApplication(xml, response.exists)
    );
  },
  /**
   * Returns `true` when the selected file is a QGIS project.
   *
   * @param {File} file Selected file.
   * @param {Document} xml Parsed file document.
   * @returns {boolean} `true` when the file is a QGIS project.
   */
  isQgisProjectFile: function (file, xml) {
    const fileName = file?.name?.toLowerCase() || "";
    return (
      fileName.endsWith(".qgs") ||
      fileName.endsWith(".qgis") ||
      qgisToMviewer.isQgisProjectDocument(xml)
    );
  },
  /**
   * Reads a selected import file and returns a mviewer XML document.
   *
   * @param {File} file Selected file.
   * @returns {Promise<Document>} Parsed mviewer XML document.
   */
  readImportFileAsMviewerXml: function (file) {
    if (!file) {
      return Promise.reject(new Error("Missing import file"));
    }

    return file
      .text()
      .then((content) => {
        const xml = window.$.parseXML(content);
        if (this.isQgisProjectFile(file, xml)) {
          return window.$.parseXML(qgisToMviewer.convertQgsContentToMviewerXml(content));
        }
        return xml;
      });
  },
  /**
   * Loads the file currently selected in the main import input.
   *
   * @returns {void}
   */
  loadApplicationParametersFromFileInput: function () {
    const fileInput = document.getElementById("filebutton");
    const file = fileInput?.files?.[0];

    if (!file) {
      return;
    }

    document.querySelectorAll('[id="local-file-name"]').forEach((input) => {
      input.value = file.name;
    });

    this.readImportFileAsMviewerXml(file)
      .then((xml) => {
        this.parseMviewerApplicationXml(xml);
        window.showStudio();
      })
      .catch((error) => {
        window.alertCustom(window.mviewer.tr("msg.xml_doc_invalid"), "danger");
      });
  },
  /**
   * Returns the configured base URL of QGIS Server used to expose published projects.
   *
   * @returns {string} Base URL ending with a slash when configured.
   */
  getConfiguredQgisProjectsBaseUrl: function () {
    const configuredUrl = window._conf?.qgis?.url || "";
    return configuredUrl ? configuredUrl.replace(/\/?$/, "/") : "";
  },
  /**
   * Returns `true` when the configured QGIS Server host matches the current Studio host.
   *
   * Localhost aliases are treated as equivalent so that local dev setups keep
   * showing the stored-projects table.
   *
   * @returns {boolean} `true` when the QGIS Server is hosted on the same machine.
   */
  isConfiguredQgisServerOnCurrentHost: function () {
    const configuredUrl = this.getConfiguredQgisProjectsBaseUrl();
    if (!configuredUrl) {
      return false;
    }

    const configuredHost = new URL(configuredUrl, window.location.href).hostname.toLowerCase();
    const currentHost = window.location.hostname.toLowerCase();
    const localhostAliases = ["localhost", "127.0.0.1", "::1"];

    if (configuredHost === currentHost) {
      return true;
    }

    return (
      localhostAliases.includes(configuredHost) &&
      localhostAliases.includes(currentHost)
    );
  },
  /**
   * Builds the GetCapabilities URL for a QGIS project stored on the server.
   *
   * @param {string} projectName Stored QGIS project name.
   * @returns {string} Full WMS GetCapabilities URL.
   */
  buildProjectCapabilitiesUrl: function (projectName) {
    const baseUrl = this.getConfiguredQgisProjectsBaseUrl();
    if (!baseUrl) {
      throw new Error("La configuration qgis.url est manquante");
    }
    if (!projectName) {
      throw new Error("Le nom du projet QGIS est manquant");
    }

    return `${baseUrl}${encodeURIComponent(
      projectName
    )}?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetCapabilities`;
  },
  /**
   * Returns `true` when the provided URL explicitly targets a GetCapabilities request.
   *
   * @param {string} projectUrl User-provided QGIS URL.
   * @returns {boolean} `true` when `REQUEST=GetCapabilities` is present.
   */
  isGetCapabilitiesUrl: function (projectUrl) {
    const url = new URL(projectUrl, window.location.href);
    const requestValue = url.searchParams.get("REQUEST") || url.searchParams.get("request");
    return (requestValue || "").toLowerCase() === "getcapabilities";
  },
  /**
   * Converts a remote QGIS project source to a mviewer XML string.
   *
   * @param {string} projectUrl User-provided QGIS GetCapabilities URL.
   * @returns {Promise<string>} Generated mviewer XML configuration.
   */
  createMviewerXmlFromQgisUrl: function (projectUrl) {
    const normalizedUrl = projectUrl.trim();
    if (!normalizedUrl) {
      return Promise.reject(new Error("Missing QGIS project URL"));
    }

    if (!this.isGetCapabilitiesUrl(normalizedUrl)) {
      return Promise.reject(
        new Error("L'URL du projet QGIS doit être une requête GetCapabilities")
      );
    }

    return fetch("api/app/qgis/capabilities", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: normalizedUrl,
      }),
    }).then((response) =>
      response.ok
        ? response.text()
        : response.text().then((text) => Promise.reject(text || response.statusText))
    );
  },
  /**
   * Loads a QGIS project URL into the Studio by converting it to mviewer XML.
   *
   * @returns {Promise<void>} Promise resolved when the configuration is loaded.
   */
  createConfigFromQgisAppUrl: function () {
    const urlInput = document.getElementById("getQgisApp");
    const button = document.getElementById("createConfigFromQgisAppUrl");
    const projectUrl = urlInput ? urlInput.value.trim() : "";

    if (!projectUrl) {
      if (urlInput) {
        urlInput.classList.add("is-invalid");
      }
      return Promise.resolve();
    }

    if (urlInput) {
      urlInput.classList.remove("is-invalid");
    }

    if (button) {
      button.disabled = true;
    }

    return this.createMviewerXmlFromQgisUrl(projectUrl)
      .then((mviewerXml) => {
        this.parseMviewerApplicationXml(window.$.parseXML(mviewerXml));
        window.showStudio();
      })
      .catch((error) => {
        const message =
          typeof error === "string"
            ? error
            : error?.message || "La conversion du projet QGIS a échoué";
        window.alertCustom(message, "danger");
      })
      .finally(() => {
        if (button) {
          button.disabled = !projectUrl;
        }
      });
  },
  /**
   * Uploads a QGIS project archive/file, computes its GetCapabilities URL and loads it.
   *
   * @param {File} file Selected local QGIS file or archive.
   * @returns {Promise<void>} Promise resolved when the mviewer configuration is loaded.
   */
  importQgisServerProjectFile: function (file) {
    if (!file) {
      return Promise.reject(new Error("Missing QGIS file"));
    }

    const urlInput = document.getElementById("getQgisApp");
    const localFileNameInput = document.getElementById("qgis-local-file-name");

    if (localFileNameInput) {
      localFileNameInput.value = file.name;
    }

    return this.sendQgisProject(file)
      .then((data) => {
        const projectName =
          data?.projectName || data?.projects?.[0]?.projectName || "";
        const capabilitiesUrl = this.buildProjectCapabilitiesUrl(projectName);

        if (urlInput) {
          urlInput.value = capabilitiesUrl;
          urlInput.classList.remove("is-invalid");
        }

        return this.createMviewerXmlFromQgisUrl(capabilitiesUrl);
      })
      .then((mviewerXml) => {
        this.parseMviewerApplicationXml(window.$.parseXML(mviewerXml));
        window.showStudio();
      });
  },
  /**
   * Uploads a QGIS project file to the server.
   *
   * @param {File} file QGIS project file selected by the user.
   * @returns {Promise<Object>} Uploaded project metadata returned by the API.
   */
  sendQgisProject: function (file) {
    if (!file) {
      return Promise.reject(new Error("Missing QGS file"));
    }

    const formData = new FormData();
    formData.append("file", file);

    return fetch("api/app/qgis/projects", {
      method: "POST",
      body: formData,
    })
      .then((response) =>
        response.ok
          ? response.json()
          : response.text().then((text) => Promise.reject(text))
      )
      .then((data) => {
        window.alertCustom(`${data.fileName} uploaded`, "success");
        this.refreshStoredQgisProjectsTable();
        return data;
      })
      .catch((error) => {
        window.alertCustom(error || "QGS upload failed", "danger");
        return Promise.reject(error);
      });
  },
  /**
   * Returns the list of QGIS projects currently stored on the server.
   *
   * @returns {Promise<Array<Object>>} Stored QGIS projects metadata.
   */
  fetchStoredQgisProjects: function () {
    return fetch("api/app/qgis/projects", {
      method: "GET",
      cache: "no-cache",
    }).then((response) =>
      response.ok
        ? response.json()
        : response.text().then((text) => Promise.reject(text || response.statusText))
    );
  },
  /**
   * Renders the server-side QGIS projects table inside the import tab.
   *
   * @param {Array<Object>} projects Stored QGIS projects metadata.
   * @returns {void}
   */
  renderStoredQgisProjectsTable: function (projects) {
    const tableBody = document.getElementById("qgis-projects-table-body");
    if (!tableBody) {
      return;
    }

    if (!projects || projects.length === 0) {
      tableBody.innerHTML =
        '<tr><td colspan="2" class="text-muted">Aucune configuration QGIS disponible.</td></tr>';
      return;
    }

    tableBody.innerHTML = projects
      .map((project) => {
        const projectName = project.projectName || "";
        const capabilitiesUrl = this.buildProjectCapabilitiesUrl(projectName);
        return `
          <tr>
            <td>${projectName}</td>
            <td>
              <div class="qgis-project-actions" role="group" aria-label="Actions QGIS">
                <button
                  type="button"
                  class="btn qgis-project-action-btn qgis-project-action-btn-copy"
                  data-bs-toggle="tooltip"
                  data-bs-placement="top"
                  data-bs-title="Copier l'URL GetCapabilities"
                  data-qgis-action="copy-url"
                  data-qgis-url="${escapeHtmlAttribute(capabilitiesUrl)}"
                >
                  <i class="ri-clipboard-line"></i>
                </button>
                <button
                  type="button"
                  class="btn btn-outline-info qgis-project-action-btn"
                  data-bs-toggle="tooltip"
                  data-bs-placement="top"
                  data-bs-title="Voir le GetCapabilities"
                  data-qgis-action="view-capabilities"
                  data-qgis-url="${escapeHtmlAttribute(capabilitiesUrl)}"
                >
                  <i class="ri-external-link-line"></i>
                </button>
                <button
                  type="button"
                  class="btn btn-outline-success qgis-project-action-btn"
                  data-bs-toggle="tooltip"
                  data-bs-placement="top"
                  data-bs-title="Créer une config mviewer"
                  data-qgis-action="create-config"
                  data-qgis-project-name="${escapeHtmlAttribute(projectName)}"
                >
                  <i class="ri-add-line"></i>
                </button>
                <button
                  type="button"
                  class="btn btn-outline-danger qgis-project-action-btn"
                  data-bs-toggle="tooltip"
                  data-bs-placement="top"
                  data-bs-title="Supprimer ce projet QGIS"
                  data-qgis-action="delete-project"
                  data-qgis-project-name="${escapeHtmlAttribute(projectName)}"
                >
                  <i class="ri-delete-bin-line"></i>
                </button>
              </div>
            </td>
          </tr>
        `;
      })
      .join("");

    if (typeof window._initTooltip === "function") {
      window._initTooltip(false);
    }
  },
  /**
   * Copies a QGIS project GetCapabilities URL to the clipboard.
   *
   * @param {string} url GetCapabilities URL to copy.
   * @returns {Promise<void>} Promise resolved when the URL has been copied.
   */
  copyQgisProjectUrl: function (url) {
    if (!url) {
      return Promise.reject(new Error("Missing QGIS project URL"));
    }

    return navigator.clipboard
      .writeText(url)
      .then(() => {
        window.alertCustom("URL copiée dans le presse-papiers", "success");
      })
      .catch(() => {
        window.alertCustom("Impossible de copier l'URL", "danger");
      });
  },
  /**
   * Opens a GetCapabilities URL in a separate browser tab.
   *
   * @param {string} url GetCapabilities URL to open.
   * @returns {void}
   */
  viewStoredQgisProjectCapabilities: function (url) {
    if (!url) {
      window.alertCustom("URL QGIS manquante", "danger");
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  },
  /**
   * Creates a Studio config from a stored QGIS project and opens it in a new tab.
   *
   * @param {string} projectName Stored QGIS project name.
   * @returns {Promise<void>} Promise resolved when the config has been created.
   */
  createStoredQgisProjectConfig: function (projectName) {
    if (!projectName) {
      return Promise.reject(new Error("Missing QGIS project name"));
    }

    return fetch(`api/app/qgis/projects/${encodeURIComponent(projectName)}/open`, {
      method: "POST",
    })
      .then((response) =>
        response.ok
          ? response.json()
          : response.text().then((text) => Promise.reject(text || response.statusText))
      )
      .then((data) => {
        if (data?.studioUrl) {
          window.open(data.studioUrl, "_blank", "noopener,noreferrer");
        }
        window.alertCustom("Configuration créée", "success");
      })
      .catch((error) => {
        window.alertCustom(error || "La création de la configuration a échoué", "danger");
        return Promise.reject(error);
      });
  },
  /**
   * Deletes a stored QGIS project then refreshes the server-side table.
   *
   * @param {string} projectName Stored QGIS project name.
   * @returns {Promise<void>} Promise resolved when the project has been deleted.
   */
  deleteStoredQgisProject: function (projectName) {
    if (!projectName) {
      return Promise.reject(new Error("Missing QGIS project name"));
    }
    if (!window.confirm(`Supprimer le projet QGIS "${projectName}" ?`)) {
      return Promise.resolve();
    }

    return fetch(`api/app/qgis/projects/${encodeURIComponent(projectName)}`, {
      method: "DELETE",
    })
      .then((response) =>
        response.ok
          ? response.json()
          : response.text().then((text) => Promise.reject(text || response.statusText))
      )
      .then(() => {
        window.alertCustom("Projet QGIS supprimé", "success");
        return this.refreshStoredQgisProjectsTable();
      })
      .catch((error) => {
        window.alertCustom(error || "La suppression du projet QGIS a échoué", "danger");
        return Promise.reject(error);
      });
  },
  /**
   * Fetches and refreshes the QGIS projects table.
   *
   * @returns {Promise<void>} Promise resolved when the table is up to date.
   */
  refreshStoredQgisProjectsTable: function () {
    const tableBody = document.getElementById("qgis-projects-table-body");
    if (tableBody) {
      tableBody.innerHTML =
        '<tr><td colspan="2" class="text-muted">Chargement…</td></tr>';
    }

    return this.fetchStoredQgisProjects()
      .then((projects) => {
        this.renderStoredQgisProjectsTable(projects);
      })
      .catch((error) => {
        if (tableBody) {
          tableBody.innerHTML =
            '<tr><td colspan="2" class="text-danger">Impossible de charger les configurations QGIS.</td></tr>';
        }
        return Promise.reject(error);
      });
  },
  /**
   * Opens a native file picker for selecting and uploading a QGIS project file.
   *
   * @returns {void}
   */
  openQgsProjectPicker: function () {
    const input = document.createElement("input");
    input.type = "file";
    input.accept =
      ".qgs,.qgis,.zip,.qgz,text/xml,application/x-qgis-project,application/zip,application/x-zip-compressed";
    input.addEventListener("change", () => {
      const file = input.files && input.files[0];
      if (file) {
        this.sendQgisProject(file);
      }
    });
    input.click();
  },
  /**
   * Extracts the QGIS project name from a `.qgs` XML content.
   *
   * @param {string} content Raw `.qgs` file content.
   * @returns {string} The project name or `"Untitled"` when missing.
   */
  readQgsFileName: function (content) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(content, "text/xml");
    const qgisElement = xmlDoc.getElementsByTagName("qgis")[0];
    return qgisElement
      ? qgisElement.getAttribute("projectname") || "Untitled"
      : "Untitled";
  },
  /**
   * Calls QGIS Server for a project name and returns the project settings XML.
   *
   * @param {string} projectName QGIS project name passed as `MAP`.
   * @returns {Promise<Document>} Parsed XML document returned by QGIS Server.
   */
  callQgisServerProjectFromName: function (projectName) {
    return this.callQgisServerProjectFromNameWithUrl(
      projectName,
      window._conf.qgis_server_url ||
        window._conf.qgis_server ||
        window._conf.qgis_server_base_url ||
        window._conf.data_providers?.wms?.[0]?.url
    );
  },
  /**
   * Calls a QGIS Server URL for a project name and returns the project settings XML.
   *
   * @param {string} projectName QGIS project name passed as `MAP`.
   * @param {string} [qgisServerUrl] QGIS Server URL to query.
   * @returns {Promise<Document>} Parsed XML document returned by QGIS Server.
   */
  callQgisServerProjectFromNameWithUrl: function (projectName, qgisServerUrl) {
    const serverUrl =
      qgisServerUrl ||
      window._conf.qgis_server_url ||
      window._conf.qgis_server ||
      window._conf.qgis_server_base_url ||
      window._conf.data_providers?.wms?.[0]?.url;

    if (!projectName || !serverUrl) {
      return Promise.reject(new Error("Missing QGIS project name or server URL"));
    }

    const requestUrl = new URL(serverUrl, window.location.href);
    requestUrl.searchParams.set("SERVICE", "WMS");
    requestUrl.searchParams.set("VERSION", "1.3.0");
    requestUrl.searchParams.set("REQUEST", "GetProjectSettings");
    requestUrl.searchParams.set("MAP", projectName);

    const fetchUrl =
      window._conf.proxy && /^https?:\/\//.test(requestUrl.href)
        ? `${window._conf.proxy}${encodeURIComponent(requestUrl.href)}`
        : requestUrl.href;

    return fetch(fetchUrl, {
      method: "GET",
      cache: "no-cache",
    })
      .then((response) => (response.ok ? response.text() : Promise.reject(response)))
      .then((xmlAsString) =>
        new window.DOMParser().parseFromString(xmlAsString, "text/xml")
      );
  },
  /**
   * Returns QGIS Server capabilities for a project file name.
   *
   * @param {string} fileName QGIS project file name.
   * @returns {Promise<Document>} Parsed GetCapabilities XML document.
   */
  getQgisServerProjectCapabilitiesFromFileName: function (fileName) {
    return this.getQgisServerProjectCapabilities(fileName);
  },
  /**
   * Returns QGIS Server capabilities from a complete project URL.
   *
   * @param {string} projectUrl QGIS Server project URL.
   * @returns {Promise<Document>} Parsed GetCapabilities XML document.
   */
  getQgisServerProjectCapabilitiesFromProjectUrl: function (projectUrl) {
    if (!projectUrl) {
      return Promise.reject(new Error("Missing QGIS project URL"));
    }

    const requestUrl = new URL(projectUrl, window.location.href);
    requestUrl.searchParams.set("SERVICE", "WMS");
    requestUrl.searchParams.set("VERSION", "1.3.0");
    requestUrl.searchParams.set("REQUEST", "GetCapabilities");

    const fetchUrl =
      window._conf.proxy && /^https?:\/\//.test(requestUrl.href)
        ? `${window._conf.proxy}${encodeURIComponent(requestUrl.href)}`
        : requestUrl.href;

    return fetch(fetchUrl, {
      method: "GET",
      cache: "no-cache",
    })
      .then((response) => (response.ok ? response.text() : Promise.reject(response)))
      .then((xmlAsString) =>
        new window.DOMParser().parseFromString(xmlAsString, "text/xml")
      );
  },
  /**
   * Returns QGIS Server capabilities for a project file name and server URL.
   *
   * @param {string} fileName QGIS project file name.
   * @param {string} [qgisServerUrl] QGIS Server URL to query.
   * @returns {Promise<Document>} Parsed GetCapabilities XML document.
   */
  getQgisServerProjectCapabilities: function (fileName, qgisServerUrl) {
    const serverUrl =
      qgisServerUrl ||
      window._conf.qgis_server_url ||
      window._conf.qgis_server ||
      window._conf.qgis_server_base_url ||
      window._conf.data_providers?.wms?.[0]?.url;

    if (!fileName || !serverUrl) {
      return Promise.reject(new Error("Missing QGIS project name or server URL"));
    }

    const projectName = fileName.replace(/\.[^.]+$/, "");
    const requestUrl = new URL(serverUrl, window.location.href);
    const normalizedPath = requestUrl.pathname.replace(/\/+$/, "");
    const pathSegments = normalizedPath.split("/").filter(Boolean);
    const lastSegment = decodeURIComponent(pathSegments[pathSegments.length - 1] || "");
    const shouldAppendProjectToPath =
      !requestUrl.searchParams.has("MAP") && lastSegment !== projectName;

    if (shouldAppendProjectToPath) {
      requestUrl.pathname = `${normalizedPath}/${encodeURIComponent(projectName)}`;
    } else {
      requestUrl.searchParams.set("MAP", projectName);
    }

    requestUrl.searchParams.set("SERVICE", "WMS");
    requestUrl.searchParams.set("VERSION", "1.3.0");
    requestUrl.searchParams.set("REQUEST", "GetCapabilities");

    const fetchUrl =
      window._conf.proxy && /^https?:\/\//.test(requestUrl.href)
        ? `${window._conf.proxy}${encodeURIComponent(requestUrl.href)}`
        : requestUrl.href;

    return fetch(fetchUrl, {
      method: "GET",
      cache: "no-cache",
    })
      .then((response) => (response.ok ? response.text() : Promise.reject(response)))
      .then((xmlAsString) =>
        new window.DOMParser().parseFromString(xmlAsString, "text/xml")
      );
  },
  /**
   * Searches layer names and titles in a QGIS Server project.
   *
   * @param {string} projectUrl QGIS Server project URL.
   * @returns {Promise<Array<{name: string, title: string}>>} Unique layers found in capabilities.
   */
  searchLayersInQgisServerProject: function (projectUrl) {
    return this.getQgisServerProjectCapabilitiesFromProjectUrl(projectUrl).then(
      (xmlDoc) => {
        const layerNames = [];
        const seenLayerNames = new Set();
        const layers = xmlDoc.getElementsByTagName("Layer");

        for (const layer of layers) {
          const nameNode = layer.getElementsByTagName("Name")[0];
          const titleNode = layer.getElementsByTagName("Title")[0];
          const layerName =
            nameNode && nameNode.textContent ? nameNode.textContent.trim() : "";
          const layerTitle =
            titleNode && titleNode.textContent ? titleNode.textContent.trim() : "";

          if (layerName && !seenLayerNames.has(layerName)) {
            seenLayerNames.add(layerName);
            layerNames.push({
              name: layerName,
              title: layerTitle || layerName,
            });
          }
        }

        return layerNames;
      }
    );
  },
  /**
   * Searches layer titles in a QGIS Server project.
   *
   * @param {string} projectUrl QGIS Server project URL.
   * @returns {Promise<string[]>} Layer titles found in capabilities.
   */
  searchTitlesInQgisServerProject: function (projectUrl) {
    return this.searchLayersInQgisServerProject(projectUrl).then((layers) =>
      layers.map((layer) => layer.title)
    );
  },
  /**
   * Fills the QGIS project layer select input from a project URL.
   *
   * @param {string} projectUrl QGIS Server project URL.
   * @returns {Promise<Array<{name: string, title: string}>>} Layers added to the select input.
   */
  fillQgsProjectLayers: function (projectUrl) {
    const select = document.getElementById("qgs-project-list");
    const button = document.getElementById("qgs_search_layers_btn");
    if (!select) {
      return Promise.resolve([]);
    }

    select.innerHTML = '<option value="" selected>Choisir une couche</option>';
    if (button) {
      button.disabled = !projectUrl;
    }

    if (!projectUrl) {
      return Promise.resolve([]);
    }

    return this.searchLayersInQgisServerProject(projectUrl)
      .then((layers) => {
        for (const layer of layers) {
          const option = document.createElement("option");
          option.value = layer.name;
          option.textContent =
            layer.title && layer.title !== layer.name
              ? `${layer.title} (${layer.name})`
              : layer.name;
          option.dataset.layerName = layer.name;
          option.dataset.layerTitle = layer.title;
          select.appendChild(option);
        }

        return layers;
      })
      .catch(() => {
        select.innerHTML = '<option value="" selected>Choisir une couche</option>';
        return [];
      });
  },
  /**
   * Searches layers for the URL currently entered in the QGIS project input.
   *
   * @returns {Promise<Array<{name: string, title: string}>>} Layers added to the select input.
   */
  searchProjectLayers: function () {
    const urlInput = document.getElementById("newlayer-qgs-url");
    return this.fillQgsProjectLayers(urlInput ? urlInput.value.trim() : "");
  },
  /**
   * Clears the QGIS project URL and layer selection controls.
   *
   * @returns {void}
   */
  resetQgsProjectInputs: function () {
    const urlInput = document.getElementById("newlayer-qgs-url");
    const select = document.getElementById("qgs-project-list");
    const button = document.getElementById("qgs_search_layers_btn");

    if (urlInput) {
      urlInput.value = "";
      urlInput.classList.remove("is-invalid");
    }

    if (select) {
      select.innerHTML = '<option value="" selected>Choisir une couche</option>';
    }

    if (button) {
      button.disabled = true;
    }
  },
  /**
   * Activates the QGIS project tab and pane in the new layer UI.
   *
   * @returns {void}
   */
  showQgsProjectTab: function () {
    const qgsProjectTab = document.querySelector(
      '[data-bs-target="#newlayer-qgs"]'
    );
    const qgsProjectPane = document.getElementById("newlayer-qgs");

    if (qgsProjectTab) {
      const tabList = qgsProjectTab.closest('[role="tablist"]');
      if (tabList) {
        tabList.querySelectorAll('[role="tab"]').forEach((tab) => {
          tab.classList.remove("active");
          tab.setAttribute("aria-selected", "false");
        });
      }
      qgsProjectTab.classList.add("active");
      qgsProjectTab.setAttribute("aria-selected", "true");
    }

    if (qgsProjectPane) {
      const tabContent = qgsProjectPane.closest(".tab-content");
      if (tabContent) {
        tabContent.querySelectorAll(".tab-pane").forEach((pane) => {
          pane.classList.remove("active", "show");
        });
      }
      qgsProjectPane.classList.add("active", "show");
    }
  },
  /**
   * Resets layer search state and displays the QGIS project inputs.
   *
   * @returns {void}
   */
  showQgsProjectInputs: function () {
    if (typeof window.mv !== "undefined") {
      window.mv.resetSearch();
      window.mv.resetConfLayer();
    }

    this.showQgsProjectTab();
    this.initQgsProjectSearch();
  },
  /**
   * Registers QGIS project search UI listeners once and synchronizes button state.
   *
   * @returns {void}
   */
  initQgsProjectSearch: function () {
    const urlInput = document.getElementById("newlayer-qgs-url");
    const button = document.getElementById("qgs_search_layers_btn");
    const select = document.getElementById("qgs-project-list");
    if (!urlInput || !button) {
      return;
    }

    const syncButtonState = () => {
      button.disabled = !urlInput.value.trim();
    };

    if (this._qgsProjectSearchInitialized) {
      syncButtonState();
      return;
    }

    urlInput.addEventListener("input", syncButtonState);
    urlInput.addEventListener("change", syncButtonState);
    urlInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !button.disabled) {
        event.preventDefault();
        this.searchProjectLayers();
      }
    });
    button.addEventListener("click", (event) => {
      event.preventDefault();
      if (!button.disabled) {
        this.searchProjectLayers();
      }
    });
    if (select) {
      select.addEventListener("change", (event) => {
        selectQgsLayer(event.currentTarget);
      });
    }

    syncButtonState();
    this._qgsProjectSearchInitialized = true;
  },
  /**
   * Registers the import-by-URL UI listeners and keeps the action button state in sync.
   *
   * @returns {void}
   */
  initQgisAppImport: function () {
    const urlInput = document.getElementById("getQgisApp");
    const button = document.getElementById("createConfigFromQgisAppUrl");

    if (!urlInput || !button) {
      return;
    }

    const syncButtonState = () => {
      const hasValue = Boolean(urlInput.value.trim());
      button.disabled = !hasValue;
      urlInput.classList.toggle("is-invalid", !hasValue && document.activeElement !== urlInput);
    };

    if (this._qgisImportUrlInitialized) {
      syncButtonState();
      return;
    }

    button.addEventListener("click", (event) => {
      event.preventDefault();
      this.createConfigFromQgisAppUrl();
    });

    urlInput.addEventListener("input", () => {
      urlInput.classList.remove("is-invalid");
      syncButtonState();
    });

    urlInput.addEventListener("change", () => {
      urlInput.classList.remove("is-invalid");
      syncButtonState();
    });

    urlInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !button.disabled) {
        event.preventDefault();
        this.createConfigFromQgisAppUrl();
      }
    });

    syncButtonState();
    this._qgisImportUrlInitialized = true;
  },
  /**
   * Registers the local QGIS file upload listener in the import modal.
   *
   * @returns {void}
   */
  initQgisLocalFileImport: function () {
    const input = document.getElementById("qgis-filebutton");
    const nameInput = document.getElementById("qgis-local-file-name");

    if (!input || !nameInput) {
      return;
    }

    if (this._qgisLocalFileImportInitialized) {
      return;
    }

    input.addEventListener("change", () => {
      const file = input.files && input.files[0];
      if (!file) {
        return;
      }

      nameInput.value = file.name;
      this.importQgisServerProjectFile(file).catch((error) => {
        const message =
          typeof error === "string"
            ? error
            : error?.message || "L'import du projet QGIS a échoué";
        window.alertCustom(message, "danger");
      });
    });

    this._qgisLocalFileImportInitialized = true;
  },
  /**
   * Registers listeners for the stored QGIS projects table and loads data once.
   *
   * @returns {void}
   */
  initStoredQgisProjectsList: function () {
    const container = document.getElementById("qgis-projects-list-container");
    const refreshButton = document.getElementById("refresh-qgis-projects-list");
    const loadQgisTab = document.querySelector('[data-bs-target="#loadQgis"]');
    const tableBody = document.getElementById("qgis-projects-table-body");

    if (!container || !refreshButton || !loadQgisTab || !tableBody) {
      return;
    }

    if (!this.isConfiguredQgisServerOnCurrentHost()) {
      container.classList.add("d-none");
      return;
    }

    container.classList.remove("d-none");

    if (this._qgisProjectsListInitialized) {
      this.refreshStoredQgisProjectsTable();
      return;
    }

    refreshButton.addEventListener("click", () => {
      this.refreshStoredQgisProjectsTable().catch(() => {});
    });

    loadQgisTab.addEventListener("shown.bs.tab", () => {
      this.refreshStoredQgisProjectsTable().catch(() => {});
    });
    tableBody.addEventListener("click", (event) => {
      const actionButton = event.target.closest("[data-qgis-action]");
      if (!actionButton) {
        return;
      }

      const action = actionButton.dataset.qgisAction;
      const url = actionButton.dataset.qgisUrl;
      const projectName = actionButton.dataset.qgisProjectName;

      if (action === "copy-url") {
        this.copyQgisProjectUrl(url);
        return;
      }
      if (action === "view-capabilities") {
        this.viewStoredQgisProjectCapabilities(url);
        return;
      }
      if (action === "create-config") {
        this.createStoredQgisProjectConfig(projectName).catch(() => {});
        return;
      }
      if (action === "delete-project") {
        this.deleteStoredQgisProject(projectName).catch(() => {});
      }
    });

    this.refreshStoredQgisProjectsTable().catch(() => {});
    this._qgisProjectsListInitialized = true;
  },
};

/**
 * Copies the selected QGIS layer name and title into the new layer form.
 *
 * @param {HTMLSelectElement} selectElement Layer select input.
 * @returns {void}
 */
const selectQgsLayer = function (selectElement) {
  const selectedOption = selectElement.options[selectElement.selectedIndex];
  const layerName = selectedOption ? selectedOption.dataset.layerName || "" : "";
  const layerTitle = selectedOption ? selectedOption.dataset.layerTitle || "" : "";
  const idInput = document.getElementById("newlayer-id");
  const nameInput = document.getElementById("newlayer-name");

  if (idInput && layerName) {
    idInput.value = layerName;
  }

  if (nameInput) {
    nameInput.value = layerTitle || layerName;
  }
};

document.addEventListener("DOMContentLoaded", function () {
  const sendQgisProjectLink = document.getElementById("sendQgisProject");
  if (sendQgisProjectLink) {
    sendQgisProjectLink.onclick = function (event) {
      event.preventDefault();
      qgis.openQgsProjectPicker();
    };
  }
  qgis.initQgsProjectSearch();
  qgis.initQgisAppImport();
  qgis.initQgisLocalFileImport();

  const qgsProjectTab = document.querySelector('a[data-bs-target="#newlayer-qgs"]');
  if (qgsProjectTab) {
    qgsProjectTab.addEventListener("shown.bs.tab", function () {
      qgis.showQgsProjectInputs();
    });
  }
});

document.addEventListener("mviewerstudio:qgis:init-stored-projects", function () {
  qgis.initStoredQgisProjectsList();
});

document.addEventListener(
  "mviewerstudio:qgis:load-application-parameters-from-file-input",
  function (event) {
    event.preventDefault();
    qgis.loadApplicationParametersFromFileInput();
  }
);

export { selectQgsLayer };
export default qgis;
