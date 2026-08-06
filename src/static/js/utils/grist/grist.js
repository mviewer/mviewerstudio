import {
  getActiveGristLocationSwitchId,
  getGristAddressFields,
  renderGristLocationArea,
  setGristLocationFields,
  setGristLocationSwitches,
} from "./locationModeManagement.js";
import { runGristAddressGeocoding } from "./geocoding.js";
import {
  getGristWizardContentSteps,
  initGristWizard,
  setGristWizardStep,
} from "./wizard.js";
import { runGristRefGeoJoin } from "./refGeo.js";
import {
  GRIST_AUTH_CONTAINER_ID,
  GRIST_DATA_CONTAINER_ID,
  GRIST_LOCATION_SWITCH_IDS,
  GRIST_LOCATION_TARGET_IDS,
  GRIST_MODAL_ID,
  GRIST_TAB_TARGET,
  GRIST_WIZARD_BACK_BUTTON_ID,
  GRIST_WIZARD_NEXT_BUTTON_ID,
} from "./const.js";

let activeImportGristArea = null;

const getGristComponent = (componentName) => {
  if (!mv.components || !mv.components.grist) {
    return null;
  }

  return mv.components.grist[componentName];
};

const disableWizardButton = (buttonId) => {
  const button = document.getElementById(buttonId);

  if (button) {
    button.classList.add("d-none");
  }
};

const getCurrentWizardStep = () => {
  const nextButton = document.getElementById(GRIST_WIZARD_NEXT_BUTTON_ID);

  if (!nextButton) {
    return 1;
  }

  return nextButton.dataset.step || 1;
};

/**
 * Render the Grist localization mode switches.
 *
 * Only one switch can be active at a time. If the current active switch is
 * toggled off, it is immediately re-enabled to keep one selected mode.
 *
 * @returns {void}
 */
const initGristLocationSwitches = () => {
  let Switch = null;

  if (mv.components) {
    Switch = mv.components.switch;
  }
  if (!Switch) {
    return;
  }

  const switchConfigs = [
    {
      targetId: GRIST_LOCATION_TARGET_IDS.address,
      id: GRIST_LOCATION_SWITCH_IDS.address,
      label: "À partir d’une adresse",
      description: "Géocodez vos données (adresse, ville...)",
      checked: true,
    },
    {
      targetId: GRIST_LOCATION_TARGET_IDS.ref,
      id: GRIST_LOCATION_SWITCH_IDS.ref,
      label: "À partir d’un référentiel",
      description: "Associez vos données à un référentiel géographique",
      checked: false,
    },
    {
      targetId: GRIST_LOCATION_TARGET_IDS.xy,
      id: GRIST_LOCATION_SWITCH_IDS.xy,
      label: "À partir de coordonnées X/Y",
      description: "Utilisez des colonnes de coordonnées existantes",
      checked: false,
    },
  ];
  const switches = [];
  setGristLocationSwitches(switches);
  const selectOnly = (activeSwitch) => {
    if (!activeSwitch.getChecked()) {
      activeSwitch.setChecked(true);
    }

    switches.forEach((switchItem) => {
      switchItem.setChecked(switchItem === activeSwitch);
    });
    renderGristLocationArea(activeSwitch.id);
  };

  switchConfigs.forEach((config) => {
    const target = document.getElementById(config.targetId);
    if (!target) {
      return;
    }

    target.replaceChildren();
    const switchItem = new Switch({
      id: config.id,
      name: "grist-location-mode",
      label: config.label,
      description: config.description,
      checked: config.checked,
      onChange: (checked, currentSwitch) => {
        if (checked || switches.every((item) => !item.getChecked())) {
          selectOnly(currentSwitch);
        }
      },
    });
    switches.push(switchItem);
    target.appendChild(switchItem.render());
  });

  const activeSwitch = switches.find((switchItem) => switchItem.getChecked());
  if (activeSwitch) {
    renderGristLocationArea(activeSwitch.id);
  }
};

/**
 * Render the Grist data import area after API key validation.
 *
 * @param {string} apiKey Valid Grist API key used by import components.
 * @returns {void}
 */
const initGristImportArea = (apiKey) => {
  const gristDataContainer = document.getElementById(GRIST_DATA_CONTAINER_ID);
  const ImportGristArea = getGristComponent("importGristArea");

  if (!gristDataContainer || !ImportGristArea) {
    return;
  }

  gristDataContainer.replaceChildren();
  const importGristArea = new ImportGristArea({
    apiKey,
    onColumnsChange: setGristLocationFields,
  });
  activeImportGristArea = importGristArea;
  gristDataContainer.appendChild(importGristArea.render());
  mv.utils.grist.validation.disableGristWizardNextButton();
  const nextButton = document.getElementById(GRIST_WIZARD_NEXT_BUTTON_ID);
  if (nextButton) {
    nextButton.dataset.apiKeyReady = "true";
  }
  setGristWizardStep(1);
};

/**
 * Clear the Grist data import area and mark the API key step as not ready.
 *
 * @returns {void}
 */
const hideGristImportArea = () => {
  const gristDataContainer = document.getElementById(GRIST_DATA_CONTAINER_ID);

  if (!gristDataContainer) {
    return;
  }

  gristDataContainer.replaceChildren();
  activeImportGristArea = null;
  setGristLocationFields([]);
  const nextButton = document.getElementById(GRIST_WIZARD_NEXT_BUTTON_ID);
  if (nextButton) {
    nextButton.dataset.apiKeyReady = "false";
  }
  mv.utils.grist.validation.disableGristWizardNextButton();
  setGristWizardStep(1);
};

/**
 * Render the Grist API key form and wire validation callbacks.
 *
 * @param {Object} [config] Application configuration.
 * @param {Object} [config.grist] Grist configuration.
 * @param {string} [config.grist.api_url] Grist API endpoint.
 * @param {string} [config.grist.instance_url] Grist instance endpoint fallback.
 * @returns {void}
 */
const initGristApiKey = (config) => {
  const gristAuthContainer = document.getElementById(GRIST_AUTH_CONTAINER_ID);
  const GristApiKey = getGristComponent("gristApiKey");
  let gristConfig = {};

  if (config && config.grist) {
    gristConfig = config.grist;
  }

  if (!gristAuthContainer || !GristApiKey) {
    return;
  }

  gristAuthContainer.replaceChildren();
  const gristApiKey = new GristApiKey(
    gristConfig.api_url || gristConfig.instance_url,
    "https://grist.numerique.gouv.fr/account/developer",
    {
      onValidApiKey: initGristImportArea,
      onInvalidApiKey: hideGristImportArea,
    }
  );
  gristAuthContainer.appendChild(gristApiKey.render());
};

/**
 * Initialize all Grist-specific content inside the "new layer" modal.
 *
 * @param {Object} [config] Application configuration used by the API key form.
 * @returns {void}
 */
const initGristNewLayerModal = (config) => {
  initGristWizard();
  setGristLocationFields([]);
  initGristLocationSwitches();
  hideGristImportArea();
  initGristApiKey(config);
};

/**
 * Bind Grist-specific modal events once.
 *
 * Handles modal initialization, tab visibility, and wizard navigation for the
 * Grist import tab.
 *
 * @param {HTMLElement|null} [modal=document.getElementById(GRIST_MODAL_ID)]
 * Modal element that contains the Grist tab.
 * @param {Function} [getConfig] Function returning the current app config.
 * @returns {void}
 */
const bindNewLayerModalGrist = (
  modal = document.getElementById(GRIST_MODAL_ID),
  getConfig = () => {
    if (window._conf) {
      return window._conf;
    }

    if (typeof _conf !== "undefined") {
      return _conf;
    }

    return undefined;
  }
) => {
  if (!modal || modal.dataset.gristBound === "true") {
    return;
  }

  modal.dataset.gristBound = "true";

  modal.addEventListener("show.bs.modal", () => {
    initGristNewLayerModal(getConfig());
  });

  modal.addEventListener("click", (event) => {
    const tab = event.target.closest('[data-bs-toggle="pill"]');
    const backButton = event.target.closest(`#${GRIST_WIZARD_BACK_BUTTON_ID}`);
    const nextButton = event.target.closest(`#${GRIST_WIZARD_NEXT_BUTTON_ID}`);

    if (tab) {
      if (tab.getAttribute("data-bs-target") !== GRIST_TAB_TARGET) {
        disableWizardButton(GRIST_WIZARD_BACK_BUTTON_ID);
        disableWizardButton(GRIST_WIZARD_NEXT_BUTTON_ID);
        return;
      }

      setGristWizardStep(getCurrentWizardStep());
    }

    if (backButton) {
      let previousStep = backButton.dataset.step || 1;
      previousStep--;
      setGristWizardStep(previousStep);
    }

    if (nextButton) {
      let currentStep = nextButton.dataset.step || 1;
      if (
        currentStep === "3" &&
        getActiveGristLocationSwitchId() === GRIST_LOCATION_SWITCH_IDS.address
      ) {
        runGristAddressGeocoding({
          importGristArea: activeImportGristArea,
          getAddressFields: getGristAddressFields,
          setWizardStep: setGristWizardStep,
          triggerButton: nextButton,
        });
        return;
      }

      if (
        currentStep === "3" &&
        getActiveGristLocationSwitchId() === GRIST_LOCATION_SWITCH_IDS.ref
      ) {
        runGristRefGeoJoin({
          importGristArea: activeImportGristArea,
          setWizardStep: setGristWizardStep,
          triggerButton: nextButton,
        });
        return;
      }

      currentStep++;
      setGristWizardStep(currentStep);
    }
  });
};

export {
  bindNewLayerModalGrist,
  getGristWizardContentSteps,
  hideGristImportArea,
  initGristApiKey,
  initGristImportArea,
  initGristLocationSwitches,
  initGristNewLayerModal,
  initGristWizard,
  setGristWizardStep,
};
