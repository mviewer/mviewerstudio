import TemplateComponent from './TemplateComponent.js';

export const header = () => ({
  icon: 'bi bi-list-ul',
  title: 'Liste',
  id: mv.uuidv4(),
  click: () => ListComponent,
  class: "listComponent"
});

const defaultTypeFields = ['liField', 'static'];

const attributes = ["data-type-selector", "data-value", "data-sub-value"];

export default class ListComponent extends TemplateComponent {
  constructor(customHeader, defaultAttrValues) {
    let defaultValues = new Map();
    if (defaultAttrValues) {
      attributes.forEach(a => defaultValues.set(a, defaultAttrValues.getNamedItem(a)?.value));
    }
    super(customHeader || header(), defaultTypeFields, [], defaultValues);
  }
  render = (isPreview) => {
    if (!this.getFields().length) return "";
    return this.template(this.getFields().map(x => x.getValue(isPreview))[0]);
  }

  getAttributes = () => attributes

  template = (value) => {
    return `
    <div class="${header().class } template-component mb-2"
      data-type-selector="${this.getType()}"
      data-value="${value.value}"
      data-sub-value="${value.subValue}"
      data-component="${header().class}"
    >
      <ul style="list-style-type: disc;margin-bottom:10px;">
          ${value.template}
      </ul>
    </div>
    `
  }
}
