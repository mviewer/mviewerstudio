import TemplateComponent from './TemplateComponent.js';

export const header = () => ({
  icon: 'bi bi-type-h3',
  title: 'Sous-titre',
  id: crypto.randomUUID(),
  click: () => TextH3Component
});

const defaultTypeFields = ['field', 'multi', 'static'];

export default class TextH3Component extends TemplateComponent {
  constructor(customHeader) {
    super(customHeader || header(), defaultTypeFields);
  }

  render = () => {
    if (!this.getFields().length) return "";
    return this.template(this.getFields().map(x => x.getValue())[0]);
  }

  template = (value, color="#009688") => {
    return `
    <div class="textH3Component mb-2">
        <!--
        Variable : nom
        Prop : color
        -->
        <h4 style="font-weight: bold;color: ${color};">${value}</h4>
    </div>`
  }
}
