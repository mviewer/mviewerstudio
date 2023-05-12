import TemplateComponent from './TemplateComponent.js';

export const header = () => ({
  icon: 'bi bi-image-alt',
  title: 'Image',
  id: crypto.randomUUID(),
  click: () => ImageComponent,
  class: "imageComponent"
});

const defaultTypeFields = ['field', 'static'];

const attributes = ["data-type-selector", "data-value"];

export default class ImageComponent extends TemplateComponent {
  constructor(customHeader, defaultAttrValues) {
    let defaultValues = new Map();
    if (defaultAttrValues) {
      attributes.forEach(a => defaultValues.set(a, defaultAttrValues.getNamedItem(a)?.value));
    }
    super(customHeader || header(), defaultTypeFields, [], defaultValues);
  }
  render = () => {
    if (!this.getFields().length) return "";
    let values = {
      value: this.getFields().map(x => x.getValue())[0]
    };
    return this.template(values);
  }

  getAttributes = () => attributes

  template = ({value}) => {
    return `<div class="${ header().class } template-component mb-2"
      data-value="${value.value}"
      data-type-selector="${this.getType()}"
      data-component="${header().class}"
    >
      <img src="${value.template}" class="img img-responsive" style="max-height:300px;"/>
    </div>`;
  }
}
