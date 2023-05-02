class InputTextComponent {
    uuid = crypto.randomUUID();
    text = "";
    label = ""
    constructor(text = "Accéder", label = "Description") {
        this.text = text;
        this.label = label;
    }
    render = () => {
        return `
        <div class="row g-3 align-items-center">
            <label class="col-auto" for="head">${this.label}</label>
            <div class="col-4">
                <input class="form-control form-control-sm component-form" type="text" id="${this.uuid }" name=""
                value="${this.text}">
            </div>
        </div>
        `;
    }
    getValue = () => {
        return document.getElementById(this.uuid).value || "Cliquer"
    };
}

export default InputTextComponent;