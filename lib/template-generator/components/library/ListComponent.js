import TemplateComponent from './TemplateComponent.js';

export const header = () => ({
  icon: 'bi bi-list-ul',
  title: 'Liste',
  id: crypto.randomUUID(),
  click: () => ListComponent
});

const defaultTypeFields = ['liField', 'static'];

export default class ListComponent extends TemplateComponent {
  constructor(customHeader) {
    super(customHeader || header(), defaultTypeFields);
  }
  render = (isPreview) => {
    if (!this.getFields().length) return "";
    return this.template(this.getFields().map(x => {
      return x.getValue(isPreview)
    })[0]);
  }

  template = (value) => {
    return `
    <div class="listComponent mb-2">
      <ul style="list-style-type: disc;margin-bottom:10px;">
          ${value}
      </ul>
    </div>
    `
  }
}
