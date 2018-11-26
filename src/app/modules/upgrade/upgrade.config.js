function UpgradeConfig($stateProvider) {
    'ngInject';

    $stateProvider
        .state('app.accountUpgrade', {
            url: '/account-upgrade',
            controller: 'UpgradeCtrl',
            controllerAs: '$ctrl',
            templateUrl: 'modules/upgrade/upgrade.html',
            title: 'Upgrade Account'
        });

};

export default UpgradeConfig;
