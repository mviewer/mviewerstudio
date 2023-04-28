/**
 * This class will list all components
 * to display one card by components availables.
 * From this display, the user will click on a card to select and add one of them.
 */
export default class ComponentsSelector {
    constructor(components = [], targetContentId = '', validSelection) {
      this.components = components;
      this.targetContentId = targetContentId;
      console.log(targetContentId);
      this.selected = [];
    }
  
    onValid = () => {
      const addComponent = new CustomEvent('addTemplateComponent', {
        detail: this.selected,
      });
      document.dispatchEvent(addComponent);
      this.setValidBtnState(false);
    };
  
    content() {
      return `
          <div class="row">
              <div class="col-md-12 mb-2 d-flex justify-content-between align-items-center">
                  <h6 class="m-0">Quel composant souhaitez-vous ajouter ?</h6>
              </div>
          </div>
          <div class="row">
              <div class="col-md-12 mb-2 d-flex justify-content-between align-items-center">
                  <div class="lib-blockComp">
                      ${this.components
                        .map((component) => this.componentToHtml(component.header))
                        .join('')}
                  </div>
              </div>
          </div>`;
    }
  
    componentToHtml({ title, icon, id }) {
      return `<div class="card blockComp zoomCard" id="${id}" onclick="mv.templateGenerator.componentSelector.click(this)">
              <i class="${icon}"></i>
              <span class="titleComp">${title}</span>
          </div>`;
    }
  
    setValidBtnState = (visible) => {
      const btnClass = document.querySelector('#templateSelectorAddBtn').classList;
      if (visible) {
        btnClass.remove('d-none');
      } else {
        btnClass.add('d-none');
      }
    };
  
    click(cardElement) {
      if (this.selected.includes(cardElement.id)) {
        this.selected = this.selected.filter((i) => i !== cardElement.id);
        cardElement.classList.remove('selected');
      } else {
        this.selected.push(cardElement.id);
        cardElement.classList.add('selected');
      }
      this.setValidBtnState(this.selected.length);
    }
  
    removeSelected(id) {
      this.selected = this.selected.filter((i) => i !== id);
    }
  
    load() {
      const target = document.querySelector(`#${this.targetContentId}`);
      target.innerHTML = '';
      target.insertAdjacentHTML('beforeend', this.content());
    }
  }
  