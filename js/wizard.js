
/* Function to switch module with prevBtn and nextBtn */
function switchModule () {
  ["btnNext", "btnPrev"].forEach(buttonClassName => {
    // get buttons by class
    let btnEl = document.querySelectorAll(`#stepStudioContent .tab-pane:not([style*='display: none']) .${ buttonClassName }`);
    // for each buttons, add listener
    btnEl.forEach(function (item, index) {
      item.addEventListener('click', function () {
        let id = buttonClassName === "btnPrev" ? index : index + 1;
        let tabElement = document.querySelectorAll("#stepStudio li:not([style*='display: none']) a")[id];
        var lastTab = new bootstrap.Tab(tabElement);
        lastTab.show();
      });
    })
  })
};
switchModule();

/* Manage display of advanced mode to adanced functions */
const switchMode = document.getElementById('SwitchAdvanced');
switchMode.addEventListener('change', (event) => {
  const elementAdvanced = document.getElementsByClassName('advanced');  
  /* Hide advanced options */
  const isDisplay = event.currentTarget.checked ? "block" : "none";
  for (var i = 0; i < elementAdvanced.length; i++) {    
    document.getElementsByClassName('advanced')[i].style.display = isDisplay;
  }
  // It is necessary to select all the buttons at each change of mode
  switchModule();
})

// Responsive display | 800px > Navbar fixed bottom and display btnPrev btnNext
function displayWizard(x) {
  const displayMobile = x.matches ? true : false;
  document.getElementById("blockWizardMobile").hidden = !displayMobile;
  document.getElementById("blockWizard").hidden = displayMobile;
  let btnWiz = document.querySelectorAll("#stepStudioContent .btnNext,#stepStudioContent .btnPrev");
  btnWiz.forEach(function(item){
    displayMobile ? item.classList.add("hideBlock") : item.classList.remove("hideBlock")
  });
}

var mediaQuery = window.matchMedia("(max-width: 800px)");
window.addEventListener('resize', () => displayWizard(mediaQuery)); 
displayWizard(mediaQuery);

// Display title name app in Wizard
const inputNameApp = document.getElementById('opt-title');
const log = document.getElementById('nameAppBlock');

inputNameApp.addEventListener('change', function (e) {
    log.textContent = e.target.value;
  }
);