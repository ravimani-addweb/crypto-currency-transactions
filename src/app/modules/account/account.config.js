function AccountConfig($stateProvider) {
    'ngInject';

    $stateProvider
        .state('app.account', {
            url: '/account/:slug',
            controller: 'AccountCtrl',
            controllerAs: '$ctrl',
            templateUrl: 'modules/account/account.html',
            title: 'Account'
        });

};

export default AccountConfig;
