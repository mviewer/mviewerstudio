// QGIS project import utilities
var qgis = {
  _qgsProjectSearchInitialized: false,
  /**
   * Imports a QGIS project file content.
   *
   * @param {string} content Raw `.qgs` file content.
   * @returns {void}
   */
  importQgs: function (content) {
    console.log("Importing QGS file:", content);
    // Placeholder: parse QGS and convert to XML or call mv.parseApplication
    // For now, assume it returns an XML string or object
    // TODO: Implement actual QGS parsing
    alert("QGS import not yet implemented");
  },
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
  openQgsProjectPicker: function () {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".qgs,application/x-qgis-project,text/xml";
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
  getQgisServerProjectCapabilitiesFromFileName: function (fileName) {
    return this.getQgisServerProjectCapabilities(fileName);
  },
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
  searchTitlesInQgisServerProject: function (projectUrl) {
    return this.searchLayersInQgisServerProject(projectUrl).then((layers) =>
      layers.map((layer) => layer.title)
    );
  },
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
  searchProjectLayers: function () {
    const urlInput = document.getElementById("newlayer-qgs-url");
    return this.fillQgsProjectLayers(urlInput ? urlInput.value.trim() : "");
  },
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
  showQgsProjectInputs: function () {
    if (typeof mv !== "undefined") {
      mv.resetSearch();
      mv.resetConfLayer();
    }

    this.showQgsProjectTab();
    this.initQgsProjectSearch();
  },
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
};

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

  const qgsProjectTab = document.querySelector('a[data-bs-target="#newlayer-qgs"]');
  if (qgsProjectTab) {
    qgsProjectTab.addEventListener("shown.bs.tab", function () {
      qgis.showQgsProjectInputs();
    });
  }
});
