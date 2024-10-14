// To be set to which input needs updating
var iconInput = null;
var selectedIcon = null;

const selectIcon = ({ detail }) => {
  let value = detail.dataset.class
  const iconPreview = document.querySelector("#mod-themeOptions .selected-icon");
iconPreview.className = `selected-icon ${value}`;
const inputTxt = document.querySelector("#mod-themeOptions .icon-class-input");
inputTxt.value = value;
  
};

// Load and display icons modal
const uuid = mv.uuidv4();
const modalId = "iconPicker"
const previousModal = "mod-themeOptions"
let iconSelectorModal = new iconPickerComponent(modalId, previousModal);
document.addEventListener(iconSelectorModal.eventName, selectIcon);

// Click function to set which input is being used
$(".picker-button").click(function () {
  iconSelectorModal.loadModalContent();
});