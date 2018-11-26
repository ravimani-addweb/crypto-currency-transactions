class HelpCtrl {
    constructor($state,$localStorage,$translate,$location,$window) {
    'ngInject';

    //state page
    this._state = $state;
    //window state
    this._window= $window;
    // Translation service
    this._$translate = $translate;
    // $location to redirect
    this._location = $location;

    }
    redirect(){
      this._window.history.back();
    }
}

export default HelpCtrl;
