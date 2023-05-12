import TemplateComponent from './TemplateComponent.js';

export const header = () => ({
  icon: 'bi bi-text-left',
  id: crypto.randomUUID(),
  title: 'Texte',
  click: () => TextComponent,
  class: "textTextComponent"
});

const defaultTypeFields = ['field', 'multi', 'static'];

const attributes = ["data-type-selector", "data-value"];

export default class TextComponent extends TemplateComponent {
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
    return `
    <div class="${header().class} template-component mb-2"
      data-type-selector="${this.getType()}"
      data-value="${value.value}"
      data-component="${header().class}"
    >
        <p>${value.template}</p>
    </div>`
  }
}
