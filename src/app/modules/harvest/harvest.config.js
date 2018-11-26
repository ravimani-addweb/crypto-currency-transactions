function HarvestConfig($stateProvider) {
    'ngInject';

    $stateProvider
        .state('app.harvest', {
            url: '/harvest',
            controller: 'HarvestCtrl',
            controllerAs: '$ctrl',
            templateUrl: 'modules/harvest/harvest.html',
            title: 'Harvest'
        });

};

export default HarvestConfig;