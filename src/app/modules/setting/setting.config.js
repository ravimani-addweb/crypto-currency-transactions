function SettingConfig($stateProvider) {
    'ngInject';

    $stateProvider
        .state('app.setting', {
            url: '/setting',
            controller: 'SettingCtrl',
            controllerAs: '$ctrl',
            templateUrl: 'modules/setting/setting.html',
            title: 'Setting'
        });

};

export default SettingConfig;
