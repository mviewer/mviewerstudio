/**
 * Horizontal Grist import wizard.
 *
 * Usage:
 * `const wizard = new mv.components.grist.gristWizard({ step: 1 });`
 * `target.appendChild(wizard.render());`
 * `wizard.changeStep(2);`
 */

const defaultSteps = [
  {
    label: "Connexion à Grist",
    description: "Informations de connexion",
    icon: "bi-file-earmark-spreadsheet",
  },
  {
    label: "Données",
    description: "Sélection des données",
    icon: "bi-file-earmark-spreadsheet",
  },
  {
    label: "Localisation",
    description: "Paramètres géographiques",
    icon: "bi-geo-alt",
  },
  {
    label: "Résultat",
    description: "Contrôle du résultat",
    icon: "bi-layers",
  },
];

const normalizeStep = (step, fallbackStep) => ({
  label: step?.label || fallbackStep.label,
  description: step?.description || fallbackStep.description,
  icon: step?.icon || fallbackStep.icon,
});

const GristWizard = function (options = {}) {
  this.steps = (options.steps?.length ? options.steps : defaultSteps).map(
    (step, index) => normalizeStep(step, defaultSteps[index] || defaultSteps[0])
  );
  this.step = Number(options.step) || 1;
  this.element = document.createElement("div");
  this.element.className = `grist-wizard ${options.classes || ""}`.trim();
};

GristWizard.prototype.render = function () {
  this.element.replaceChildren();
  this.element.setAttribute("role", "list");
  this.element.setAttribute("aria-label", "Étapes de l'import Grist");
  this.element.style.setProperty("--grist-wizard-step-count", this.steps.length);

  this.steps.forEach((step, index) => {
    const stepNumber = index + 1;
    const item = document.createElement("div");
    const marker = document.createElement("span");
    const icon = document.createElement("i");
    const text = document.createElement("span");
    const label = document.createElement("span");
    const description = document.createElement("span");

    item.className = "grist-wizard-step";
    item.setAttribute("role", "listitem");
    item.dataset.step = stepNumber;
    item.classList.toggle("grist-wizard-step-active", stepNumber === this.step);
    item.classList.toggle("grist-wizard-step-done", stepNumber < this.step);

    marker.className = "grist-wizard-marker";
    icon.className = `bi ${step.icon}`;
    icon.setAttribute("aria-hidden", "true");
    marker.appendChild(icon);

    label.className = "grist-wizard-label";
    label.textContent = step.label;

    description.className = "grist-wizard-description";
    description.textContent = step.description;

    text.className = "grist-wizard-text";
    text.append(label, description);
    item.append(marker, text);
    this.element.appendChild(item);
  });

  return this.element;
};

GristWizard.prototype.changeStep = function (step) {
  const nextStep = Number(step);

  if (Number.isFinite(nextStep)) {
    this.step = Math.min(Math.max(nextStep, 1), this.steps.length);
  }

  return this.render();
};

GristWizard.prototype.appendTo = function (target) {
  if (target) {
    target.appendChild(this.element);
  }

  return this.render();
};

export default GristWizard;
