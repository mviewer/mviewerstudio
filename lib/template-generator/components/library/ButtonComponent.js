import TemplateComponent from "./TemplateComponent.js";
import ColorSelector from "../forms/ColorSelector.js";
import InputTextComponents from "../forms/InputTextComponent.js";
import IconSelector from "../forms/IconSelector.js";
export const header = () => ({
  icon: "bi bi-box-arrow-up-right",
  title: "Bouton",
  id: mv.uuidv4(),
  click: () => ButtonComponent,
  class: "linkComponent",
});

const defaultTypeFields = ["field", "static"];

const attributes = [
  "data-type-selector",
  "data-value",
  "data-text",
  "data-color",
  "data-icon",
  "data-bg-color",
];

export default class ButtonComponent extends TemplateComponent {
  color = "#ffffff";
  backgroundColor = "#345266";
  constructor(customHeader, defaultAttrValues) {
    let defaultValues = new Map();
    if (defaultAttrValues) {
      attributes.forEach((a) =>
        defaultValues.set(a, defaultAttrValues.getNamedItem(a)?.value)
      );
    }
    const backgroundColor = new ColorSelector(
      defaultValues.get("data-bg-color") || "#345266",
      "Couleur du fond"
    );
    const textColor = new ColorSelector(
      defaultValues.get("data-color") || "#ffffff",
      "Couleur du texte"
    );
    const textComponent = new InputTextComponents(
      defaultValues.get("data-text") || "Accéder",
      "Texte du bouton"
    );
    const iconSelect = new IconSelector(
      "Choisir",
      "iconsModal",
      "templageGeneratorModal",
      defaultValues.get("data-icon")
    );
    super(
      customHeader || header(),
      defaultTypeFields,
      [textColor, backgroundColor, textComponent, iconSelect],
      defaultValues
    );
    this.textColor = textColor;
    this.backgroundColor = backgroundColor;
    this.iconSelect = iconSelect;
    this.textComponent = textComponent;
  }

  getAttributes = () => attributes;

  render = () => {
    if (!this.getFields().length) return "";
    let values = {
      value: this.getFields().map((x) => x.getValue())[0],
      text: this.textComponent.getValue(),
      color: this.textColor.getValue(),
      backgroundColor: this.backgroundColor.getValue(),
      icon: this.iconSelect.getValue(),
    };
    return this.template(values);
  };

  template = ({
    value,
    text = "visiter",
    color = "white",
    backgroundColor = "#345266",
    icon,
  }) => {
    let typeField = this.getType();
    let starterCondition = typeField == "field" ? `{{#${value.value}}}` : "";
    let closeCondition = typeField == "field" ? `{{/${value.value}}}` : "";
    return `
    ${starterCondition}
    <div class="${header().class} template-component mb-2"
      data-type-selector="${this.getType()}"
      data-value="${value.value}"
      data-text="${text}"
      data-icon="${icon}"
      data-color="${color}"
      data-bg-color="${backgroundColor}"
      data-component="${header().class}"
    >
      <a href="${
        value.template
      }" target="_blank" class="btn" style="background-color: ${backgroundColor};color:${color};">
        <i class="${icon}"></i>
        ${text}
      </a>
    </div>
    ${closeCondition}
    `;
  };
}
