class InputTextComponent {
  uuid = mv.uuidv4();
  text = "";
  label = "";
  placeholder = "Saisir une valeur...";
  constructor(text = "Accéder", label = "Description", placeholder = "") {
    this.text = text;
    this.label = label;
    this.placeholder = placeholder || mviewer.tr("template.input.text");
  }
  render = () => {
    return `
        <div class="row g-3 align-items-center">
            <label class="col-auto" for="head">${this.label}</label>
            <div class="col-4">
                <input placeholder="${this.placeholder}" class="form-control form-control-sm component-form" type="text" id="${this.uuid}" name=""
                value="${this.text}">
            </div>
        </div>
        `;
  };
  getValue = () => {
    return document.getElementById(this.uuid).value;
  };
}

export default InputTextComponent;
