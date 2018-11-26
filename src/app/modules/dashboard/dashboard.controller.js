import helpers from '../../utils/helpers';
import CryptoHelpers from '../../utils/CryptoHelpers';
import Network from '../../utils/Network';

class DashboardCtrl {
    constructor(Wallet, Alert, $location, DataBridge, $scope, $filter, Transactions, NetworkRequests, $state, AppConstants, DimService) {
        'ngInject';

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
        // $state for redirect
        this._$state = $state;

        this._DataBridge = DataBridge;
        this._NetworkRequests = NetworkRequests;
        this._DIM = DimService;

        this.showqrcode = false;
        this.confirmed = false;
        this.mainModel = true;
        // Default account properties
        this.selectedWallet = '';
        this.moreThanOneAccount = false;

        // If no wallet show alert and redirect to home
        if (!this._Wallet.current) {
            this._Alert.noWalletLoaded();
            return this._location.path('/');
        }

        this.blockchain = AppConstants.block_chain + this._Wallet.current.accounts[0].address;
        $scope.textToCopy = this._Wallet.current.accounts[0].address.toUpperCase().replace(/-/g, '').match(/.{1,6}/g).join('-');
        $scope.supported = false;

        $scope.fail = function(err) {
            console.error('Error!', err);
        };

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

        // Total Assest value
        this.totalAssets = 0;

        //Currency select Box
        this.iscurrencyselect=false;

        // Check number of accounts in wallet to show account selection in view
        this.checkNumberOfAccounts();

        this.isUnconfirmedDisplayed = false;

        this.walletTypes = [{
            "type": 1 // Basic Wallet
        }, {
            "type": 2 // Premium Wallet
        }, {
            "type": 3 // Vip Wallet
        }, {
            "type": 4 // Privatekey
        }];
        // Default is "create a new wallet" (PRNG)
        this._selectedType = this.walletTypes[0];

        // Object to contain our password & private key data.
        this.common = {
            'password': '',
            'privateKey': ''
        };
        // Wallet model for QR
        // @note: need to handle labels
        this.WalletModelQR = {
            'nem': {
                'type': 1,
                'version': 1,
                'name': this._Wallet.current.name,
                'enc_priv': this._Wallet.currentAccount.encrypted,
                'iv': this._Wallet.currentAccount.iv,
                'indexes': Object.keys(this._Wallet.current.accounts).length,
                'accountLabels': []
            }
        };

        // Account info model for QR
        this.accountInfoModelQR = {
            "v": 1,
            "type": 1,
            "data": {
                "addr": this._Wallet.currentAccount.address,
                "name": this._Wallet.current.name
            }
        }

        // Invoice model for QR
        this.stampModelQR = {
            "v": this._Wallet.network === Network.data.Testnet.id ? 1 : 2,
            "type": 2,
            "data": {
                "addr": this._Wallet.currentAccount.address,
                "amount": 0,
                "msg": "",
                "name": "DepotWallet XEM"
            }
        };

        // Generate QR using kjua lib
        this.encodeQrCode = function(text, type) {
            let qrCode = kjua({
                text: text,
                fill: '#000',
                quiet: 0,
                ratio: 2,
                height: 350,
                width: 350,
            });
            if (type === "wallet") {
                $('#exportWalletQR').append(qrCode);
            } else if (type === "mobileWallet") {
                $('#mobileWalletForm').html("");
                $('#mobileWalletQR').append(qrCode);
            } else if (type === "stampInfo") {
                $('#exportStampQR').append(qrCode);
            } else {
                $('#accountInfoQR').append(qrCode);
            }
        }

        // Stringify the wallet object for QR
        this.walletString = JSON.stringify(this.WalletModelQR);
        // Stringify the account info object for QR
        this.accountString = JSON.stringify(this.accountInfoModelQR);
        this.stampModelQR.data.addr = this.stampModelQR.data.addr.toUpperCase().replace(/-/g, '');
        this.stampString = JSON.stringify(this.stampModelQR);
        // Generate the QRs
        this.encodeQrCode(this.walletString, "wallet");
        this.encodeQrCode(this.accountString, "accountInfo");
        this.encodeQrCode(this.stampString, "stampInfo");

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

        this.availableDisplayCurrency = [
            { id: "USD", name: this._$filter('translate')('US_DOLLAR') },
            { id: "INR", name: this._$filter('translate')('IN_RUPEE') },
            { id: "EUR", name: this._$filter('translate')('EURO') },
            { id: "GBP", name: this._$filter('translate')('GB_POUNDS') },
        ];
        this.selectedDisplayCurrency = { id: "USD", name: this._$filter('translate')('US_DOLLAR') };
        this.selectedStatisticsPeriod = 1;

        //XXX Basic Wallet with < 1000 USD should have UPGRADE

        $(function() {
            $("#sortable").sortable({
                  handle: ".move-icon"
                // placeholder: "ui-sortable-placeholder"
            });

            $([
              "/images/qr-code-o.png",
              "/images/download-o.png",
              "/images/copy-o.png",
              "/images/view-o.png",
              "/images/info-big-o.png",
              "/images/settings-hover.png",
              "/images/buy.png",
              "/images/sell.png",
              "/images/transfer.png",
              "/images/nem.png",
              "/images/dimcoin.png",
              "/images/dim-token.png",
              "/images/dim-currencies.png",
              "/images/plus.png",
              "/images/minus.png",
              "/images/view.png",
              "/images/close-o.png",
              "/images/delay.png",
              "/images/dashboard.png"]).preload();
        });
    };

    /**
     * changeWalletType() Change the selected wallet type
     *
     * @param type: Type number
     */
    changeWalletType(type) {
        // Set wallet typeModalOpen
        this._selectedType = this.walletTypes[type - 1];
    };

    success() {
        this._Alert.copiedClipboard();
    };

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
        // Gets btc price
        this._NetworkRequests.getBtcPrice().then((data) => {
                this._DataBridge.btcPrice = data;
            },
            (err) => {
                this._Alert.errorGetBtcPrice();
            });
    };

    /**_$state
     * Fix a value to 4 decimals
     */
    toFixed4(value) {
        return value.toFixed(4);
    };

    /**
     * Generate the mobile wallet QR
     */
    generateWalletQR() {
        // Decrypt/generate private key and check it. Returned private key is contained into this.common
        if (!CryptoHelpers.passwordToPrivatekeyClear(this.common, this._Wallet.currentAccount, this._Wallet.algo, false)) {
            this._Alert.invalidPassword();
            this.showPrivateKeyField = false;
            return;
        } else if (!CryptoHelpers.checkAddress(this.common.privateKey, this._Wallet.network, this._Wallet.currentAccount.address)) {
            this._Alert.invalidPassword();
            this.showPrivateKeyField = false;
            return;
        }

        let mobileKeys = CryptoHelpers.AES_PBKF2_encryption(this.common.password, this.common.privateKey)

        let QR = {
            "v": this._Wallet.network === Network.data.Testnet.id ? 1 : 2,
            "type": 3,
            "data": {
                "name": this._Wallet.current.name,
                "priv_key": mobileKeys.encrypted,
                "salt": mobileKeys.salt
            }
        };

        let QRstring = JSON.stringify(QR);
        this.encodeQrCode(QRstring, "mobileWallet");
        this.clearSensitiveData();
    };

    /**
     * Check the number of accounts in wallet
     */
    checkNumberOfAccounts() {
        if (this._Wallet.current && Object.keys(this._Wallet.current.accounts).length > 1) {
            this.moreThanOneAccount = true;
        }
    };

    /**
     * Reset the common object
     */
    clearSensitiveData() {
        this.common = {
            'password': '',
            'privateKey': ''
        };
        this.showPrivateKeyField = false;
        this.newAdownloadWalletccountLabel = "";
    };

    ModalOpen() {
        if (this.showqrcode == true) {
            this.showqrcode = false;
            this.mainModel = true;
        } else {
            this.showqrcode = true;
            this.mainModel = false;
        }
    };
    ModalInfo() {
        if (this.showinfo == true) {
            this.showinfo = false;
            this.mainModel = true;
        } else {
            this.showinfo = true;
            this.mainModel = false;
        }
    }

    /**
     * Redirect to login page
     */
    gotoSettings() {
        this._$state.go("app.setting");
    };

    /**
     * gotoUpgrade
     */
    gotoUpgrade() {
        this._$state.go("app.accountUpgrade");
    };

    /**
     * Redirect to login page
     */
    redirect2() {
        this._$state.go("app.dashboard");
    };

    triggerUnconfirmedDisplay() {
        if (this.isUnconfirmedDisplayed == true) {
            this.isUnconfirmedDisplayed = false;
        } else {
            this.isUnconfirmedDisplayed = true;
        }
    };

    /**
     * Compute the Total Wallet Balance.
     *
     * If no mosaic is passed, the total balance will be computed.
     * If you restrict by Mosaic you will get only sub totals.
     *
     * The amounts are all returned in the *display currency* format.
     *
     * @param  {string} mosaicName
     * @return {float}
     */
    getWalletBalance(mosaic) {
        if (! this._Wallet.current || !this._Wallet.current.accounts || !!this._Wallet.current.accounts.length)
            // wallet not done loading
            return 0.00;

        var mosaicName = typeof mosaic == 'object' ? mosaic.mosaicId.namespaceId + ":" + mosaic.mosaicId.name : (mosaic != undefined ? mosaic : false);

        var account = this._Wallet.current.accounts[0];
        var mosaics = this._DataBridge.mosaicOwned[account.address];

        if (!mosaics)
            return 0.00;

        // we will first get the price in USD
        // for all asked mosaics.
        var totalBalance = 0.00;
        for (var mosaicSlug in mosaics) {
            var mosaic = mosaics[mosaicSlug];
            var spec = this._DIM.getCurrencyConfig(mosaic);

            if (mosaicName !== false && mosaicSlug != mosaicName)
                continue;

            var amount = mosaic.quantity;
            var mosTotalUSD = 0.00;
            var priceUSD = this._DIM.getCurrencyPrice(mosaic);
            var div = this._DIM.getDivisibility(spec.slug);

            mosTotalUSD = (amount / Math.pow(10, div)) * priceUSD;
            totalBalance += mosTotalUSD;
        }

        if ("USD" != this.selectedDisplayCurrency.id) {
            // need to convert balance from USD to the display currency (INR or EUR)
            var rates = this._DataBridge.fiatRates;
            if (rates && rates.hasOwnProperty(this.selectedDisplayCurrency.id)) {
                var currencyToUSD = rates[this.selectedDisplayCurrency.id];
                totalBalance = totalBalance * currencyToUSD;
            }
        }

        return this._$filter('currencyFormat')(totalBalance);
    };

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
        else if ("GBP" == this.selectedDisplayCurrency.id)
            return '£';

        return '$';
    };

    /**
     * download() trigger download of the wallet
     *
     * @param {Wallet}  wallet
     * @return void
     */
    download(wallet) {
        if (!wallet) {
            this._Alert.errorWalletDownload();
            return;
        }

        // Wallet object string to word array
        var wordArray = CryptoJS.enc.Utf8.parse(JSON.stringify(wallet));
        // Word array to base64
        var base64 = CryptoJS.enc.Base64.stringify(wordArray);
        // Set download element attributes
        $("#downloadWallet").attr('href', 'data:application/octet-stream,' + base64);
        $("#downloadWallet").attr('download', wallet.name + '.wlt');
        // Simulate click to trigger download
        document.getElementById("downloadWallet").click();
    };

    /**
     * Initiate the current wallet download.
     *
     * @return void
     */
    downloadWallet() {
        this.download(this._Wallet.current)
    };

    /**
     * Change the currently selected statistics period for the Total Box
     * of the dashboard page.
     *
     * @return void
     */
    changeStatisticsPeriod(newPeriod) {
        var period = parseInt(newPeriod);
        this.selectedStatisticsPeriod = period;
    };

    isSelectCurrency(){
      //console.log(this.iscurrencyselect)
        if(this.iscurrencyselect == true){
          this.iscurrencyselect = false;
        }else {
          this.iscurrencyselect = true;
        }
    };

    openTransferModule(mosaic) {
        let spec = this._DIM.getCurrencyConfig(mosaic);
        let asset = spec.slug.replace(/:/, "|");

        return this._location.path("/transfer-transactions/trnsfr/" + asset + "/0/transaction");
    }

}
export default DashboardCtrl;
