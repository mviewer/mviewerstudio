import { header as textHeader } from "./components/library/TextComponent.js";
import { header as h1Header } from "./components/library/TextH1Component.js";
import { header as h3Header } from "./components/library/TextH3Component.js";
import { header as iframeHeader } from "./components/library/IframeComponent.js";
import { header as imageHeader } from "./components/library/ImageComponent.js";
import { header as buttonHeader } from "./components/library/ButtonComponent.js";
import { header as numberHeader } from "./components/library/NumbersComponent.js";
import { header as listHeader } from "./components/library/ListComponent.js";

const headers = [
  h1Header(),
  h3Header(),
  iframeHeader(),
  imageHeader(),
  buttonHeader(),
  numberHeader(),
  listHeader(),
  textHeader(),
];

/**
 * This class will list all components
 * to display one card by components availables.
 * From this display, the user will click on a card to select and add one of them.
 */
export default class ComponentsSelector {
  constructor(components = [], targetContentId = "") {
    this.components = components;
    this.targetContentId = targetContentId;
    this.selected = null;
  }

  onValid = () => {
    let componentSelected = this.selected.click();
    mv.templateGenerator.addToSelection({
      detail: { component: componentSelected, header: this.selected },
    });
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
                      ${headers.map((header) => this.componentToHtml(header)).join("")}
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
    const btnClass = document.querySelector("#templateSelectorAddBtn").classList;
    if (visible) {
      btnClass.remove("d-none");
    } else {
      btnClass.add("d-none");
    }
  };

  click(cardElement) {
    const clickedHeader = headers.filter((h) => h.id == cardElement.id)[0];
    const selectedId = this.selected?.id;
    if (selectedId) {
      this.removeSelected();
    }
    if (clickedHeader.id != selectedId) {
      this.selected = clickedHeader;
      cardElement.classList.add("selected");
    }
    this.setValidBtnState(this.selected);
  }

  removeSelected() {
    if (!this.selected) return;
    document.getElementById(this.selected?.id).classList.remove("selected");
    this.selected = null;
  }

  load() {
    const target = document.querySelector(`#${this.targetContentId}`);
    target.innerHTML = "";
    target.insertAdjacentHTML("beforeend", this.content());
  }

  getHeaders = () => headers;

  selectComponentsFromHtml = (html) => {
    return headers.filter((h) => html.getElementsByClassName(h.class).length);
  };
}
