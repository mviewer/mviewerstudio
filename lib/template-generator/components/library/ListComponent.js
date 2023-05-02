import TemplateComponent from './TemplateComponent.js';

export const header = () => ({
  icon: 'bi bi-list-ul',
  title: 'Liste',
  id: crypto.randomUUID(),
  click: () => ListComponent
});

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
