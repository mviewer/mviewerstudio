/**
 * Reusable Grist workflow content.
 *
 * The component owns the complete structure displayed in a Grist tab. Its
 * default identifiers preserve compatibility with the existing import flow.
 * A caller may provide a different prefix to mount another isolated instance.
 *
 * @param {Object} [options={}] Component configuration.
 * @param {string} [options.idPrefix="newlayer-grist"] Prefix for DOM ids.
 * @param {Object} [options.state={}] Initial workflow state.
 * @param {number} [options.state.step=1] Active wizard step.
 * @param {HTMLElement} [options.state.auth] Initial authentication content.
 * @param {HTMLElement} [options.state.data] Initial data content.
 * @param {HTMLElement} [options.state.location] Initial location content.
 * @param {HTMLElement} [options.state.result] Initial result content.
 * @param {Object[]} [options.state.locationModes] Available localization modes.
 * @param {boolean} [options.state.locationListCard=false] Whether localization modes are grouped in a list card.
 * @param {HTMLElement[]} [options.state.locationCards] Additional cards displayed below localization modes.
 * @param {boolean} [options.hideData=false] Whether the data step is already known.
 * @param {boolean} [options.managedNavigation=false] Whether the instance handles next/back steps.
 * @param {Function} [options.onNext] Callback run before moving to the next step.
 * @param {Function} [options.onBack] Callback run before returning to the previous step.
 * @returns {void}
 */
const GristContent = function (options = {}) {
  this.idPrefix = options.idPrefix || "newlayer-grist";
  this.state = options.state || {};
  this.hideData = options.hideData || false;
  this.managedNavigation = options.managedNavigation || false;
  this.onNext = options.onNext || null;
  this.onBack = options.onBack || null;
  this.element = document.createElement("div");
  this.element.className = "grist-content";
  this.ids = this.getIds();
};

/**
 * Translate a workflow label while keeping the component usable before the
 * application translation service is available.
 *
 * @param {string} key Translation key.
 * @param {string} fallback Default label.
 * @returns {string} Localized label or its fallback.
 */
const getWorkflowLabel = (key, fallback) =>
  typeof mviewer !== "undefined" && mviewer.tr ? mviewer.tr(key) : fallback;

/**
 * Return the identifiers used by this component instance.
 *
 * @returns {Object} Workflow container identifiers.
 */
GristContent.prototype.getIds = function () {
  return {
    wizard: `${this.idPrefix}-wizard`,
    workflow: `${this.idPrefix}-workflow`,
    auth: `${this.idPrefix}-auth`,
    data: `${this.idPrefix}-data`,
    location: `${this.idPrefix}-location`,
    preview: `${this.idPrefix}-location-preview`,
    address: `${this.idPrefix}-location-address`,
    ref: `${this.idPrefix}-location-ref`,
    xy: `${this.idPrefix}-location-xy`,
    result: `${this.idPrefix}-result`,
    footer: `${this.idPrefix}-footer`,
    back: `${this.idPrefix}-back`,
    next: `${this.idPrefix}-next`,
  };
};

/**
 * Return one named workflow container from this instance.
 *
 * @param {string} name Container name: auth, data, location or result.
 * @returns {HTMLElement|null} Requested container.
 */
GristContent.prototype.getContainer = function (name) {
  if (!this.ids[name]) {
    return null;
  }

  return this.element.querySelector(`#${this.ids[name]}`);
};

/**
 * Replace the workflow state and render its supplied content.
 *
 * @param {Object} state Workflow state.
 * @returns {HTMLElement} Component root element.
 */
GristContent.prototype.setState = function (state = {}) {
  this.state = state;
  this.element.dataset.step = this.state.step || 1;

  ["auth", "data", "location", "result"].forEach((name) => {
    const target = this.element.querySelector(`#${this.ids[name]}`);
    const content = this.state[name];

    if (target && content instanceof HTMLElement) {
      target.replaceChildren(content);
    }
  });
  this.renderLocationModes();

  return this.element;
};

/**
 * Render selectable localization modes when they are supplied in the state.
 *
 * @returns {void}
 */
GristContent.prototype.renderLocationModes = function () {
  const modes = this.state.locationModes || [];
  const container = this.getContainer("location");

  if (!modes.length || !container || !mv.components.switch) {
    return;
  }

  const switches = [];
  const listCard =
    this.state.locationListCard && mv.components.listCard
      ? new mv.components.listCard({
          title: getWorkflowLabel("modal.layer.grist.workflow.location", "Localisation"),
          description: getWorkflowLabel(
            "modal.layer.grist.workflow.location.description",
            "Paramètres géographiques"
          ),
        })
      : null;
  const renderModeContent = (switchItem, mode) => {
    switches.forEach((item) => item.setContent(null));

    if (mode.createContent) {
      switchItem.setContent(mode.createContent());
    }
  };

  container.replaceChildren();
  modes.forEach((mode) => {
    const switchItem = new mv.components.switch({
      id: `${this.idPrefix}-location-${mode.value}`,
      name: `${this.idPrefix}-location-mode`,
      label: mode.label,
      description: mode.description,
      tooltip: mode.tooltip,
      checked: mode.value === this.state.geolocType,
      onChange: (checked, currentSwitch) => {
        if (!checked) {
          currentSwitch.setChecked(true);
          return;
        }

        switches.forEach((item) => item.setChecked(item === currentSwitch));
        renderModeContent(currentSwitch, mode);
        this.state.geolocType = mode.value;
        if (this.state.onLocationChange) {
          this.state.onLocationChange(mode.value);
        }
      },
    });

    switches.push(switchItem);
    if (listCard) {
      listCard.addItem(switchItem.render());
      return;
    }

    container.appendChild(switchItem.render());
  });

  if (listCard) {
    container.appendChild(listCard.render());
  }
  (this.state.locationCards || []).forEach((card) => {
    if (card instanceof HTMLElement) {
      container.appendChild(card);
    }
  });

  const activeSwitch = switches.find((switchItem) => switchItem.getChecked());
  if (activeSwitch) {
    const activeMode = modes.find(
      (mode) => `${this.idPrefix}-location-${mode.value}` === activeSwitch.id
    );

    renderModeContent(activeSwitch, activeMode);
  }
};

/**
 * Show the requested workflow step for this instance.
 *
 * @param {number} step Step number to display.
 * @returns {HTMLElement} Component root element.
 */
GristContent.prototype.setStep = function (step) {
  const activeStep = step || 1;
  const maxStep = this.hideData ? 3 : 4;
  const stepContainers = {
    auth: 1,
    location: this.hideData ? 2 : 3,
    result: this.hideData ? 3 : 4,
  };

  this.element.dataset.step = activeStep;
  if (this.wizard) {
    this.wizard.changeStep(activeStep);
  }
  Object.keys(stepContainers).forEach((name) => {
    const container = this.getContainer(name);

    if (container) {
      container.classList.toggle("d-none", stepContainers[name] !== activeStep);
    }
  });

  const dataContainer = this.getContainer("data");
  if (dataContainer) {
    dataContainer.classList.toggle("d-none", this.hideData || activeStep !== 2);
  }

  if (this.managedNavigation) {
    const backButton = this.element.querySelector(`#${this.ids.back}`);
    const nextButton = this.element.querySelector(`#${this.ids.next}`);

    backButton.classList.toggle("d-none", activeStep <= 1);
    nextButton.classList.toggle("d-none", activeStep >= maxStep);
    nextButton.disabled = activeStep === 1 && this.state.apiKeyReady !== true;
  }

  return this.element;
};

/**
 * Render the Grist tab structure.
 *
 * @returns {HTMLElement} Component root element.
 */
GristContent.prototype.render = function () {
  const ids = this.ids;

  this.element.innerHTML = `
    <div id="${ids.wizard}"></div>
    <div class="mt-3" id="${ids.workflow}">
      <div id="${ids.auth}"></div>
      ${this.hideData ? "" : `<div id="${ids.data}"></div>`}
      <div id="${ids.location}" class="grist-location-options">
        <div id="${ids.preview}"></div>
        <div id="${ids.address}"></div>
        <div id="${ids.ref}"></div>
        <div id="${ids.xy}"></div>
      </div>
      <div id="${ids.result}"></div>
      <div id="${ids.footer}" class="my-3 pt-2">
        <button type="button" id="${ids.back}" class="btn btn-link d-none"><i class="ri-arrow-left-line"></i> ${getWorkflowLabel("modal.layer.grist.workflow.back", "Retour")}</button>
        <button type="button" id="${ids.next}" class="btn grist-wizard-next-button d-none">${getWorkflowLabel("modal.layer.grist.workflow.next", "Suivant")} <i class="ri-arrow-right-line"></i></button>
      </div>
    </div>
  `;

  if (mv.components.grist.gristWizard) {
    const wizard = new mv.components.grist.gristWizard({
      step: this.state.step || 1,
      steps: this.hideData
        ? [
            {
              label: getWorkflowLabel("modal.layer.grist.workflow.connection", "Connexion à Grist"),
              description: getWorkflowLabel("modal.layer.grist.workflow.connection.description", "Informations de connexion"),
              icon: "bi-file-earmark-spreadsheet",
            },
            {
              label: getWorkflowLabel("modal.layer.grist.workflow.location", "Localisation"),
              description: getWorkflowLabel("modal.layer.grist.workflow.location.description", "Paramètres géographiques"),
              icon: "bi-geo-alt",
            },
            {
              label: getWorkflowLabel("modal.layer.grist.workflow.result", "Résultat"),
              description: getWorkflowLabel("modal.layer.grist.workflow.result.description", "Contrôle du résultat"),
              icon: "bi-layers",
            },
          ]
        : undefined,
    });

    this.wizard = wizard;
    wizard.appendTo(this.getContainer("wizard"));
  }

  this.setState(this.state);
  this.setStep(this.state.step || 1);

  if (this.managedNavigation) {
    const backButton = this.element.querySelector(`#${ids.back}`);
    const nextButton = this.element.querySelector(`#${ids.next}`);

    backButton.addEventListener("click", () => {
      const currentStep = Number(this.element.dataset.step);

      if (this.onBack) {
        this.onBack({ gristContent: this, currentStep, backButton });
        return;
      }

      this.setStep(currentStep - 1);
    });
    nextButton.addEventListener("click", () => {
      const currentStep = Number(this.element.dataset.step);

      if (this.onNext) {
        this.onNext({ gristContent: this, currentStep, nextButton });
        return;
      }

      this.setStep(currentStep + 1);
    });
  }

  return this.element;
};

/**
 * Mount the component in the supplied container.
 *
 * @param {HTMLElement} target Target container.
 * @returns {HTMLElement} Component root element.
 */
GristContent.prototype.appendTo = function (target) {
  target.replaceChildren(this.render());

  return this.element;
};

export default GristContent;
