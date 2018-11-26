function NodeConfig($stateProvider) {
    'ngInject';

    $stateProvider
        .state('app.node', {
            url: '/node',
            controller: 'NodeCtrl',
            controllerAs: '$ctrl',
            templateUrl: 'modules/node/node.html',
            title: 'Node'
        });

};

export default NodeConfig;
