export default class TypeFieldSelector {
  uuid = crypto.randomUUID();
  fields = [
    {
      type: 'field',
      selected: true,
      label: "A partir d'un champ",
    },
    {
      type: 'multi',
      label: 'A partir de plusieurs champs',
    },
    {
      type: 'static',
      label: 'Saisie libre',
    },
    {
      type: 'liField',
      label: "A partir d'un champ",
    },
  ];
  createOptions = () =>
    ['<option value="">Choisir un type...</option>',...this.fields.map(
      (f) =>`<option value="${ f.type }">${f.label}</option>`
    )];

  render = () => {
    const options = this.createOptions();
    if (options.length) {
      return `<select class="form-control form-control-sm type-field-selector component-form" id="${this.uuid}">
                ${this.createOptions().join()}
            </select>`;
    }
  };
  constructor(fieldsToUse = ['field', 'multi', 'static', 'liField']) {
    this.fields = this.fields.filter((f) => fieldsToUse.includes(f.type));
  }
}
