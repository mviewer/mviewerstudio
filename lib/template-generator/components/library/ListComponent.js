import TemplateComponent from './TemplateComponent.js';

export const header = () => ({
  icon: 'bi bi-list-ul',
  title: 'Liste',
  id: crypto.randomUUID(),
  click: () => ListComponent
});

const defaultTypeFields = ['field', 'static'];

export default class ListComponent extends TemplateComponent {
  constructor(customHeader) {
    super(customHeader || header(), defaultTypeFields);
  }
  render = () => {
    if (!this.getFields().length) return "";
    return this.template(this.getFields().map(x => x.getValue())[0]);
  }

  template = (value) => {
    return `
    <div class="listComponent mb-2">
    <!--
    Variable : li
    -->
      <ul style="list-style-type: disc;margin-bottom:10px;">
          {{#${value}}}
              <li>{{.}}</li>
          {{/${value}}}
      </ul>
    </div>
    `
  }
}
