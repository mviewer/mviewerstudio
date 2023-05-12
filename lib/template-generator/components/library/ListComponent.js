import TemplateComponent from './TemplateComponent.js';

export const header = () => ({
  icon: 'bi bi-list-ul',
  title: 'Liste',
  id: crypto.randomUUID(),
  click: () => ListComponent,
  class: "listComponent"
});

const defaultTypeFields = ['liField', 'static'];

const attributes = ["data-value"];

export default class ListComponent extends TemplateComponent {
  constructor(customHeader) {
    super(customHeader || header(), defaultTypeFields);
  }
  render = (isPreview) => {
    if (!this.getFields().length) return "";
    return this.template(this.getFields().map(x => {
      return x.getValue(isPreview)
    })[0]);
  }

  getAttributes = () => attributes

  template = (value) => {
    return `
    <div class="${header().class } template-component mb-2"
      data-type-selector="${this.getType()}"
      data-value="${ value}"
      data-component="${header().class}"
    >
      <ul style="list-style-type: disc;margin-bottom:10px;">
          ${value}
      </ul>
    </div>
    `
  }
}
