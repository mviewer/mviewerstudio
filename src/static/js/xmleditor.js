(function () {
  const editorSelector = "xml-editor-textarea";
  const lineNumbersSelector = "xml-editor-line-numbers";
  const saveButtonSelector = "validXmlEditorFooterBtn";

  /**
   * Get the current XML configuration as a string.
   * @returns {string} XML content or an empty string when unavailable.
   */
  const getEditorValue = () => {
    if (typeof getConfig !== "function") {
      return "";
    }

    try {
      const xml = getConfig();
      return Array.isArray(xml) ? xml.join("") : xml || "";
    } catch (error) {
      return "";
    }
  };

  /**
   * Read the Dublin Core identifier from an XML document.
   * @param {XMLDocument} xml Parsed XML document.
   * @returns {string} Trimmed identifier value or an empty string.
   */
  const getXmlIdentifier = (xml) => {
    const identifier =
      xml.getElementsByTagName("dc:identifier")[0] ||
      xml.getElementsByTagNameNS("*", "identifier")[0];

    return identifier?.textContent?.trim() || "";
  };

  /**
   * Parse an XML string without throwing on invalid content.
   * @param {string} xmlValue XML content to parse.
   * @returns {XMLDocument|null} Parsed XML document or null on parser error.
   */
  const parseXml = (xmlValue) => {
    try {
      return $.parseXML(xmlValue);
    } catch (error) {
      return null;
    }
  };

  /**
   * Check whether an application already exists on the API.
   * @param {string} id Application identifier.
   * @returns {Promise<Object>} API response describing the existing state.
   */
  const appExists = (id) =>
    fetch(`${_conf.api}/${id}/exists`).then((response) =>
      response.ok ? response.json() : Promise.reject(response)
    );

  /**
   * Build the public URL used to reload a saved XML configuration.
   * @param {string} filepath Path returned by the API.
   * @returns {string} Absolute configuration URL.
   */
  const buildConfigUrl = (filepath) =>
    `${_conf.mviewer_instance}${_conf.conf_path_from_mviewer}${filepath}`;

  /**
   * Fetch the saved XML configuration, falling back to the current parsed XML.
   * @param {string} filepath Saved configuration path.
   * @param {XMLDocument} fallbackXml XML document used when the fetch fails.
   * @returns {Promise<XMLDocument>} Saved or fallback XML document.
   */
  const fetchSavedXml = (filepath, fallbackXml) => {
    if (!filepath) {
      return Promise.resolve(fallbackXml);
    }

    return fetch(buildConfigUrl(filepath), {
      method: "GET",
      cache: "no-cache",
    })
      .then((response) => (response.ok ? response.text() : Promise.reject(response)))
      .then((xmlAsString) =>
        new window.DOMParser().parseFromString(xmlAsString, "text/xml")
      )
      .catch(() => fallbackXml);
  };

  /**
   * Retrieve metadata for an application from the API.
   * @param {string} appId Application identifier.
   * @returns {Promise<Object|null>} Matching application metadata or null.
   */
  const fetchAppMetadata = (appId) =>
    fetch(_conf.api)
      .then((response) => (response.ok ? response.json() : Promise.reject(response)))
      .then((apps) => apps.find((app) => app.id === appId))
      .catch(() => null);

  /**
   * Destroy existing sortable instances before rebuilding the studio view.
   * @returns {void}
   */
  const resetSortableInstances = () => {
    if (!mv.sortableInstances) {
      return;
    }

    mv.sortableInstances.forEach((sortable) => sortable.destroy());
    mv.sortableInstances = [];
  };

  /**
   * Reload the studio configuration from an XML document.
   * @param {XMLDocument} xml XML configuration to load.
   * @param {Object|null} appMeta Optional application metadata returned by the API.
   * @returns {void}
   */
  const reloadConfiguration = (xml, appMeta) => {
    const switchAdvanced = document.getElementById("SwitchAdvanced");
    const wizardActiveItem = document.getElementById("stepStudio").querySelector(".active");
    resetSortableInstances();
    mv.parseApplication(xml, true);

    if (appMeta?.versions) {
      config.versions = appMeta.versions;
    }

    showStudio();
    document.querySelector("#toolsbarStudio-delete").classList.remove("d-none");
    document.querySelector("#layerOptionBtn").classList.remove("d-none");

    // after reload, re-activate wizard step and advanced options
    switchAdvanced.checked = true;
    switchAdvanced.dispatchEvent(new Event("change"));
    wizardActiveItem.dispatchEvent(new Event("click"));
  };

  /**
   * Validate and save the XML editor content, then refresh the studio view.
   * @param {HTMLTextAreaElement} editor XML editor textarea.
   * @param {HTMLElement} lineNumbers Line number container.
   * @param {HTMLButtonElement} saveButton Save button element.
   * @returns {void}
   */
  const saveXml = (editor, lineNumbers, saveButton) => {
    const xmlValue = editor.value.trim();
    const parsedXml = parseXml(xmlValue);
    const xmlId = parsedXml ? getXmlIdentifier(parsedXml) : "";

    if (!xmlValue || !parsedXml || !xmlId) {
      alertCustom(mviewer.tr("msg.xml_doc_invalid"), "danger");
      return;
    }

    saveButton.disabled = true;

    appExists(xmlId)
      .then((state) =>
        fetch(_conf.api, {
          method: state.exists ? "PUT" : "POST",
          headers: {
            "Content-Type": "text/xml",
          },
          body: xmlValue,
        }).then((response) =>
          response.ok
            ? response.json().then((data) => ({ data, exists: state.exists }))
            : Promise.reject(response)
        )
      )
      .then(({ data, exists }) => {
        if (data.diff || !exists) {
          alertCustom(mviewer.tr("msg.file_saved_on_server"), "info");
        } else {
          alertCustom(mviewer.tr("msg.file_same_not_saved"), "success");
        }

        const appId = data.config?.id || xmlId;
        return Promise.all([
          fetchSavedXml(data.filepath, parsedXml),
          fetchAppMetadata(appId),
        ]);
      })
      .then(([savedXml, appMeta]) => {
        reloadConfiguration(savedXml, appMeta);
        editor.value = getEditorValue();
        updateLineNumbers(editor, lineNumbers);
        $("#mod-xmleditor").modal("hide");
      })
      .catch(() => alertCustom(mviewer.tr("msg.xml_save"), "danger"))
      .finally(() => {
        saveButton.disabled = false;
      });
  };

  /**
   * Refresh line numbers according to the current editor content.
   * @param {HTMLTextAreaElement} editor XML editor textarea.
   * @param {HTMLElement} lineNumbers Line number container.
   * @returns {void}
   */
  const updateLineNumbers = (editor, lineNumbers) => {
    const lineCount = Math.max(editor.value.split("\n").length, 1);
    lineNumbers.textContent = Array.from(
      { length: lineCount },
      (_, index) => index + 1
    ).join("\n");
  };

  /**
   * Keep the line number gutter aligned with the editor scroll position.
   * @param {HTMLTextAreaElement} editor XML editor textarea.
   * @param {HTMLElement} lineNumbers Line number container.
   * @returns {void}
   */
  const syncLineNumbersScroll = (editor, lineNumbers) => {
    lineNumbers.scrollTop = editor.scrollTop;
  };

  /**
   * Insert two spaces when the user presses Tab inside the editor.
   * @param {KeyboardEvent} event Keyboard event emitted by the textarea.
   * @param {HTMLTextAreaElement} editor XML editor textarea.
   * @param {HTMLElement} lineNumbers Line number container.
   * @returns {void}
   */
  const insertIndentation = (event, editor, lineNumbers) => {
    if (event.key !== "Tab") {
      return;
    }

    event.preventDefault();

    const indentation = "  ";
    const start = editor.selectionStart;
    const end = editor.selectionEnd;

    editor.value = `${editor.value.substring(0, start)}${indentation}${editor.value.substring(end)}`;
    editor.selectionStart = start + indentation.length;
    editor.selectionEnd = start + indentation.length;
    updateLineNumbers(editor, lineNumbers);
  };

  /**
   * Initialize XML editor DOM bindings and optionally populate its content.
   * @param {boolean} [populateEditor=false] Whether to reload the editor content.
   * @returns {void}
   */
  const initXmlEditor = (populateEditor = false) => {
    const editor = document.getElementById(editorSelector);
    const lineNumbers = document.getElementById(lineNumbersSelector);
    const saveButton = document.getElementById(saveButtonSelector);

    if (!editor || !lineNumbers) {
      return;
    }

    if (!editor.dataset.xmlEditorReady) {
      editor.addEventListener("input", () => updateLineNumbers(editor, lineNumbers));
      editor.addEventListener("scroll", () => syncLineNumbersScroll(editor, lineNumbers));
      editor.addEventListener("keydown", (event) =>
        insertIndentation(event, editor, lineNumbers)
      );
      editor.dataset.xmlEditorReady = "true";
    }

    if (saveButton && !saveButton.dataset.xmlEditorReady) {
      saveButton.addEventListener("click", () =>
        saveXml(editor, lineNumbers, saveButton)
      );
      saveButton.dataset.xmlEditorReady = "true";
    }

    if (populateEditor) {
      editor.value = getEditorValue();
    }

    updateLineNumbers(editor, lineNumbers);
    syncLineNumbersScroll(editor, lineNumbers);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => initXmlEditor());
  } else {
    initXmlEditor();
  }

  document
    .getElementById("mod-xmleditor")
    ?.addEventListener("shown.bs.modal", () => initXmlEditor(true));
})();
