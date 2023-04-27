import TemplateComponent from './TemplateComponent.js';

const header = {
  icon: 'bi bi-list-ul',
  title: 'Liste',
};

const defaultTypeFields = ['field', 'multi', 'static'];

export class ListComponent extends TemplateComponent {
  constructor() {
    super(header, defaultTypeFields, [
      {
        id: 'ListInputForm'
      },
    ]);
  }
}
