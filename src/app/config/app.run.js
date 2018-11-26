function AppRun(AppConstants, $rootScope, $timeout, Wallet, $location) {
    'ngInject';

    if ($location.protocol() != 'https')
    {
      //  window.location.href = 'https://' + $location.host() + $location.url();
    }

    // change page title based on state
    $rootScope.$on('$stateChangeSuccess', (event, toState) => {
        $rootScope.setPageTitle(toState.title);
        // enable tooltips globally
        $timeout( function() {
            $('[data-toggle="tooltip"]').tooltip()
        });
    });

    // Helper method for setting the page's title
    $rootScope.setPageTitle = (title) => {
        $rootScope.pageTitle = '';
        if (title) {
            $rootScope.pageTitle += title;
            $rootScope.pageTitle += ' \u2014 ';
        }
        $rootScope.pageTitle += AppConstants.appName;
    };
}

export default AppRun;
