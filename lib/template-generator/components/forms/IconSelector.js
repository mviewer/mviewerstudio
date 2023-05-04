class IconSelector {
    uuid = crypto.randomUUID();
    icon = "";
    label = "Icône";
    iconSelectorModal = null;
    modalId = "";
    selected = "";
    constructor(label = "Choisir", modalId, previousModalId) {
        this.label = label;
        this.modalId = modalId;
        this.iconSelectorModal = new iconPickerComponent(modalId, previousModalId);
        document.addEventListener(this.iconSelectorModal.eventName, this.updateForms);
        document.addEventListener("btnIconClicked", () => this.iconSelectorModal.loadModalContent())
        document.addEventListener("btnIconRemove", () => this.remove())
    }
    render = () => {
        return `
        <div class="row g-3 align-items-center">
            <div class="form-group" id="formIconGrp-${this.uuid}">
                <label id="iconInputComponent-${this.uuid }" class="col-auto form-label">
                    <span i18n="tabs.app.help_icon">Icône du bouton</span>
                </label>
                <div class="d-flex col-auto">
                    <input type="text" class="icon-class-input form-control" placeholder="fas fa-lightbulb" id="iconComponent-${this.uuid}">
                    <span class="selected-icon d-none"></span>
                    <button
                        class="btn btn-outline-info picker-button ml-1"
                        type="button"
                        onclick="mv.createDispatchEvent('btnIconClicked', this)"
                        data-bs-target="#${this.modalId}" data-bs-toggle="modal"
                    >
                        <span i18n="select">${this.label}</span>
                    </button>
                    <button
                        class="btn btn-outline-info clearIcon ml-1 d-none"
                        type="button"
                        onclick="mv.createDispatchEvent('btnIconRemove', this)"
                    >
                        <i class="fas fa-times "></i>
                    </button>
                </div>
            </div>
        </div>
        `;
    }
    getValue = () => {
        return this.selected;
    };
    updateForms = ({ detail }) => {
        let formGroup = document.getElementById(`formIconGrp-${ this.uuid }`);
        if (!detail) {
            this.selected = null;
            formGroup.querySelector(".selected-icon").classList.add("d-none");
            formGroup.querySelector(".selected-icon").innerHTML= "";
            formGroup.querySelector(".clearIcon").classList.add("d-none");
            formGroup.querySelector(".icon-class-input").value = "";
            return;
        }
        let value = detail.dataset.class;
        this.selected = value;
        formGroup.querySelector(".selected-icon").innerHTML= `<i class="${value}"></i>`;
        formGroup.querySelector(".selected-icon").classList.remove("d-none");
        formGroup.querySelector(".icon-class-input").value = value;
        formGroup.querySelector(".clearIcon").classList.remove("d-none");
    }

    remove = () => {
        this.updateForms({detail: null})
    }
}

export default IconSelector;