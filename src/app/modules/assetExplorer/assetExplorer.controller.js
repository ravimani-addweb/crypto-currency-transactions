import helpers from '../../utils/helpers';
import CryptoHelpers from '../../utils/CryptoHelpers';
import Network from '../../utils/Network';

class AssetExplorerCtrl {
    constructor(AppConstants, $localStorage, Connector, $timeout, Wallet, Alert, $location, DataBridge, $scope, $filter, Transactions, NetworkRequests) {
        'ngInject';

        this.appName = AppConstants.appName;
        // Application constants
        this._AppConstants = AppConstants;
        //Local storage
        this._storage = $localStorage;
        // Connector service
        this._Connector = Connector;
        // $timeout for async digest
        this._$timeout = $timeout;

        // Alert service
        this._Alert = Alert;
        // Filters
        this._$filter = $filter;
        // $location to redirect
        this._location = $location;
        // Wallet service
        this._Wallet = Wallet;
        // Transaction service
        this._Transactions = Transactions;
        // DataBridge service
        this._DataBridge = DataBridge;
        this._NetworkRequests = NetworkRequests;

        // Default account properties
        this.selectedWallet = '';
        this.moreThanOneAccount = false;

        // If no wallet show alert and redirect to home
        if (!this._Wallet.current) {
            this._Alert.noWalletLoaded();
            this._location.path('/');
            return;
        }

        // Mosaics
        this.mosaics = [];

        // Total DIM Coin owned
        this.totalDim = 0.00;

        /**
         * Default Dashboard properties
         */

        // Harvesting chart data
        this.labels = [];
        this.valuesInFee = [];
        // Helper to know if no data for chart
        this.chartEmpty = true;

        // Default tab on confirmed transactions
        this.tabConfirmed = true;

        // Hide private key field by default
        this.showPrivateKeyField = false;

        // Empty default label for added account
        this.newAccountLabel = "";

        // Check number of accounts in wallet to show account selection in view
        this.checkNumberOfAccounts();

        // Object to contain our password & private key data.
        this.common = {
            'password': '',
            'privateKey': ''
        };

        /**
         * Watch harvested blocks in Databridge service for the chart
         */
        $scope.$watch(() => this._DataBridge.harvestedBlocks, (val) => {
            this.labels = [];
            this.valuesInFee = [];
            if (!val) {
                return;
            }
            for (let i = 0; i < val.length; ++i) {
                // If fee > 0 we push the block as label and the fee as data for the chart
                if (val[i].totalFee / 1000000 > 0) {
                    this.labels.push(val[i].height)
                    this.valuesInFee.push(val[i].totalFee / 1000000);
                }
            }
            // If nothing above 0 XEM show message
            if (!this.valuesInFee.length) {
                this.chartEmpty = true;
            } else {
                this.chartEmpty = false;
            }
        });

        //Confirmed txes pagination properties
        this.currentPage = 0;
        this.pageSize = 5;
        this.numberOfPages = function() {
            return Math.ceil(this._DataBridge.transactions.length / this.pageSize);
        }

        //Unconfirmed txes pagination properties
        this.currentPageUnc = 0;
        this.pageSizeUnc = 5;
        this.numberOfPagesUnc = function() {
            return Math.ceil(this._DataBridge.unconfirmed.length / this.pageSizeUnc);
        }

        // Harvested blocks pagination properties
        this.currentPageHb = 0;
        this.pageSizeHb = 5;
        this.numberOfPagesHb = function() {
            return Math.ceil(this._DataBridge.harvestedBlocks.length / this.pageSizeHb);
        }

        // Buy input amount
        this.buyAmount = [];

        this.buyable = [];

        this.getTotalDimOwned();

        this.getMosaics('NDKAE4Y5FBKYPM5O6KQSUUIHEJZ2VHZURRDC4VMY', 'demoassets');
    }

    /**
     * Gets all mosaics given an address and a parent namespace
     *
     * @param {string} address - An account address
     * @param {string} parent - A parent namespace
     */
    getMosaics(address, parent) {
        this.selectedMosaic = undefined;
        this.selectedMosaicName = this._$filter("translate")("EXPLORER_NS_MOS_SELECT_MOS");
        this.selectedSubNamespaceName = parent;
        return this._NetworkRequests.getMosaics(helpers.getHostname(this._Wallet.node), address, parent).then((res) => {
            if(!res.data.length) {
                this.mosaics = [];
                this.currentPageMos = 0;
            } else {
                this.mosaics = res.data;
                this.currentPageMos = 0;
            }
            this.mosaics = this.getMosaicsPrice(this.mosaics);
        },
        (err) => {
            if(err.status === -1) {
                this._Alert.connectionError();
            } else {
                this._Alert.errorGetMosaics(err.data.message);
            }
        });
    }

    getMosaicsPrice(mosaicsRaw) {
        let mosaicsWithPrice = [];
        for (let $i = 0; $i < mosaicsRaw.length ; $i++) {
            mosaicsWithPrice[$i] = mosaicsRaw[$i];
            this._NetworkRequests.getStockData(mosaicsRaw[$i].id.name).then((apiData) => {
                    mosaicsWithPrice[$i].price = apiData.price ? apiData.price : 0.00;
                    if (parseInt(apiData.otc) === 0) {
                        mosaicsWithPrice[$i].listType = 'Stock Exchange';
                    } else if (parseInt(apiData.otc) === 1) {
                        mosaicsWithPrice[$i].listType = 'OTC';
                    } else {
                        mosaicsWithPrice[$i].listType = 'Not Listed';
                    }
                },
                (err) => {
                    mosaicsWithPrice[$i].price = 0.00;
                    mosaicsWithPrice[$i].listType = 'Not Listed';
            });
        }

        return mosaicsWithPrice;
    }

    getTotalDimOwned() {
        let acct = this._Wallet.currentAccount.address;

        // Get the mosaic selected
        let mosaic = this._DataBridge.mosaicOwned[acct]["dim:coin"];
        /*for (let i = 0; i < names.length; i++) {
            if (names[i] == assetData[0] + ":" + assetData[1]) {
                this.formData.mosaics = [{
                    'mosaicId': {
                        'namespaceId': assetData[0],
                        'name': assetData[1]
                    },
                    'quantity': mosaic.quantity,
                    'gid': 'mos_id_0'
                }];
            }
        }*/
        if (mosaic !== undefined) {
            this.totalDim = mosaic.quantity;
        }
    }

    checkClick(event, mosaicName) {
        if (this.buyable[mosaicName]) {
            event.preventDefault();
        }
    }

    validateBuyQuantity(value, price, mosName) {
        if (value == 0 || value == '') {
            this.buyable[mosName] = true;
        } else {
            if (value <= this.totalDim / price) {
                this.buyable[mosName] = false;
            } else {
                this.buyable[mosName] = true;
            }
        }
    }

    initializeBuyButtons(mosName) {
        this.buyable[mosName] = true;
    }


    /**
     * refreshMarketInfo() Fetch data from CoinMarketCap api to refresh market information
     */
    refreshMarketInfo() {
        // Get market info
        this._NetworkRequests.getMarketInfo().then((data) => {
            this._DataBridge.marketInfo = data;
        },
        (err) => {
            // Alert error
            this._Alert.errorGetMarketInfo();
        });
    }

    /**
     * Check the number of accounts in wallet
     */
    checkNumberOfAccounts() {
        if (this._Wallet.current && Object.keys(this._Wallet.current.accounts).length > 1) {
            this.moreThanOneAccount = true;
        }
    }

    /**
     * Reset the common object
     */
    clearSensitiveData() {
        this.common = {
            'password': '',
            'privateKey': ''
        };
        this.showPrivateKeyField = false;
        this.newAccountLabel = "";
    }


}

export default AssetExplorerCtrl;