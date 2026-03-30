export default class InputFieldValueComponent {
  uuid = mv.uuidv4();
  divId = "";
  fields = [];
  defaultValue = "";
  constructor(divId, fields, defaultValue) {
    this.divId = divId;
    this.fields = fields;
    this.defaultValue = defaultValue;
  }
  asTemplateSyntax = (field) => {
    return `{{#${field}}}{{${field}}}{{/${field}}}`;
  };
  createOptions = () => {
    return this.fields.map((field) => {
      let selected = field == this.defaultValue ? "selected" : "";
      return `<option ${selected} field="${field}" value="${field}">${field}</option>`;
    });
  };
  render = () => `<select class="form-control form-control-sm component-form" id="${
    this.uuid
  }">
            ${this.createOptions().join("")}
        </select>`;
  getValue = () => {
    let field = document.getElementById(this.uuid).value;
    return {
      value: field,
      template: `{{#${field}}}{{${field}}}{{/${field}}}`,
    };
  };
  getAttribute = (name) => {
    return document
      .getElementById(this.uuid)
      .querySelector(`option[value='${this.getValue()}']`)
      .getAttribute(name);
  };
}
