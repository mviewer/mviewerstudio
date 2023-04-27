import TemplateComponent from './TemplateComponent.js';

const header = {
  icon: 'bi bi-text-left',
  title: 'Text',
};

const defaultTypeFields = ['field', 'multi', 'static'];

export class TextComponent extends TemplateComponent {
  constructor() {
    super(header, defaultTypeFields, [
      {
        id: 'h3InputForm'
      },
    ]);
  }
}
