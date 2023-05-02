class ColorSelector {
    uuid = crypto.randomUUID();
    defaultColor = "#000000";
    defaultLabel = "Couleur";
    constructor(defaultColor, label) {
        this.defaultColor = defaultColor;
        this.defaultLabel = label;
    }
    render = () => {
        return `
        <div class="row g-3 align-items-center">
            <label class="col-auto" for="head">${this.defaultLabel}</label>
            <div class="col-2">
                <input class="form-control form-control-sm component-form" type="color" id="${this.uuid }" name=""
                value="${this.defaultColor}">
            </div>
        </div>
        `;
    }
    getValue = () => {
        return document.getElementById(this.uuid).value
    };
}

export default ColorSelector;