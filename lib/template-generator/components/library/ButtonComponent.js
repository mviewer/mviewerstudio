import TemplateComponent from './TemplateComponent.js';

export const header = () => ({
  icon: 'bi bi-box-arrow-up-right',
  title: 'Bouton',
  id: crypto.randomUUID(),
  click: () => ButtonComponent
});

const defaultTypeFields = ['field', 'static'];

export default class ButtonComponent extends TemplateComponent {
  constructor(customHeader) {
    super(customHeader || header(), defaultTypeFields);
  }

  render = () => {
    if (!this.getFields().length) return "";
    return this.template(this.getFields().map(x => x.getValue())[0]);
  }

  template = (href, text = "visiter", color = "white", backgroundColor = "#345266") => {
    return `
    <div class="linkComponent mb-1">
      <!--
      Variable : a > href
      Prop : color
      Prop : background-color
      -->
      <a href="${href}" target="_blank" class="btn" style="background-color: ${backgroundColor};color:${color};">${text}</a>
    </div>
    `
  }
}
