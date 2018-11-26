class DisclaimerCtrl {
    constructor($state,$localStorage,$translate,$location,$window) {
    'ngInject';

    // this.FaqList=true;
    //state page
    this._state = $state;
    // this.viewKey=1;
    //window state
    this._window= $window;
    // Translation service
    this._$translate = $translate;
    // $location to redirect
    this._location = $location;

    }
        /**
         * showhideList() Load the wallet in app and store in local storage
         *
         * @param data: base64 data from .wlt file
         * @param: isNCC: true if NCC wallet, false otherwise
         */
        // showhideList(data,key){
        //   this.FaqList=data;
        //   this.viewKey=key;
        // }
        redirect(){
            this._window.history.back();
        }
}

export default DisclaimerCtrl;
