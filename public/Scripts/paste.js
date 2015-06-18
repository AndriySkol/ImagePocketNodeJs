/// <reference path="Paste.js" />

$(document).ready(function () {
    var pasteViewModel = new PasteViewModel();
    $(document).on('focusin', function (e) {
        if ($(e.target).closest(".mce-window").length) {
            e.stopImmediatePropagation();
        }
    });
  
  
  
   
    $("#pasteLink").addClass("active");

  
    
       
   
                  
        

    



});
