(function () {
    'use strict';

    angular
        .module('app')
        .factory('tagsSourceService', tagsSourceService);

    tagsSourceService.$inject = ['$http'];

    function tagsSourceService($http) {
        var service = {
            getTagsById: getData,
            tagChange: tagChange
        };

        return service;

        function getData(data) {
            return $http.get("/api/tagsToPaste?id=" + data)
                    .then(function (httpData) {
                return httpData.data;
            });
        }
        function tagChange(addArray, removeArray, id) {
            $http
                .post("/api/updateTagPaste/" + id, addArray)
                .then(function () {
                $http
                    .post("/api/deleteTagConnections/" + id, removeArray)
            });
        }
    }
})();