import TemplateComponent from './TemplateComponent.js';

export const header = () => ({
  icon: 'bi bi-box-arrow-up-right',
  title: 'Bouton',
  id: crypto.randomUUID(),
  click: () => ButtonComponent
});

const defaultTypeFields = ['field', 'static'];

export default class ButtonComponent extends TemplateComponent {
  constructor() {
    super(header, defaultTypeFields);
  }

  render = () => {
    if (!this.getFields().length) return "";
    return this.template(this.getFields().map(x => x.getValue())[0]);
  }

  template = (value) => {
    return `<a type="button" class="btn btn-primary" href="${value}" target="_blank">cliquer</a>`
  }
}
