function TransferTransactionConfig($stateProvider) {
    'ngInject';

    $stateProvider
        .state('app.transferTransaction', {
            url: '/transfer-transactions/:opt/:asset/:astid/:slug',
            controller: 'TransferTransactionCtrl',
            controllerAs: '$ctrl',
            templateUrl: 'modules/transferTransaction/transferTransaction.html',
            title: 'Send & Receive',
            params: {
            	address: ''
            }
        });

};

export default TransferTransactionConfig;
