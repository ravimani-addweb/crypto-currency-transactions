function RecoverConfig($stateProvider) {
    'ngInject';

    $stateProvider
        .state('app.recover', {
            url: '/recover',
            controller: 'RecoverCtrl',
            controllerAs: '$ctrl',
            templateUrl: 'modules/recover/recover.html',
            title: 'Recover'
        });

};

export default RecoverConfig;
