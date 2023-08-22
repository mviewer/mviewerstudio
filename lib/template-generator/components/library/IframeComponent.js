import TemplateComponent from "./TemplateComponent.js";
import StyleCustom from "../forms/StyleCustom.js";

export const header = () => ({
  icon: "bi-code-slash",
  title: "Iframe",
  id: mv.uuidv4(),
  click: () => IframeComponent,
  class: "iframeComponent",
});

const defaultTypeFields = ["field", "static"];

const attributes = ["data-type-selector", "data-value", "data-style"];

export default class IframeComponent extends TemplateComponent {
  constructor(customHeader, defaultAttrValues) {
    let defaultValues = new Map();
    if (defaultAttrValues) {
      attributes.forEach((a) =>
        defaultValues.set(a, defaultAttrValues.getNamedItem(a)?.value)
      );
    }
    const styleCustom = new StyleCustom(defaultValues.get("data-style") || "", "CSS");
    super(customHeader || header(), defaultTypeFields, [styleCustom], defaultValues);
    this.styleCustom = styleCustom;
  }

  getAttributes = () => attributes;

  render = () => {
    if (!this.getFields().length) return "";
    let values = {
      value: this.getFields().map((x) => x.getValue())[0],
      style: this.styleCustom.getValue(),
    };
    return this.template(values);
  };

  template = ({ value, style }) => {
    let typeField = this.getType();
    let starterCondition = typeField == "field" ? `{{#${value.value}}}` : "";
    let closeCondition = typeField == "field" ? `{{/${value.value}}}` : "";
    return `
    ${starterCondition}
      <div class="${header().class} template-component mb-2"
        data-type-selector="${this.getType()}"
        data-value="${value.value}"
        data-style="${style}"
        data-component="${header().class}"
      >
      <iframe src="${value.template}" style="${style}"  frameborder="0" name="demo">
        <p>Votre navigateur ne supporte aucune iframe</p>
        </iframe>
      </div>
      ${closeCondition}
      `;
  };
}
