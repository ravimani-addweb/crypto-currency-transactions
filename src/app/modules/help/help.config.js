function HelpConfig($stateProvider) {
    'ngInject';

    $stateProvider
        .state('app.needhelp', {
            url: '/needhelp',
            controller: 'HelpCtrl',
            controllerAs: '$ctrl',
            templateUrl: 'modules/help/help.html',
            title: 'Help'
        });

};

export default HelpConfig;
