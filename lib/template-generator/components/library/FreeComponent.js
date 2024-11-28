import TemplateComponent from "./TemplateComponent.js";
import TextArea from "../forms/TextArea.js";

export const header = () => ({
  icon: "bi bi-body-text",
  id: mv.uuidv4(),
  title: "template.free.title",
  click: () => FreeComponent,
  class: "FreeComponent",
});

const defaultTypeFields = [];

const attributes = ["data-value"];

export default class FreeComponent extends TemplateComponent {
  constructor(customHeader, defaultAttrValues) {
    let defaultValues = new Map();
    if (defaultAttrValues) {
      attributes.forEach((a) => {
        defaultValues.set(a, defaultAttrValues[a]);
      });
    }
    const textArea = new TextArea(defaultValues.get("data-value"), "template.free.label");
    super(customHeader || header(), defaultTypeFields, [textArea], defaultValues);
    this.textArea = textArea;
  }

  getAttributes = () => attributes;

  render = () => {
    let values = {
      value: this.textArea.getValue(),
    };
    return this.template(values);
  };

  template = ({ value }) => {
    return `
      <div class="${header().class} template-component mb-2"
        data-type-selector=""
        data-value="${encodeURI(value)}"
        data-component="${header().class}"
      >
      ${value}
      </div>
      `;
  };
}
