class TextH1Component extends TemplateComponent {
    static content = `
        <select class="form-control form-control-sm">
            <option>Saisie libre</option>
        </select>
    `;

    constructor() {
        super(
            header = { icon: "bi bi-type-h1", title: "Titre" },
            forms = [{ class: "", id: "", content: "" }],
            customSelectors = []
        )
    }
}