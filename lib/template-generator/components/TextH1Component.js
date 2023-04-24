class TextH1Component extends TemplateComponent {
    static content = `
        <select class="form-control form-control-sm">
            <option>Saisie libre</option>
        </select>
    `;

    static header = {
        icon: "bi bi-type-h1",
        title: "Titre"
    };

    static forms = [{
        class: "",
        id: "",
        content: ""
    }];

    static customSelectors = [];

    constructor() {
        super(
            header = this.header,
            forms = this.forms,
            customSelectors = this.customSelectors
        )
    }
}