/**
 * Import type selector for the Grist import step.
 *
 * Usage:
 * `const block = new mv.components.importGristArea();`
 * `target.appendChild(block.render());`
 */
const importGristArea = function (activeType = "file") {
  this.activeType = activeType;
  this.element = document.createElement("div");
  this.element.className = "import-type-buttons";
};

importGristArea.prototype.setActiveType = function (type) {
  this.activeType = type;
  this.update();
};

importGristArea.prototype.update = function () {
  const fileButton = this.element.querySelector('[data-import-type="file"]');
  const gristButton = this.element.querySelector('[data-import-type="grist"]');
  const fileContent = this.element.querySelector('[data-import-content="file"]');
  const gristContent = this.element.querySelector('[data-import-content="grist"]');

  const isFileActive = this.activeType === "file";

  fileButton?.classList.toggle("active", isFileActive);
  gristButton?.classList.toggle("active", !isFileActive);
  fileContent?.classList.toggle("d-none", !isFileActive);
  gristContent?.classList.toggle("d-none", isFileActive);
};

importGristArea.prototype.render = function () {
  this.element.innerHTML = `
    <div class="import-type-buttons__actions">
      <button
        type="button"
        class="import-type-buttons__button"
        data-import-type="file"
      >
        <span class="import-type-buttons__title">Importer un fichier</span>
        <span class="import-type-buttons__description">Ajoutez facilement vos donnees depuis un fichier CSV ou Excel</span>
      </button>
      <button
        type="button"
        class="import-type-buttons__button"
        data-import-type="grist"
      >
        <span class="import-type-buttons__title">Choisir une table Grist</span>
        <span class="import-type-buttons__description">Selectionnez une table existante dans votre espace Grist</span>
      </button>
    </div>
    <div class="import-type-buttons__content" data-import-content="file">
      <h6 class="mb-0">Importer un fichier</h6>
    </div>
    <div class="import-type-buttons__content d-none" data-import-content="grist">
      <h6 class="mb-0">Choisir une table Grist</h6>
    </div>
  `;

  this.element
    .querySelector('[data-import-type="file"]')
    ?.addEventListener("click", () => this.setActiveType("file"));

  this.element
    .querySelector('[data-import-type="grist"]')
    ?.addEventListener("click", () => this.setActiveType("grist"));

  this.update();

  return this.element;
};

export default importGristArea;
