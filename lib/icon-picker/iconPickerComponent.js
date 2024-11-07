class iconPickerComponent {
  visible = false;
  uuid = mv.uuidv4();
  eventName = this.uuid.substring(0, 8);
  iconsMetadata = {};
  contentDiv = null;
  modalId = null;
  selected = "";
  inputListener = false;
  constructor(modalId, previousModal, metaFile) {
    this.modalId = modalId;
    this.contentDiv = document.getElementById(modalId).querySelector(".modal-content");
    fetch(metaFile || "lib/Font-Awesome/icons.json")
      .then((r) => r.json())
      .then((allIcons) => (this.iconsMetadata = allIcons));
    document.addEventListener("filterIcons", this.onFilter);
    this.previousModal = previousModal;
  }

  content = (v) => {
    let iconsSet = Object.keys(this.iconsMetadata);
    if (v) {
      iconsSet = iconsSet.filter((name) =>
        name.toLocaleLowerCase().includes(v.toLocaleLowerCase())
      );
    }
    let iconItems = iconsSet.map((name, index) => {
      let icon = this.iconsMetadata[name];
      return {
        item: `fa${icon.free[0][0]} fa-${name}`,
        index: index,
      };
    });
    iconItems = { icons: iconItems };
    return Mustache.render(
      `<ul class="icon-picker-list">
				{{#icons}}
				<li>
					<a
						href="" data-class="{{item}} {{activeState}}"
						data-index="{{index}}"
						onclick="mv.createDispatchEvent('${this.eventName}', this)"
						${
              this.previousModal
                ? `data-bs-target="#${this.previousModal}" data-bs-toggle="modal"`
                : `data-bs-dismiss="modal"`
            }
						>
						<span class="{{item}}"></span>
						<span class="name-class">{{item}}</span>
					</a>
				</li>
				{{/icons}}
			</ul>`,
      iconItems
    );
  };

  searchField = () => {
    return `
			<input placeholder="Rechercher une icône..." class="form-control searchIconName mb-2" type="text" onkeyup="mv.createDispatchEvent('filterIcons', this)">
		`;
  };

  refreshIcons = (v) => {
    let iconPreviewArea = this.contentDiv.querySelector(".iconPreviewArea");
    iconPreviewArea.innerHTML = "";
    iconPreviewArea.insertAdjacentHTML("beforeend", this.content(v));
  };

  closeModal = () => {
    if (!this.previousModal) {
      this.modalId.modal("hide");
      this.visible = false;
    }
  };

  showModal = () => {
    if (!this.previousModal) {
      this.modalId.modal("show");
      this.visible = true;
    }
  };

  loadModalContent = (v) => {
    this.contentDiv.innerHTML = "";
    this.contentDiv.innerHTML = `
			<div class="modal-header">
				<h5 class="modal-title" i18n="modal.exit.title">Icônes</h5>
				${
          this.previousModal
            ? `<button type="button" class="close" data-bs-target="#${this.previousModal}" data-bs-toggle="modal">
                <span aria-hidden="true">&times;</span>
              </button>`
            : `<button type="button" class="close" data-bs-dismiss="modal"><span aria-hidden="true">&times;</span></button>`
        }
			</div>
			<div class="modal-body">
				${this.searchField(v)}
				<div class="iconPreviewArea">
				${this.content(v)}
				</div>
			</div>
			<div class="modal-footer">
				${
          this.previousModal
            ? `<button type="button" class="btn btn-primary cancel" data-bs-target="#${this.previousModal}" data-bs-toggle="modal">Annuler</button>`
            : `<button type="button" class="btn btn-primary cancel" data-bs-dismiss="modal">Annuler</button>`
        }
			</div>`;
  };

  getInputs = () => {
    return `
		<div class="form-group" id="icon-selector-${this.uuid}">
			<label class="settinglabel" i18n="modal.theme.paramspanel.icon">Icône</label>
			<span class="selected-icon"></span>
			<input type="text" class="icon-class-input form-control advanced"  style="display: none;" id="theme-pick-icon-${this.uuid}" />
			<button class="btn btn-outline-info picker-button" type="button" data-bs-target="#${this.modalId}" data-bs-toggle="modal">
				<span i18n="modal.theme.paramspanel.icon_pick">Choisir</span>
			</button>
		</div>`;
  };

  onSelect = (x) => {
    this.selected = x.detail.querySelector(".name-class").innerHTML;
  };

  onFilter = (x) => {
    this.refreshIcons(x.detail?.value);
  };
}
