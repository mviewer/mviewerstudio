import TemplateComponent from './TemplateComponent.js';

const header = {
  icon: 'bi bi-type-h1',
  title: 'Titre',
};

const defaultTypeFields = ['field', 'multi', 'static'];

export class TextH1Component extends TemplateComponent {
  constructor() {
    super(header, defaultTypeFields, [
      {
        id: 'h1InputForm'
      },
    ]);
  }
}
