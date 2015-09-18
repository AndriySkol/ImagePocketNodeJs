(function () {
    'use strict';

    angular
        .module('app')
        .config(uiRouterConf);

    uiRouterConf.$inject = ['$stateProvider', '$urlRouterProvider'];
    function uiRouterConf($stateProvider, $urlRouterProvider) {
        $urlRouterProvider.otherwise('/home');
        
        $stateProvider
        .state('home', {
            url: '/home',
            templateUrl : 'views/partial-views/home.partial.html'
        })
        .state('pastes', {
            url: '/pastes',     
            templateUrl: 'views/partial-views/pasteContent.partial.html',
            controller: 'pasteController as vm',
           
        })
        .state('pages', {
            url: '/pages',
            templateUrl: 'views/partial-views/pagesContent.partial.html',
            controller: 'pagesController as vm'
        });
    }
})();