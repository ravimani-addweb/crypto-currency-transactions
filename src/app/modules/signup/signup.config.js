function SignupConfig($stateProvider) {
    'ngInject';

    $stateProvider
        .state('app.signup', {
            url: '/signup/:slug',
            controller: 'SignupCtrl',
            controllerAs: '$ctrl',
            templateUrl: 'modules/signup/signup.html',
            title: 'Signup'
        });

};

export default SignupConfig;
