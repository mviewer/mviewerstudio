import TemplateComponent from './TemplateComponent.js';

const header = {
  icon: 'bi bi-type-h1',
  title: 'Titre',
};

const defaultTypeFields = ['field', 'multi', 'static'];

const content = `
    <input type="checkbox" id="h1Input">
`;

export class TextH1Component extends TemplateComponent {
  constructor() {
    super(header, defaultTypeFields, [
      {
        id: 'h1InputForm',
        content: content,
      },
    ]);
  }
}
