export default class TypeFieldSelector {
  uuid = mv.uuidv4();
  fields = [
    {
      type: "field",
      selected: true,
      label: mviewer.tr("template.typefield.field"),
    },
    {
      type: "multi",
      label: mviewer.tr("template.typefield.multi"),
    },
    {
      type: "static",
      label: mviewer.tr("template.typefield.static"),
    },
    {
      type: "liField",
      label: mviewer.tr("template.typefield.liField"),
    },
  ];
  createOptions = () => {
    const trText = mviewer.tr("template.typefield.select");
    return [
      `<option value="">${trText}</option>`,
      ...this.fields.map((f) => {
        let select = this.defaultField == f.type ? "selected" : "";
        return `<option ${select} value="${f.type}">${f.label}</option>`;
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
