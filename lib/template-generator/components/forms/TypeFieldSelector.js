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
      label: 'Valeur fixe',
    },
  ];
  createOptions = () =>
    this.fields.map(
      (f) =>
        `<option value="${f.type}" ${f?.selected ? 'selected="selected"' : ''}>${
          f.label
        }</option>`
    );

  getContent = () => {
    const options = this.createOptions();
    if (options.length) {
      return `<select class="form-control form-control-sm type-field-selector component-form" id="${this.uuid}">
                ${this.createOptions().join()}
            </select>`;
    }
  };
  constructor(fieldsToUse = ['field', 'multi', 'static']) {
    this.fields = this.fields.filter((f) => fieldsToUse.includes(f.type));
  }
}
