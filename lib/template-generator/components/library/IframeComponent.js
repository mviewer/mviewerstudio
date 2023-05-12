import TemplateComponent from './TemplateComponent.js';

export const header = () => ({
  icon: 'bi-code-slash',
  title: 'Iframe',
  id: crypto.randomUUID(),
  click: () => IframeComponent,
  class: "iframeComponent"
});

const defaultTypeFields = ['field', 'static'];

const attributes = ["data-type-selector", "data-value"];

export default class IframeComponent extends TemplateComponent {
  constructor(customHeader, defaultAttrValues) {
    let defaultValues = new Map();
    if (defaultAttrValues) {
      attributes.forEach(a => defaultValues.set(a, defaultAttrValues.getNamedItem(a)?.value));
    }
    super(customHeader || header(), defaultTypeFields, [], defaultValues);
  }

  getAttributes = () => attributes

  render = () => {
    if (!this.getFields().length) return "";
    return this.template(this.getFields().map(x => x.getValue())[0]);
  }

  template = (value) => {
    let mstSyntax = value.template;
    return `
      <div class="${header().class} template-component mb-2"
        data-type-selector="${this.getType()}"
        data-value="${value.value}"
        data-component="${header().class}"
      >
      <iframe src="${ mstSyntax }" height="200" width="100%"  frameborder="0" name="demo">
        <p>Votre navigateur ne supporte aucune iframe</p>
        </iframe>
      </div>`;
  }
}
