import TypeFieldSelector from "../forms/TypeFieldSelector.js";
import InputStaticValueComponent from "../forms/InputStaticValueComponent.js";
import InputFieldValueComponent from "../forms/InputFieldValueComponent.js";
import InputTagsComponent from "../forms/InputTagsComponent.js";
import InputFieldListComponent from "../forms/InputFieldListComponent.js";

export default class TemplateComponent {
  componentsArea = null;
  fields = [];
  selected = false;
  customFields = [];
  defaultType = "";
  defaultValues = null;
  constructor(
    header = { icon: "", title: "" },
    defaultTypeFields = ["field", "multi", "static"],
    customFields = [],
    defaultValues
  ) {
    this.uuid = mv.uuidv4().split("-").join("");
    this.header = { ...header, id: this.uuid };
    if (defaultValues) {
      this.defaultValues = defaultValues;
      this.defaultType = defaultValues.get("data-type-selector");
    }
    this.typeFieldSelector = new TypeFieldSelector({
      fields: defaultTypeFields,
      defaultType: this.defaultType,
    });
    this.customFields = customFields;
  }

  getType = () =>
    document.getElementById(this.uuid).querySelector(`.type-field-selector`).value;

  getFields = () => {
    return this.fields;
  };

  cardHeader = () => `<div class="titleCompBlock mb-3">
    <div class="titleComp"><i class="${this.header.icon}"></i>${mviewer.tr(this.header.title)}</div>
    <span class="deleteComp" onclick="mv.templateGenerator.removeComponent(this)"><i class="bi bi-x-circle"></i></span>
  </div>`;

  addSelectors = (customSelectors) =>
    (this.customSelectors = [...this.customSelectors, ...customSelectors]);

  getForms = (type) => {
    let form = null;
    this.fields = [];
    let component;
    this.cleanAreaComponents();
    if (!mv.templateGenerator?.feature?.properties) return;
    let dataFields = Object.keys(mv.templateGenerator?.feature?.properties);
    if (type != "static" && !dataFields.length) {
      return;
    }

    if (type == "static") {
      component = new InputStaticValueComponent(
        this.uuid,
        this.defaultValues && this.defaultValues.get("data-value")
      );
    }

    if (type == "field") {
      component = new InputFieldValueComponent(
        this.uuid,
        dataFields,
        this.defaultValues && this.defaultValues.get("data-value")
      );
    }

    if (type == "liField") {
      component = new InputFieldListComponent(
        this.uuid,
        dataFields,
        this.defaultValues && this.defaultValues.get("data-value"),
        this.defaultValues && this.defaultValues.get("data-sub-value")
      );
    }

    if (type == "multi") {
      component = new InputTagsComponent(
        this.uuid,
        dataFields,
        `data-allow-new='true'`,
        this.defaultValues && this.defaultValues.get("data-value")
      );
      mv.multiField = component;
    }

    if (component) {
      form = component.render();
      this.fields.push(component);
    }
    this.componentsArea.insertAdjacentHTML("beforeend", form);

    if (mv.multiField && !mv.multiField.isActivate) {
      mv.multiField.activate();
    }
    if (type === "liField" && this.defaultValues) {
      component.initJsonFields(
        this.defaultValues.get("data-value"),
        this.defaultValues.get("data-sub-value")
      );
    }
  };

  getCustomFields = () => {
    let customForms = [];
    if (this.customFields.length) {
      customForms = this.customFields.map((component) => {
        return component.render();
      });
    }
    this.componentsArea.insertAdjacentHTML("beforeend", customForms.join(""));
  };

  tooltipContent = () => {
    return this.header?.helpMsg
      ? `
    <span class="text-right">
    <a type="button"
      class="btn tooltip-info"
      data-bs-toggle="tooltip"
      data-bs-placement="right"
      title="${this.header.helpMsg}">
      <i class="ri-information-line"></i>
      </a>
    </span>`
      : "";
  };

  content = () => {
    return `
    <div class="card cardComponent titleComponent" id=${this.uuid}>
        ${this.cardHeader()}
        ${this.typeFieldSelector.render()}
        <div class="subcomponents" id="${mv.uuidv4()}"></div>
        ${this.tooltipContent()}
    </div>`;
  };

  add = (target) => {
    target.insertAdjacentHTML("beforeend", this.content());
    this.componentsArea = document
      .getElementById(this.uuid)
      .querySelector(".subcomponents");
    const typeFieldSelectorFromDOM = document.getElementById(this.typeFieldSelector.uuid);
    typeFieldSelectorFromDOM.addEventListener("change", (el) => {
      this.getForms(el.target.value);
      this.getCustomFields();
      _elementTranslate("body");
    });
    if (this.defaultType) {
      typeFieldSelectorFromDOM.dispatchEvent(new Event("change"));
    }
    _elementTranslate("body")
  };

  setType = (type) => {
    this.getForms(type);
  };

  remove = () => document.getElementById(this.uuid).remove();

  cleanAreaComponents = () => {
    [...this.componentsArea.childNodes].forEach((x) => x.remove());
  };

  setSelected = () => {
    this.selected = !this.selected;
  };
}
