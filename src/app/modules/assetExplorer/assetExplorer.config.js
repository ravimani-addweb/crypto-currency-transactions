function AssetExplorerConfig($stateProvider) {
    'ngInject';

    $stateProvider
        .state('app.assetExplorer', {
            url: '/assetexplorer',
            controller: 'AssetExplorerCtrl',
            controllerAs: '$ctrl',
            templateUrl: 'modules/assetExplorer/assetExplorer.html',
            title: 'Asset Explorer'
        });

};

export default AssetExplorerConfig;