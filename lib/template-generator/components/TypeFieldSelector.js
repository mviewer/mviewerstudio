export default class TypeFieldSelector {
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

  createSelector = () => {
    const options = this.createOptions();
    if (options.length) {
      return `<select class="form-control form-control-sm type-field-selector">
                ${this.createOptions().join()}
            </select>`;
    }
  };
  constructor(fieldsToUse = ['field', 'multi', 'static']) {
    this.fields = this.fields.filter((f) => fieldsToUse.includes(f.type));
  }
}
