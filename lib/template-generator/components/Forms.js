export default class Forms {
  forms = [];
  constructor(forms) {
    this.forms = forms;
  }
  add = (newForms) => {
    this.forms = [...this.forms, ...newForms];
  };
  formToHtml = (props) => `
    <div class="form-group ${props?.class}" id="${props?.id}">
      ${props.content}
    </div>`;
  getForms = () => this.forms.map((form) => this.formToHtml(form));
}
