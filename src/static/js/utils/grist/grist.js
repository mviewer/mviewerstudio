const GRIST_TAB_TARGET = "#newlayer-grist";

/**
 * Return the Grist wizard content panels in display order.
 *
 * The footer is excluded because it is navigation, not a wizard step.
 *
 * @returns {HTMLElement[]} Ordered Grist wizard step containers.
 */
const getGristWizardContentSteps = () =>
  Array.from(document.querySelectorAll("#newLayerByGrist > div:not(#grist-footer)"));

/**
 * Render the Grist localization mode switches.
 *
 * Only one switch can be active at a time. If the current active switch is
 * toggled off, it is immediately re-enabled to keep one selected mode.
 *
 * @returns {void}
 */
const initGristLocationSwitches = () => {
  const Switch = mv.components && mv.components.switch;
  if (!Switch) {
    return;
  }

  const switchConfigs = [
    {
      targetId: "grist-location-address",
      id: "adresseSwitch",
      label: "À partir d’une adresse",
      description: "Géocodez vos données (adresse, ville...)",
      checked: true,
    },
    {
      targetId: "grist-location-ref",
      id: "refSwitch",
      label: "À partir d’un référentiel",
      description: "Associez vos données à un référentiel géographique",
      checked: false,
    },
    {
      targetId: "grist-location-xy",
      id: "xySwitch",
      label: "À partir de coordonnées X/Y",
      description: "Utilisez des colonnes de coordonnées existantes",
      checked: false,
    },
  ];
  const switches = [];
  const selectOnly = (activeSwitch) => {
    if (!activeSwitch.getChecked()) {
      activeSwitch.setChecked(true);
    }

    switches.forEach((switchItem) => {
      switchItem.setChecked(switchItem === activeSwitch);
    });
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
};

/**
 * Display a Grist wizard step and update navigation button state.
 *
 * The requested step is clamped between the first and last available content
 * step. The "Suivant" button remains disabled when the current step requires
 * validated data that is not ready yet.
 *
 * @param {number|string} step Wizard step number to display, starting at 1.
 * @returns {void}
 */
const setGristWizardStep = (step) => {
  const steps = getGristWizardContentSteps();
  const importGristAreaContainer = document.getElementById("newLayerByGrist");
  const gristWizardContainer = document.getElementById("newlayer-grist-wizard");
  const backButton = document.getElementById("gristWizardBackButton");
  const nextButton = document.getElementById("gristWizardNextButton");
  const maxStep = steps.length || 1;
  const activeStep = Math.min(Math.max(Number(step) || 1, 1), maxStep);

  gristWizardContainer?._gristWizard?.changeStep(activeStep);
  steps.forEach((contentStep, index) => {
    contentStep.classList.toggle("d-none", index + 1 !== activeStep);
  });

  [backButton, nextButton].forEach((button) => {
    if (button) {
      button.dataset.step = activeStep;
    }
  });

  backButton?.classList.toggle(
    "d-none",
    activeStep <= 1 || !importGristAreaContainer
  );
  nextButton?.classList.toggle(
    "d-none",
    activeStep >= maxStep || !importGristAreaContainer
  );
  if (nextButton) {
    nextButton.disabled =
      (activeStep === 1 && nextButton.dataset.apiKeyReady !== "true") ||
      (activeStep === 2 && nextButton.dataset.ready !== "true");
  }
};

/**
 * Initialize the horizontal Grist wizard component at step 1.
 *
 * @returns {void}
 */
const initGristWizard = () => {
  const gristWizardContainer = document.getElementById("newlayer-grist-wizard");
  const GristWizard = mv.components && mv.components.grist && mv.components.grist.gristWizard;

  if (!gristWizardContainer || !GristWizard) {
    return;
  }

  gristWizardContainer.replaceChildren();
  const gristWizard = new GristWizard({
    step: 1,
  });
  gristWizard.appendTo(gristWizardContainer);
  gristWizardContainer._gristWizard = gristWizard;
};

/**
 * Render the Grist data import area after API key validation.
 *
 * @param {string} apiKey Valid Grist API key used by import components.
 * @returns {void}
 */
const initGristImportArea = (apiKey) => {
  const importGristAreaContainer = document.getElementById("newLayerByGrist");
  const gristDataContainer = document.getElementById("grist-data");
  const ImportGristArea = mv.components && mv.components.grist && mv.components.grist.importGristArea;

  if (!importGristAreaContainer || !gristDataContainer || !ImportGristArea) {
    return;
  }

  gristDataContainer.replaceChildren();
  const importGristArea = new ImportGristArea({
    apiKey,
  });
  gristDataContainer.appendChild(importGristArea.render());
  mv.utils?.grist?.validation?.disableGristWizardNextButton();
  const nextButton = document.getElementById("gristWizardNextButton");
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
  const importGristAreaContainer = document.getElementById("newLayerByGrist");
  const gristDataContainer = document.getElementById("grist-data");

  if (!importGristAreaContainer || !gristDataContainer) {
    return;
  }

  gristDataContainer.replaceChildren();
  const nextButton = document.getElementById("gristWizardNextButton");
  if (nextButton) {
    nextButton.dataset.apiKeyReady = "false";
  }
  mv.utils?.grist?.validation?.disableGristWizardNextButton();
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
  const gristAuthContainer = document.getElementById("grist-auth");
  const GristApiKey = mv.components && mv.components.grist && mv.components.grist.gristApiKey;

  if (!gristAuthContainer || !GristApiKey) {
    return;
  }

  gristAuthContainer.replaceChildren();
  const gristApiKey = new GristApiKey(
    config?.grist?.api_url || config?.grist?.instance_url,
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
 * @param {HTMLElement|null} [modal=document.getElementById("mod-layerNew")]
 * Modal element that contains the Grist tab.
 * @param {Function} [getConfig] Function returning the current app config.
 * @returns {void}
 */
const bindNewLayerModalGrist = (
  modal = document.getElementById("mod-layerNew"),
  getConfig = () =>
    window._conf || (typeof _conf !== "undefined" ? _conf : undefined)
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
    const backButton = event.target.closest("#gristWizardBackButton");
    const nextButton = event.target.closest("#gristWizardNextButton");

    if (tab) {
      if (tab.getAttribute("data-bs-target") !== GRIST_TAB_TARGET) {
        document.getElementById("gristWizardBackButton")?.classList.add("d-none");
        document.getElementById("gristWizardNextButton")?.classList.add("d-none");
        return;
      }

      const currentStep =
        Number(document.getElementById("gristWizardNextButton")?.dataset.step) || 1;
      setGristWizardStep(currentStep);
    }

    if (backButton) {
      setGristWizardStep((Number(backButton.dataset.step) || 1) - 1);
    }

    if (nextButton) {
      setGristWizardStep((Number(nextButton.dataset.step) || 1) + 1);
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

export default {
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
