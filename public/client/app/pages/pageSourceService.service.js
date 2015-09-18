(function () {
    'use strict';

    angular
        .module('app')
        .factory('pageSourceService', pageSourceService);

    pageSourceService.$inject = ['$http'];

    function pageSourceService($http) {
        return {
            getInitData: getInitData,
            getFilteredPages: getFilteredPages
        }

        function getInitData() {
            return $http.get("/apiPages/init")
                        .then(simplify);
        }
        function getFilteredPages(filters) {
            return $.get("/apiPages/filters", { 'filters': filters })
                     .then(simplify);
        }
        function simplify(httpData) {
            return httpData.data;
        }
    }
})();