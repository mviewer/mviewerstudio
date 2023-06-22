class ColorSelector {
    uuid = mv.uuidv4();
    color = "#000000";
    label = "Couleur";
    constructor(color = "#000000", label) {
        this.color = color;
        this.label = label;
    }
    render = () => {
        return `
        <div class="row g-3 align-items-center">
            <label class="col-auto" for="head">${this.label}</label>
            <div class="col-2">
                <input class="form-control form-control-sm component-form" type="color" id="${this.uuid }" name=""
                value="${this.color}">
            </div>
        </div>
        `;
    }
    set = ({label, color}) => {
        this.color = color || this.color;
        this.label = label || this.label;
    }
    getValue = () => {
        return document.getElementById(this.uuid).value
    };
}

export default ColorSelector;