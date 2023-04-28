import TemplateComponent from './TemplateComponent.js';

const header = {
  icon: 'bi bi-type-h3',
  title: 'Sous-titre',
};

const defaultTypeFields = ['field', 'multi', 'static'];

export default class TextH3Component extends TemplateComponent {
  constructor() {
    super(header, defaultTypeFields);
  }

  render = () => {
    if (!this.getFields().length) return "";
    return this.template(this.getFields().map(x => x.getValue())[0]);
  }

  template = (value) => {
    return `<h3>${value}</h3><br/>`
  }
}
