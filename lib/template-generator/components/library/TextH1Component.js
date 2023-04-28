import TemplateComponent from './TemplateComponent.js';

const header = {
  icon: 'bi bi-type-h1',
  title: 'Titre',
};

const defaultTypeFields = ['field', 'multi', 'static'];

export default class TextH1Component extends TemplateComponent {
  constructor() {
    super(header, defaultTypeFields);
  }

  render = () => {
    if (!this.getFields().length) return "";
    return this.getFields().map(x => x.getValue());
  }
}
