/**
 * Utilities for controlling the Grist import wizard inside the "new layer"
 * modal.
 *
 * The module synchronizes three UI parts:
 * - the horizontal wizard component;
 * - the step content containers inside `#newLayerByGrist`;
 * - the footer navigation buttons.
 *
 * @module utils/grist/wizard
 */
import {
  GRIST_FOOTER_ID,
  GRIST_WIZARD_BACK_BUTTON_ID,
  GRIST_WIZARD_CONTAINER_ID,
  GRIST_WIZARD_NEXT_BUTTON_ID,
  NEW_LAYER_BY_GRIST_ID,
} from "./const.js";

/**
 * @typedef {HTMLElement & {
 *   _gristWizard?: {
 *     changeStep: Function
 *   }
 * }} GristWizardContainer
 */

/**
 * Return the Grist wizard content panels in display order.
 *
 * The footer is excluded because it is navigation, not a wizard step.
 *
 * @returns {HTMLElement[]} Ordered Grist wizard step containers.
 */
const getGristWizardContentSteps = () =>
  Array.from(
    document.querySelectorAll(`#${NEW_LAYER_BY_GRIST_ID} > div:not(#${GRIST_FOOTER_ID})`)
  );

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
  /** @type {GristWizardContainer|null} */
  const gristWizardContainer = document.getElementById(GRIST_WIZARD_CONTAINER_ID);
  const backButton = document.getElementById(GRIST_WIZARD_BACK_BUTTON_ID);
  const nextButton = document.getElementById(GRIST_WIZARD_NEXT_BUTTON_ID);
  const maxStep = steps.length || 1;
  const activeStep = Math.min(Math.max(step || 1, 1), maxStep);

  if (gristWizardContainer && gristWizardContainer._gristWizard) {
    gristWizardContainer._gristWizard.changeStep(activeStep);
  }
  steps.forEach((contentStep, index) => {
    contentStep.classList.toggle("d-none", index + 1 !== activeStep);
  });

  [backButton, nextButton].forEach((button) => {
    if (button) {
      button.dataset.step = activeStep;
    }
  });

  if (backButton) {
    backButton.classList.toggle("d-none", activeStep <= 1);
  }

  if (nextButton) {
    nextButton.classList.toggle("d-none", activeStep >= maxStep);
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
  /** @type {GristWizardContainer|null} */
  const gristWizardContainer = document.getElementById(GRIST_WIZARD_CONTAINER_ID);

  if (!mv.components || !mv.components.grist) {
    return;
  }

  const GristWizard = mv.components.grist.gristWizard;

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

export { getGristWizardContentSteps, initGristWizard, setGristWizardStep };
