import TemplateComponent from './TemplateComponent.js';

export const header = () => ({
  icon: 'bi bi-text-left',
  title: 'Text',
  id: crypto.randomUUID(),
});

const defaultTypeFields = ['field', 'multi', 'static'];

export default class TextComponent extends TemplateComponent {
  constructor(customHeader) {
    super(customHeader || header(), defaultTypeFields);
  }
  render = () => {
    if (!this.getFields().length) return "";
    return this.template(this.getFields().map(x => x.getValue())[0]);
  }

  template = (value) => {
    return `<div class="textComponent mb-2">
      <p>${value}</p>
    </div>`;
  }
}
