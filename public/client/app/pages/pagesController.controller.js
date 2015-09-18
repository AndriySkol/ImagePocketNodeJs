(function () {
    'use strict';

    angular
        .module('app')
        .controller('pagesController', pagesController);

    pagesController.$inject = ['pageSourceService']; 

    function pagesController(pageSource) {
        /* jshint validthis:true */
        var vm = this;
        vm.title = 'pages';
        vm.pages = [];
        vm.tags = null;
        vm.inputTags = null;;
        vm.selectedTags = [];
        vm.pagesFilter = null;
        activate();

        function activate() {
            pageSource.getInitData()
                       .then(function (data) {
                vm.pages = data.pages;
                vm.tags = data.tags;
            });
        }
        function updateTagChange() {
            var args = _.pluck(args, 'id');
            pasteSource
                 .getFilteredPages(args)
                 .then(function (result) {
                vm.pagesFilter = _.pluck(result, 'id');
            });
                        
        }
    }
})();
