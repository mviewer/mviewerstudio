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

// Manage display of options
const activeSearch = document.getElementById('SwitchAdressSearch');
activeSearch.addEventListener('change', (event) => {
  const isDisplay = event.currentTarget.checked ? "block" : "none";
  document.getElementById('AppSearchBlock').style.display = isDisplay;      
})

// Manage display nav-tab for LayerOptions modal 
$('#mod-layerOptions').on('hidden.bs.modal', function() { 
  // reset multi-tab modal to initial state 
  $(this).find('.nav-item a:first').tab('show');   
});

// Display opacity value 
$("#frm-opacity").on("mousemove", function() {
   $('#opacity-value').text($("#frm-opacity").val());
});
