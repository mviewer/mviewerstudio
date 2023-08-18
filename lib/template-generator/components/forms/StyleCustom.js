class StyleCustom {
  uuid = mv.uuidv4();
  style = "";
  label = "Style";
  constructor(style = "", label = "Style") {
    this.style = style;
    this.label = label;
  }
  render = () => {
    return `
        <div class="row g-3 align-items-center">
            <label class="col-auto" for="head">${this.label}</label>
            <div class="col-8">
                <input value="height:500px; width:100%" placeholder="heigth:500px; width:100%" class="form-control form-control-sm component-form" type="text" id="${this.uuid}" name=""
                value="${this.style}">
            </div>
        </div>
        `;
  };
  set = ({ label, style }) => {
    this.style = style || this.style;
    this.label = label || this.label;
  };
  getValue = () => {
    return document.getElementById(this.uuid).value;
  };
}

export default StyleCustom;
