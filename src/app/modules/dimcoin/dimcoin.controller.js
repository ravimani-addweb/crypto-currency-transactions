import helpers from '../../utils/helpers';

class DimcoinCtrl {
    constructor(AppConstants,$stateParams,$state,$filter) {
        'ngInject';

        this.appName = AppConstants.appName;
        // Filters
        this._$filter = $filter;
        // Application constants
        this._AppConstants = AppConstants;
        //StateParam
        this._stateParams= $stateParams;
        // state
        this._state=$state;
        this.screenmain=true;
        this.selectId="1";
        this.currencydata=false;

        this.availableDisplayCurrency = [
            { id: "USD", name: this._$filter('translate')('US_DOLLAR') },
            { id: "INR", name: this._$filter('translate')('IN_RUPEE') },
            { id: "EUR", name: this._$filter('translate')('EURO') },
            { id: "CHF", name: this._$filter('translate')('CHF_FRANCE') },
        ];
        this.selectedDisplayCurrency = { id: "USD", name: this._$filter('translate')('US_DOLLAR') };
    }
    doSubmit(data){
        this._state.go('transfer-transactions/dim/dim|coin/0');
    }
    screen(){
      if(this.screenmain  == true){
        this.screenmain =false;
      }else {
        this.screenmain= true;
      }
    }
    currencyselect(){
      if(this.currencydata==true){
        this.currencydata=false;
      }else{
        this.currencydata=true;
      }
      //console.log('currency',this.currency);
    }
    selectedCurrency(){
    }
    /**
     * Get the current display currency Code.
     *
     * This will return the dollar-sign, euro-sign
     * or indian rupee sign.
     *
     * @return {string}
     */
    getFiatCode() {
        if ("INR" == this.selectedDisplayCurrency.id)
            return '₹';
        else if ("EUR" == this.selectedDisplayCurrency.id)
            return '€';
        else if ("CHF" == this.selectedDisplayCurrency.id)
            return 'Fr';
        return '$';
    }
}

export default DimcoinCtrl;
