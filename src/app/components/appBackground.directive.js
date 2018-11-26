function AppBackground($state,$rootScope,AppConstants,$localStorage) {
    'ngInject';

    return {
        restrict: 'A',
        link: function(scope, element, rootScope) {

            $rootScope.$on('$stateChangeStart',
                function(event, toState, toParams, fromState, fromParams) {
                  console.log('event',event);
                    if (toState.title == 'Home' || toState.title == 'Login' || toState.title == 'Signup' || toState.title == 'FAQ' || toState.title == 'Recover' || toState.title=='Disclaimer') {

                        if(toState.title != 'FAQ' || toState.title != 'Disclaimer'){
                          element.removeClass('default');
                          element.addClass('login');
                        }
                        if (typeof $.backstretch !== 'undefined') {
                            // init background slide images
                            $.backstretch(AppConstants.Bgimage, {
                                fade: 1000,
                                duration: 8000
                            });
                        } else {
                            $(document).ready(function() {
                                $.backstretch(AppConstants.Bgimage, {
                                    fade: 1000,
                                    duration: 8000
                                });
                            });
                        }
                        // element.css({
                        //     'background': 'linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url("images/background.jpg")',
                        //     'background-size': 'cover'
                        // });
                    } else {
                      console.log('localStorage',$localStorage)
                        element.removeClass('login');

                        if($localStorage.themes){
                          element.addClass($localStorage.themes.type);
                        }else {
                          element.addClass('blue')
                          $localStorage.themes = {"type":'blue',"key":'DEFAULT_SCREEN'};
                        }
                        if (typeof $.backstretch !== 'undefined' && typeof $("body").data('backstretch') !== 'undefined') {
                          $("body").backstretch("destroy");
                        }
                        element.css({
                            'background-color':'#f4f8fb'
                           //'background-image':'url('+AppConstants.Bgimage[0]+')' // gray
                        });
                    }
                })

        }
    };
}

export default AppBackground;
