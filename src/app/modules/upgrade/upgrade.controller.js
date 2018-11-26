import Network from '../../utils/Network';
import helpers from '../../utils/helpers';
import Nodes from '../../utils/nodes';

class UpgradeCtrl {
    constructor(AppConstants,Wallet,$location,Alert,$filter,$translate,$state,$localStorage) {
        'ngInject';
        // Alert service
        this._Alert = Alert;
        // Filters
        this._$filter = $filter;
        // $location to redirect
        this._location = $location;
        // Wallet service
        this._Wallet = Wallet;
        // Translation service
        this._$translate = $translate;
        // Local storage
        this._storage = $localStorage;
        // Alert service
        this._$state = $state;

        this._appConstants = AppConstants;
        this.backimage = AppConstants.Bgimage;

        // If no wallet show alert and redirect to home
        if (!this._Wallet.current) {
            this._Alert.noWalletLoaded();
            this._location.path('/');
        }
    }

    /**
     * Redirect to dashboard
     */
    gotoDashboard() {
        this._$state.go("app.dashboard");
    }
}

export default UpgradeCtrl;
