import TemplateComponent from "./TemplateComponent.js";
import ColorSelector from "../forms/ColorSelector.js";

export const header = () => ({
  icon: "bi bi-type-h3",
  id: mv.uuidv4(),
  title: mviewer.tr("template.h3.title"),
  click: () => TextH3Component,
  class: "TextH3Component",
});

const defaultTypeFields = ["field", "multi", "static"];

const attributes = ["data-type-selector", "data-color", "data-value"];

export default class TextH3Component extends TemplateComponent {
  textColor = null;
  constructor(customHeader, defaultAttrValues) {
    let defaultValues = new Map();
    if (defaultAttrValues) {
      attributes.forEach((a) =>
        defaultValues.set(a, defaultAttrValues.getNamedItem(a)?.value)
      );
    }
    const textColor = new ColorSelector(
      defaultValues.get("data-color"),
      "Couleur du texte"
    );
    super(customHeader || header(), defaultTypeFields, [textColor], defaultValues);
    this.textColor = textColor;
  }

  getAttributes = () => attributes;

  render = () => {
    if (!this.getFields().length) return "";
    let values = {
      value: this.getFields().map((x) => x.getValue())[0],
      color: this.textColor.getValue(),
    };
    return this.template(values);
  };

  template = ({ value, color = "#009688" }) => {
    let typeField = this.getType();
    let starterCondition = typeField == "field" ? `{{#${value.value}}}` : "";
    let closeCondition = typeField == "field" ? `{{/${value.value}}}` : "";
    return `
    ${starterCondition}
    <div class="${header().class} template-component mb-2" id="${mv.uuidv4()}"
      data-type-selector="${this.getType()}"
      data-color="${color}"
      data-value="${value.value}"
      data-component="${header().class}"
    >
        <!--
        Variable : nom
        Prop : color
        -->
        <h4 style="font-weight:bold; color:${color};">${value.template}</h4>
        </div>${closeCondition}`;
  };
}
