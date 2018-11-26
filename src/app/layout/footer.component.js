class AppFooterCtrl {
    constructor(AppConstants,$state,Wallet) {
        'ngInject';

        this._$state = $state;
        // Application constants
        this._AppConstants = AppConstants;
        // Wallet service
        this._Wallet = Wallet;

        $(function() {
          $(["/images/kontakt.png", "images/telegram.png", "/images/twitter.png","/images/facebook.png","/images/need-help.png"])
                .preload();
        });
    }
    redirect() {
        this._$state.go("app.disclaimer");
    }
    redirecthelp(){
      this._$state.go("app.needhelp");
    }

}

let AppFooter = {
    controller: AppFooterCtrl,
    templateUrl: 'layout/footer.html'
};

export default AppFooter;
