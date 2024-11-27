class TextArea {
    uuid = mv.uuidv4();
    value = "";
    label = "Saisir un contenu";
    constructor(value = "", label) {
      this.value = value;
      this.label = label;
    }
    render = () => {
      return `
          <div class="row g-3 align-items-center">
              <label class="col-auto" for="head">${mviewer.tr(this.label)}</label>
              <div class="col-12">
                  <textarea
                    class="form-control form-control-sm component-form"
                    row="5"
                    style="height:100px"
                    id="${this.uuid}"
                    name=""
                    value="${this.value}">
                  </textarea>
              </div>
          </div>
          `;
    };
    set = ({ label, value }) => {
      this.value = value || this.value;
      this.label = label || this.label;
    };
    getValue = () => {
      return document.getElementById(this.uuid).value;
    };
  }
  
  export default TextArea;
  