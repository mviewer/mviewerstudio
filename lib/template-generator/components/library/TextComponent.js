import TemplateComponent from './TemplateComponent.js';

export const header = () => ({
  icon: 'bi bi-text-left',
  id: crypto.randomUUID(),
  title: 'Texte',
  click: () => TextComponent
});

const defaultTypeFields = ['field', 'multi', 'static'];

export default class TextComponent extends TemplateComponent {
  constructor(customHeader) {
    super(customHeader || header(), defaultTypeFields, []);
  }

  render = () => {
    if (!this.getFields().length) return "";
    let values = {
      value: this.getFields().map(x => x.getValue())[0]
    };
    return this.template(values);
  }

  template = ({value}) => {
    return `
    <div class="textTextComponent mb-2">
        <p>${ value }</p>
    </div>`
  }
}
