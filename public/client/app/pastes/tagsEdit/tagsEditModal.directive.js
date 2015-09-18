(function() {
    'use strict';

    angular
        .module('app')
        .directive('tagsEditModal', tagsEditModal);

    tagsEditModal.$inject = ['tagsSourceService'];
    
    function tagsEditModal (tagsSourceService) {
        
        var directive = {
            link: link,
            restrict: 'EA',
            templateUrl: "client/app/pastes/tagsEdit/tagsEditModal.html",
            scope : {
                api: "=",
                tags: "="
            }
        };
        return directive;

        function link(scope, element, attrs) {
            scope.api = { invoke: invoke };
            scope.paste = null;
            scope.pasteTags = null;
            scope.tags = null;
            scope.inputField = null;
            scope.addNewTag = addNewTag;
            scope.submit = submit;
            function addNewTag() {
                if (scope.inputField && scope.inputField.id) {
                    if (isValidName(scope.inputField.name)) {
                        var addItem = _.clone(scope.inputField);
                        addItem.isValid = true;
                        scope.pasteTags.push(addItem);
                    }
                }

                else {
                    if (isValidName(scope.inputField)) {
                        scope.pasteTags.push({ name: scope.inputField, isNew: true, isValid: true });
                    }
                }
            }
            function isValidName(name) {
                if (!name) {
                    return false;
                }
                
                var nameTrimmed = name.trim();
                if (nameTrimmed == "") {
                    return false;
                }
                
                return !_.any(scope.pasteTags, function (item) {
                    return item.name == nameTrimmed;
                });
            }
            function invoke(paste) {
                scope.inputField = "";
                scope.pasteTags = null;
                scope.paste = paste;
                tagsSourceService
                    .getTagsById(paste.id)
                    .then(function (result) {
                            scope.pasteTags = result;
                            scope.pasteTags.forEach(function (item) {
                                item.isValid = true;

                            });
                    })
                    .then(function () {
                        $(element).children('.modal').modal();
                    })
  
            }
            function submit() {
                var resultAdd = _.filter(scope.pasteTags, addCompareFn);
                var resultRemove = _.pluck(_.filter(scope.pasteTags, removeCompareFn), 'id');
                tagsSourceService.tagChange(resultAdd, resultRemove, scope.paste.id);

                function addCompareFn(item) {
                    return item.isValid;
                }
                function removeCompareFn(item) {
                    return !item.isValid && !item.isNew;
                }
                
            }
        }
    }

})();