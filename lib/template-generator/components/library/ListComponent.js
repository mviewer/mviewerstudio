import TemplateComponent from './TemplateComponent.js';

const header = {
  icon: 'bi bi-list-ul',
  title: 'Liste',
};

const defaultTypeFields = ['field', 'static'];

export default class ListComponent extends TemplateComponent {
  constructor() {
    super(header, defaultTypeFields);
  }
  render = () => {
    if (!this.getFields().length) return "";
    return this.template(this.getFields().map(x => x.getValue())[0]);
  }

  template = (value) => {
    return `<ul></ul>`
  }
}
