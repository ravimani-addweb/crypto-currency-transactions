function DesclaimerConfig($stateProvider) {
    'ngInject';

    $stateProvider
        .state('app.disclaimer', {
            url: '/disclaimer',
            controller: 'DisclaimerCtrl',
            controllerAs: '$ctrl',
            templateUrl: 'modules/disclaimer/disclaimer.html',
            title: 'Disclaimer'
        });

};

export default DesclaimerConfig;
