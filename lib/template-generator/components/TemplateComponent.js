class TemplateComponent {
  constructor(
    header = {icon: "", title: ""},
    forms = [{class: "", id: "", content: ""}],
    customSelectors = []
  ) {
    this.forms = forms;
    this.header = header;
    this.customSelectors = customSelectors;
    this.uuid = crypto.randomUUID().split("-").join("");
  }

  static typeFieldSelector = `<select class="form-control form-control-sm type-field-selector">
        <option value="field" selected="selected">A partir d'un champ</option>
        <option value="multi">A partir de plusieurs champs</option>
        <option value="field">A partir d'un champ</option>
        <option value="static">Valeur fixe</option>
    </select>`;

  static header = ({icon, title}) => ` <div class="titleCompBlock mb-3">
        <div class="titleComp"><i class="${icon}"></i>${title}</div>
        <span class="deleteComp"><i class="bi bi-x-circle"></i></span>
    </div>`;

  static addForms(forms) {
    this.forms = [
      ...this.forms,
      ...forms.map(
        (form) => `
            <div class="form-group ${form?.class}" id="${form?.id}">
                ${form.content}
            </div>
        `
      ),
    ];
  }

    static addSelectors = (customSelectors) => this.customSelectors = [...this.customSelectors, ...customSelectors];

  static content = () => `
    <div class="card cardComponent titleComponent" id=${this.uuid}>
        ${this.header}
        ${this.typeFieldSelector()}
        ${this.forms.join("")}
        ${this.customSelectors.join("")}
    </div> `;

  add = (target, position = "beforeend") => target.insertAdjacentHTML(position, this.content());
  remove = () => document.querySelector(this.uuid).remove();
}
