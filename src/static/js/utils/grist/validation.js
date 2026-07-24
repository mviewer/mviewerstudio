const SELECT_LAYERS_BUTTON_ID = "selectLayersButton";
const GRIST_TAB_TARGET = "#newlayer-grist";

const getSelectLayersButton = () =>
  document.getElementById(SELECT_LAYERS_BUTTON_ID);

const getParsedRows = (verification) => {
  const rows = verification?.parsedData?.data;
  return Array.isArray(rows) ? rows : [];
};

const setSelectLayersButtonDisabled = (disabled) => {
  const button = getSelectLayersButton();

  if (button) {
    button.disabled = Boolean(disabled);
  }
};

const enableSelectLayersButton = () => {
  setSelectLayersButtonDisabled(false);
};

const disableSelectLayersButton = () => {
  setSelectLayersButtonDisabled(true);
};

const hasImportedFileTable = (verification) =>
  Boolean(verification?.valid && getParsedRows(verification).length);

const updateSelectLayersButtonForImportedFile = (verification) => {
  setSelectLayersButtonDisabled(!hasImportedFileTable(verification));
};

const isGristTab = (target) =>
  target?.getAttribute("data-bs-target") === GRIST_TAB_TARGET;

const bindNewLayerModalValidation = (
  modal = document.getElementById("mod-layerNew")
) => {
  if (!modal || modal.dataset.gristValidationBound === "true") {
    return;
  }

  modal.dataset.gristValidationBound = "true";

  modal.addEventListener("click", (event) => {
    const tab = event.target.closest('[data-bs-toggle="pill"]');
    const closeButton = event.target.closest(".close, [i18n='close']");

    if (tab) {
      if (isGristTab(tab)) {
        disableSelectLayersButton();
        return;
      }

      enableSelectLayersButton();
    }

    if (closeButton) {
      enableSelectLayersButton();
    }
  });

  modal.addEventListener("show.bs.modal", () => {
    const activeTab = modal.querySelector('[data-bs-toggle="pill"].active');

    if (isGristTab(activeTab)) {
      disableSelectLayersButton();
      return;
    }

    enableSelectLayersButton();
  });

  modal.addEventListener("hidden.bs.modal", enableSelectLayersButton);
};

export {
  bindNewLayerModalValidation,
  disableSelectLayersButton,
  enableSelectLayersButton,
  hasImportedFileTable,
  setSelectLayersButtonDisabled,
  updateSelectLayersButtonForImportedFile,
};

export default {
  bindNewLayerModalValidation,
  disableSelectLayersButton,
  enableSelectLayersButton,
  hasImportedFileTable,
  setSelectLayersButtonDisabled,
  updateSelectLayersButtonForImportedFile,
};
