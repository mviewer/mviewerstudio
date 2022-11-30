
/* Function to switch module with prevBtn and nextBtn */

function switchModule() {
  let nextBtn = document.querySelectorAll("#stepStudioContent .tab-pane:not([style*='display: none']) .btnNext");
  let prevBtn = document.querySelectorAll("#stepStudioContent .tab-pane:not([style*='display: none']) .btnPrev");

  nextBtn.forEach(function(item, index){
    item.addEventListener('click', function(){
      let id = index + 1;
      let tabElement = document.querySelectorAll("#stepStudio li:not([style*='display: none']) a")[id];
      var lastTab = new bootstrap.Tab(tabElement);
      lastTab.show();   
    });
  });  
  prevBtn.forEach(function(item, index){
      item.addEventListener('click', function(){
        let id = index;
        let tabElement = document.querySelectorAll("#stepStudio li:not([style*='display: none']) a")[id];
        var lastTab = new bootstrap.Tab(tabElement);
        lastTab.show();
      });
  });
}

switchModule();

/* Manage display of advanced mode to adanced functions */

const switchMode = document.getElementById('SwitchAdvanced');

switchMode.addEventListener('change', (event) => {
  let elementAdvanced = document.getElementsByClassName('advanced');  
  /* Hide advanced options */
  if (event.currentTarget.checked) {
    for (var i = 0; i < elementAdvanced.length; i++) {
        document.getElementsByClassName('advanced')[i].style.display = "block";
    }  
    // It is necessary to select all the buttons at each change of mode
    switchModule();
  } else {
    for (var i = 0; i < elementAdvanced.length; i++) {
        document.getElementsByClassName('advanced')[i].style.display = "none";
    }
    // It is necessary to select all the buttons at each change of mode
    switchModule();
  }    
})


// Responsive display | 800px > Navbar fixed bottom and display btnPrev btnNext

function displayWizard(x) {
  if (x.matches) { // If media query matches
    document.getElementById("blockWizardMobile").hidden = false;
    document.getElementById("blockWizard").hidden = true;
    let btnWiz = document.querySelectorAll("#stepStudioContent .btnNext,#stepStudioContent .btnPrev");
    btnWiz.forEach(function(item){
      item.classList.add("hideBlock");
    }); 
  } else {
    document.getElementById("blockWizardMobile").hidden = true;
    document.getElementById("blockWizard").hidden = false;
    let btnWiz = document.querySelectorAll("#stepStudioContent .btnNext,#stepStudioContent .btnPrev");
    btnWiz.forEach(function(item){
      item.classList.remove("hideBlock");
    });
  }
}

var x = window.matchMedia("(max-width: 800px)");
displayWizard(x); 
x.addListener(displayWizard);

// Display title name app in Wizard

const inputNameApp = document.getElementById('opt-title');
const log = document.getElementById('nameAppBlock');

inputNameApp.addEventListener('change', function (e) {
    log.textContent = e.target.value;
  }
);