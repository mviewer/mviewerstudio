// QGIS project import utilities
var qgis = {
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
   * Imports a QGIS project file content.
   *
   * @param {string} content Raw `.qgs` file content.
   * @returns {string|undefined} Generated mviewer XML, or `undefined` when the converter is unavailable.
   */
  importQgs: function (content) {
    if (typeof qgisToMviewer === "undefined") {
      alertCustom("QGIS to mviewer converter is not loaded", "danger");
      return;
    }

    const mviewerXml = qgisToMviewer.convertQgsContentToMviewerXml(content);
    if (typeof mv !== "undefined" && typeof mv.parseApplication === "function") {
      const xmlDoc = new DOMParser().parseFromString(mviewerXml, "text/xml");
      mv.parseApplication(xmlDoc);
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
      mv.parseApplication(xml);
      return;
    }

    mv.appExists(idApp, (response) => mv.parseApplication(xml, response.exists));
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
      (typeof qgisToMviewer !== "undefined" &&
        qgisToMviewer.isQgisProjectDocument(xml))
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
        const xml = $.parseXML(content);
        if (this.isQgisProjectFile(file, xml)) {
          if (typeof qgisToMviewer === "undefined") {
            throw new Error("QGIS to mviewer converter is not loaded");
          }
          return $.parseXML(qgisToMviewer.convertQgsContentToMviewerXml(content));
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
        showStudio();
      })
      .catch((error) => {
        if (error?.message === "QGIS to mviewer converter is not loaded") {
          alertCustom(error.message, "danger");
          return;
        }
        alertCustom(mviewer.tr("msg.xml_doc_invalid"), "danger");
      });
  },
  /**
   * Returns the configured base URL of QGIS Server used to expose published projects.
   *
   * @returns {string} Base URL ending with a slash when configured.
   */
  getConfiguredQgisProjectsBaseUrl: function () {
    const configuredUrl = _conf?.qgis?.url || "";
    return configuredUrl ? configuredUrl.replace(/\/?$/, "/") : "";
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
        this.parseMviewerApplicationXml($.parseXML(mviewerXml));
        showStudio();
      })
      .catch((error) => {
        const message =
          typeof error === "string"
            ? error
            : error?.message || "La conversion du projet QGIS a échoué";
        alertCustom(message, "danger");
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
        this.parseMviewerApplicationXml($.parseXML(mviewerXml));
        showStudio();
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
        alertCustom(`${data.fileName} uploaded`, "success");
        return data;
      })
      .catch((error) => {
        alertCustom(error || "QGS upload failed", "danger");
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
      _conf.qgis_server_url ||
        _conf.qgis_server ||
        _conf.qgis_server_base_url ||
        _conf.data_providers?.wms?.[0]?.url
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
      _conf.qgis_server_url ||
      _conf.qgis_server ||
      _conf.qgis_server_base_url ||
      _conf.data_providers?.wms?.[0]?.url;

    if (!projectName || !serverUrl) {
      return Promise.reject(new Error("Missing QGIS project name or server URL"));
    }

    const requestUrl = new URL(serverUrl, window.location.href);
    requestUrl.searchParams.set("SERVICE", "WMS");
    requestUrl.searchParams.set("VERSION", "1.3.0");
    requestUrl.searchParams.set("REQUEST", "GetProjectSettings");
    requestUrl.searchParams.set("MAP", projectName);

    const fetchUrl =
      _conf.proxy && /^https?:\/\//.test(requestUrl.href)
        ? `${_conf.proxy}${encodeURIComponent(requestUrl.href)}`
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
      _conf.proxy && /^https?:\/\//.test(requestUrl.href)
        ? `${_conf.proxy}${encodeURIComponent(requestUrl.href)}`
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
      _conf.qgis_server_url ||
      _conf.qgis_server ||
      _conf.qgis_server_base_url ||
      _conf.data_providers?.wms?.[0]?.url;

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
      _conf.proxy && /^https?:\/\//.test(requestUrl.href)
        ? `${_conf.proxy}${encodeURIComponent(requestUrl.href)}`
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
    if (typeof mv !== "undefined") {
      mv.resetSearch();
      mv.resetConfLayer();
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
        alertCustom(message, "danger");
      });
    });

    this._qgisLocalFileImportInitialized = true;
  },
};

/**
 * Copies the selected QGIS layer name and title into the new layer form.
 *
 * @param {HTMLSelectElement} selectElement Layer select input.
 * @returns {void}
 */
function selectQgsLayer(selectElement) {
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
}

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
