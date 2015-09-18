(function () {
    'use strict';

    angular
        .module('app')
        .filter('InArray', InArray);
    
    InArray.$inject = ['$filter'];
    function InArray($filter) {
        return InArrayFilter;
        function InArrayFilter(list, arrayFilter, element) {
            if (arrayFilter) {
                return $filter("filter")(list, function (listItem) {
                    return arrayFilter.indexOf(listItem[element]) != -1;
                });
            }
            else {
                return list;
            }
        }        
    }
})();