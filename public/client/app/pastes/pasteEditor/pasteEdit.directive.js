(function() {
    'use strict';

    angular
        .module('app')
        .directive('pasteEdit', eventEdit);

    eventEdit.$inject = ['pasteSource'];
    
    function eventEdit (pasteSource) {
        // Usage:
        //     <eventEdit></eventEdit>
        // Creates:
        // 
        var directive = {
            link: link,
            restrict: 'EA',
            scope: {
                api: "="

            },
            templateUrl: "client/app/pastes/pasteEditor/pasteEditModal.html"
        };
        return directive;

        function link(scope, element, attrs) {
            scope.api = { invoke: invoke };
            scope.currPaste = null;
            scope.submit = submit;

            function invoke(paste) {
                scope.currPaste = paste;
                tinymce.init({
                    selector: "#myModalEditBody",
                    plugins: [
                        "advlist autolink lists link image charmap print preview anchor",
                        "searchreplace visualblocks code fullscreen",
                        "insertdatetime media table contextmenu paste"
                    ],
                    paste_webkit_styles: "all",
                    paste_data_images: true,
                    paste_retain_style_properties: "all",
                    toolbar: "insertfile undo redo | styleselect | bold italic | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image"
                });
                
                tinymce.activeEditor.setContent(paste.data, { format: 'raw' });
                $(element).children('.modal').modal("show");
                $("myModalEditBody").removeClass("modal-body");
            }
            function submit() {
                scope.currPaste.data = tinymce.activeEditor.getContent({ format: 'raw' });
                tinymce.activeEditor.remove();
                $(element).modal("hide");
                pasteSource.updatePaste(scope.currPaste);
            
            }
        }
        
    }

})();