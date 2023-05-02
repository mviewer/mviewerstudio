import TemplateComponent from './TemplateComponent.js';

export const header = () => ({
  icon: 'bi bi-type-h1',
  id: crypto.randomUUID(),
  title: 'Titre',
  click: () => TextH1Component
});

const defaultTypeFields = ['field', 'multi', 'static'];

export default class TextH1Component extends TemplateComponent {
  constructor(customHeader) {
    super(customHeader || header(), defaultTypeFields);
  }

  render = () => {
    if (!this.getFields().length) return "";
    return this.template(this.getFields().map(x => x.getValue())[0]);
  }

  template = (value, color="#009688") => {
    return `
    <div class="textH1Component mb-2">
        <!--
        Variable : nom
        Prop : color
        -->
        <h3 style="font-weight: bold;color: ${color};">${ value }</h3>
    </div>`
  }
}
