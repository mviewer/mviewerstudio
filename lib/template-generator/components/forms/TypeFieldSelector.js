export default class TypeFieldSelector {
  uuid = mv.uuidv4();
  fields = [
    {
      type: "field",
      selected: true,
      label: "template.typefield.field"
    },
    {
      type: "multi",
      label: "template.typefield.multi"
    },
    {
      type: "static",
      label: "template.typefield.static"
    },
    {
      type: "liField",
      label: "template.typefield.liField"
    },
  ];
  createOptions = () => {
    const trText = mviewer.tr("template.typefield.select");
    return [
      `<option value="" i18n=${trText}>${trText}</option>`,
      ...this.fields.map((f) => {
        let select = this.defaultField == f.type ? "selected" : "";
        return `<option ${select} value="${f.type}" i18n="${f.label}">${mviewer.tr(f.label)}</option>`;
      }),
    ]
  };

  render = () => {
    const options = this.createOptions();
    if (options.length) {
      return `<select class="form-control form-control-sm type-field-selector component-form" id="${
        this.uuid
      }">
        ${this.createOptions().join()}
      </select>`;
    }
  };
  constructor({ fields = ["field", "multi", "static", "liField"], defaultType }) {
    this.fields = this.fields.filter((f) => fields.includes(f.type));
    this.defaultField = defaultType;
  }
}
