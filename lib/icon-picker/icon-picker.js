// To be set to which input needs updating
var iconInput = null;
var selectedIcon = null;
var themeid = null;

const selectIcon = ({ detail }) => {
  let value = detail.dataset.class;
  const iconPreview = document.querySelector(`#${themeid} .selected-icon`);
  iconPreview.className = `selected-icon ${value}`;
  const div = document.querySelector(`#${themeid}`);
  div.dataset.themeIcon = value;
  // const inputTxt = document.querySelector("#mod-themeOptions .icon-class-input");
  // inputTxt.value = value;
};

// Load and display icons modal
const uuid = mv.uuidv4();
const modalId = "iconPicker";
const previousModal = "";
let iconSelectorModal = new iconPickerComponent(modalId, previousModal);
document.addEventListener(iconSelectorModal.eventName, selectIcon);

// Click function to set which input is being used
$(document).on("click", ".picker-button", function (event) {
  const el = event.target;
  const parent = el.closest(".list-group-item");
  themeid = parent.id;

  iconSelectorModal.loadModalContent();
});
