(function () {
    'use strict';

    angular
        .module('app')
        .controller('pasteController', paste);

    paste.$inject = ['$scope', 'pasteSource']; 

    function paste($scope, pasteSource) {
        /* jshint validthis:true */
        var vm = this;
        vm.title = 'paste';
        vm.pastes = [];
        vm.tags = null;
        vm.inputTags = null;;
        vm.selectedTags = [[]];
        vm.pastesFilter = null;
        vm.tagsEditApi = null;
        vm.pasteEditApi = null;
        vm.filterIds = [0];
        vm.addFilter = addFilter;
        vm.showPaste = showPaste;
        vm.updateTagChange = updateTagChange;
        vm.changePasteTags = changePasteTags;
        vm.deletePaste = deletePaste;
        vm.updatePaste = updatePaste;
        activate();
        function changePasteTags(paste) {
            vm.tagsEditApi.invoke(paste);
        }
        function updatePaste(paste) {
            vm.pasteEditApi.invoke(paste);
        }
        function addFilter() {
            vm.filterIds.push(vm.filterIds.length);
            vm.selectedTags.push([]);
            vm.inputTags.push(_.map(vm.tags, _.clone));
        }
        function showPaste(paste) {
            if (!paste.content) {
                paste.content = 'Loading';
                pasteSource
                    .getPasteContent(paste.id)
                    .then(function (result) {
                    paste.content = result;
                    $(".innerDivs").contents().css("position", "relative");
                });

            }
        }
        function activate() {
          
            pasteSource.getInitData()
                       .then(function (data) {
                vm.pastes = data.pastes;
                vm.tags = data.tags;
                vm.inputTags = createInputTags();
            });

        }
        function updateTagChange() {
            var args = _.map(vm.selectedTags, _.partial(_.pluck, _, 'id'));
            pasteSource
                 .getFilteredPastesId(args)
                 .then(function (result) {
                vm.pastesFilter = _.pluck(result, 'id');
            });
                        
        }
        function createInputTags() {
            var res = [];
            res.push(_.map(vm.tags, _.clone));
            return res;
        }
        function deletePaste(paste) {
            bootbox.confirm("Do you realy want to delete the record", function (result) {
                if (result) {
                    pasteSource
                         .deletePaste(paste)
                         .then(function () {
                        deletePasteObj(paste);
                    });
                }
            });
        }

        function deletePasteObj(paste) {
            var index = vm.pastes.indexOf(paste);
            vm.pastes.splice(index, 1);
        }
        
        
    }
})();
