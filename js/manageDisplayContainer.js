/* Manage display of module */
function showStudio() {
  document.getElementById("containerHome").hidden = true;
  document.getElementById("containerStudio").hidden = false;
  map.updateSize();
}

function goHome() {
  if ($("#containerStudio").is(':visible')) {
    $('#mod-closeStudio').modal('show');
  }
}

function showHome() {  
document.getElementById("containerStudio").hidden = true;
$('#mod-closeStudio').modal('hide');
document.getElementById("containerHome").hidden = false;
}

function saveStudio() {
if($("#opt-title").val() == ''){
  alert(mviewer.tr('msg.give_title_before_save'));
  $('#mod-closeStudio').modal('hide');
  $('#opt-title').addClass('is-invalid');
} else{
  saveApplicationParameters(0); 
  showHome();
  alertCustom('Application enregistrée avec succès !', 'info');
}  
}

// Manage display of options
$('#opt-title').change(function() {
if($("#opt-title").hasClass( "is-invalid")){
  $("#opt-title").removeClass( "is-invalid")
}
});

// Force update map size 
$( "#navWizApp" ).click(function() {
map.updateSize();
});

// Manage display of options with btn switch
function displaySwitch(switchId,blockDisplayId) {
const btnSwitch = document.getElementById(switchId);
btnSwitch.addEventListener('change', (event) => {
  const isDisplay = event.currentTarget.checked ? "block" : "none";
  document.getElementById(blockDisplayId).style.display = isDisplay;      
})
}

// Switch list to manage display block
displaySwitch('SwitchAdressSearch','AppSearchBlock');
displaySwitch('SwitchCustomBackground','appCustomBackgroundBlock');


//

// Manage display nav-tab for LayerOptions modal 
$('#mod-layerOptions').on('hidden.bs.modal', function() { 
// reset multi-tab modal to initial state 
$(this).find('.nav-item a:first').tab('show');   
});

// Display opacity value 
$("#frm-opacity").on("mousemove", function() {
 $('#opacity-value').text($("#frm-opacity").val());
});


// Create a custom alert template 

function alertCustom(message, type, timeout = 5000){
  const alertPlaceholder = document.getElementById('liveAlertPlaceholder');
  // Définition de l'icône selon le type d'alerte
  let iconalert = '';
  if (type == 'sucess' || type == 'info'){
    iconalert = '<i class="ri-checkbox-circle-line"></i>';
  } else if(type == 'danger' || type == 'warning'){
    iconalert = '<i class="ri-alert-line"></i>';    
  } else {
    iconalert = '<i class="ri-information-line"></i>';
  }
  //ID unique pour l'alerte 
  let generateid = () => {
    return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
  }
  let idalert = generateid();
  const wrapper = document.createElement('div');
  wrapper.setAttribute("id", idalert);  
  wrapper.innerHTML = [
    `<div class="alert alert-${type} fade show" role="alert">
       <div>${iconalert} ${message}</div>
       <a type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"><i class="ri-close-line"></i></a>
    </div>`
  ].join('');

  alertPlaceholder.append(wrapper);

  // Options to timeout
  if(timeout){
    const myalert = document.getElementById(idalert);
    setTimeout(function(){ 
      myalert.innerHTML = '';
    }, timeout);
  }    
}

