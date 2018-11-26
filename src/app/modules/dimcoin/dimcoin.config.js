function DimcoinConfig($stateProvider) {
    'ngInject';

    $stateProvider
        .state('app.dimcoin', {
            url: '/dimcoin',
            controller: 'DimcoinCtrl',
            controllerAs: '$ctrl',
            templateUrl: 'modules/dimcoin/dimcoin.html',
            title: 'DIM Coin Packs'
        });

};

export default DimcoinConfig;