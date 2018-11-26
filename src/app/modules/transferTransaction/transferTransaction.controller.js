import helpers from '../../utils/helpers';
import Address from '../../utils/Address';
import CryptoHelpers from '../../utils/CryptoHelpers';
import Network from '../../utils/Network';

class TransferTransactionCtrl {
    constructor($location, Wallet, Alert, Transactions, NetworkRequests, DataBridge, $state, $timeout, $localStorage, AppConstants, DimService, $filter, $scope, processBar) {
        'ngInject';

        this._appConst = AppConstants;
        // Alert service
        this._Alert = Alert;
        // $location to redirect
        this._location = $location;
        // NetworkRequests service
        this._NetworkRequests = NetworkRequests;
        // Wallet service
        this._Wallet = Wallet;
        // Transactions service
        this._Transactions = Transactions;
        // DataBridge service
        this._DataBridge = DataBridge;
        // $state
        this._state = $state;
        //Local storage
        this._storage = $localStorage;
        // use helpers in view
        this._helpers = helpers;
        // use $filter in controller
        this._$filter = $filter;
        // use the current scope
        this._$scope = $scope;
        // $timeout for async digest
        this._$timeout = $timeout;
        this.arrowclass='fa-angle-right';
        this._processBar =processBar;
        $('body').find('.process-bar-wrap').hide();

        // DIM Service
        this._DIM = DimService;

        // Object to contain our password & private key data.
        this.common = {
            'password': '',
            'privateKey': '',
        };

        if (!this._Wallet.current) {
            this._Alert.noWalletLoaded();
            this._location.path('/');
            return;
        }
        //for model open
        this.addressbook = false;
        this.mainModel = true;
        this.decriptmessgeshowpop = false;

        /**
         * Default transfer transaction properties
         */
        this.formData = {};
        // Alias or address user type in
        this.formData.rawRecipient = this._state.params.address.length ? this._state.params.address : '';
        if (this.formData.rawRecipient.length) {
            this.processRecipientInput();
        }
        // Cleaned recipient from @alias or input
        this.formData.recipient = '';
        this.formData.recipientPubKey = '';
        this.formData.message = '';
        this.rawAmount = 0;
        this.formData.amount = 0;
        this.formData.fee = 0;
        this.formData.encryptMessage = true;
        // Multisig data
        this.formData.innerFee = 0;
        this.formData.isMultisig = false;
        this.formData.multisigAccount = this._DataBridge.accountData.meta.cosignatoryOf.length == 0 ? '' : this._DataBridge.accountData.meta.cosignatoryOf[0];
        // Mosaics data
        // Counter for mosaic gid
        this.counter = 1;
        this.formData.mosaics = [];
        this.decimalizedAmounts = {};
        this.mosaicsMetaData = this._DataBridge.mosaicDefinitionMetaDataPair;
        this.currentAccountMosaicNames = [];

        // Mosaics data for current account
        this.currentAccountMosaicData = "";

        // DIM Transfer is always Mosaic Transfer (also when sending XEM)
        this.actionSlug = this._state.params.opt;
        this.availableTabs = {
            'transaction': this._$filter('translate')("TRANSFER_TRANSACTION_TITLE"),
            'information': this._$filter('translate')("ACCOUNT_ACCOUNT_INFORMATION")
        };

        if(this._state.params.slug){
          this.currentTab = this._state.params.slug;
        }
        else {
          this.currentTab = 'transaction';
        }

        // DIM Currency Selector features
        this.isCurrencySelectorDisplayed = false;

        // setup currency selector when no state parameters are passed
        this.selectedCurrenciesLabel = "";
        this.selectedCurrencies = [];

        // setup form steps
        this.currentFormStep = 1;

        // Init account data
        this.updateCurrentAccountMosaics();

        // Read URL
        this.handleStateParameters();

        // DIM transfers is always mosaics!
        this.setMosaicTransfer();

        // temp address
        this.rcpntAddress = '';

        // dimcoin packages
        this.dimPackages = [
            100,
            200,
            500,
            1000,
            2500,
            5000,
            10000,
            25000,
            50000,
            100000,
            250000
        ];

        // Invoice mode not active by default
        this.invoice = false;
        // Plain amount that'll be converted to micro XEM
        this.rawAmountInvoice = 0;

        // Alias address empty by default
        this.aliasAddress = '';
        // Not showing alias address input by default
        this.showAlias = false;
        // Needed to prevent user to click twice on send when already processing
        this.okPressed = false;

        // Character counter
        this.charsLeft = 1024;

        this.contacts = []

        if (undefined !== this._storage.contacts && undefined !== this._storage.contacts[this._Wallet.currentAccount.address] && this._storage.contacts[this._Wallet.currentAccount.address].length) {
            this.contacts = this._storage.contacts[this._Wallet.currentAccount.address]
        }

        // Contacts to address book pagination properties
        this.currentPageAb = 0;
        this.pageSizeAb = 5;
        this.numberOfPagesAb = function() {
            return Math.ceil(this.contacts.length / this.pageSizeAb);
        }

        // Invoice model for QR
        this.invoiceData = {
            "v": this._Wallet.network === Network.data.Testnet.id ? 1 : 2,
            "type": 2,
            "data": {
                "addr": this._Wallet.currentAccount.address,
                "amount": 0,
                "msg": "",
                "name": "NanoWallet XEM invoice"
            }
        };

        // Init invoice QR
        this.updateInvoiceQR();

        this.updateFees();

        $('input.switched-item').on('change', function() {
            if ($(this).is(':checked')) {
                $(this).siblings('.on-off-wrap').addClass('switched-on');
                $(this).siblings('.on-off-wrap').removeClass('switched-off');
            } else {
                $(this).siblings('.on-off-wrap').removeClass('switched-on');
                $(this).siblings('.on-off-wrap').addClass('switched-off');
            }
        });

        $(function() {
            $(["/images/checkbox-unchecked.png",
             "/images/checkbox-checked.png",
             "images/address-icon.png",
             "/images/info-o.png",
             "/images/close-o.png",
             "/images/transfer-i.png",
             "/images/info-o.png"]).preload();
        });
    };


    /**
     * Generate QR using kjua lib
     */
    generateQRCode(text) {
        let qrCode = kjua({
            size: 256,
            text: text,
            fill: '#000',
            quiet: 0,
            ratio: 2,
        });
        $('#invoiceQR').html(qrCode);
    };

    /**
     * helper for opening modal boxes
     * @param {*} modelname
     */
    ModalOpen(modelname) {
        if (modelname == "addressbook") {
            if (this.addressbook == true) {
                this.addressbook = false;
                this.mainModel = true;
            } else {
                this.addressbook = true;
                this.mainModel = false;
            }
        }
    };

    /**
     * Create the QR according to invoice data
     */
    updateInvoiceQR() {
        // Clean input address
        this.invoiceData.data.addr = this.invoiceData.data.addr.toUpperCase().replace(/-/g, '');
        // Convert user input to micro XEM
        this.invoiceData.data.amount = this.rawAmountInvoice * 1000000;
        this.invoiceString = JSON.stringify(this.invoiceData);
        // Generate the QR
        this.generateQRCode(this.invoiceString);
    };

    /**
     * Set or unset data for mosaic transfer
     *
     * When a mosaic transfer is done on the NEM blockchain,
     * the `transaction.amount` field is used as a multiplier
     * for the `mosaic.quantity` field.
     *
     * This method will also trigger an update of fees through
     * a call to `updateFees()`.
     */
    setMosaicTransfer() {
        if (this.formData && this.formData.isMosaicTransfer) {

            // read account
            let acct = this._Wallet.currentAccount.address;

            // In case of mosaic transfer amount is used as multiplier,
            // set to 1 as default
            this.rawAmount = 1;
            this.formData.amount = 1;
        } else {
            // Reset mosaics array
            if (!this.formData)
                this.formData = {};

            this.formData.mosaics = [];

            // Reset amount
            this.rawAmount = 1;
            this.formData.amount = 1;
        }
        this.updateFees();
    };

    /**
     * triggerTab will change the active tab in the view
     *
     * @param type: Type number
     */
    triggerTab(tab) {
        if (!this.availableTabs.hasOwnProperty(tab))
            tab = "transaction";

        this.currentTab = tab;
    }

    /**
     * Paginate through form steps using "Next" and "Back"
     * buttons.
     *
     * Form Steps are only available when `this.currentTab`
     * is set to `transaction` (first tab).
     *
     * @param {string} clicked
     */
    formStepsPaginator(clicked) {
        if (clicked == 'next') {
            this.currentFormStep++;

            if (this.currentFormStep > 4)
                this.currentFormStep = 4;
        }
        if (clicked == 'back') {
            this.currentFormStep--;

            if (this.currentFormStep < 1)
                this.currentFormStep = 1;
        }
    };

    /**
     * Process recipient input and get data from network
     *
     * @note: I'm using debounce in view to get data typed with a bit of delay,
     * it limits network requests
     */
    processRecipientInput() {
        // Check if value is an alias
        let isAlias = (this.formData.rawRecipient.lastIndexOf("@", 0) === 0);
        // Reset recipient data
        this.resetRecipientData();

        // return if no value or address length < to min address length AND not an alias
        if (!this.formData.rawRecipient || this.formData.rawRecipient.length < 40 && !isAlias) {
            return;
        }

        // Get recipient data depending of address or alias used
        if (isAlias) {
            // Clean namespace name of the @
            let nsForLookup = this.formData.rawRecipient.substring(1);
            // Get namespace info and account data from network
            this.getRecipientDataFromAlias(nsForLookup)
        } else { // Normal address used
            // Clean address
            let recipientAddress = this.formData.rawRecipient.toUpperCase().replace(/-/g, '');
            // Check if address is from network
            if (Address.isFromNetwork(recipientAddress, this._Wallet.network)) {
                // Get recipient account data from network
                this.getRecipientData(recipientAddress);
            } else {
                // Error
                this._Alert.invalidAddressForNetwork(recipientAddress, this._Wallet.network);
                // Reset recipient data
                this.resetRecipientData();
                return;
            }
        }
    };

    /**
     * Update transaction fee
     *
     * Updated for DIMCOIN `rawAmount` is always 1 !
     */
    updateFees() {
        // DIM: always mosaic transfers
        let prepared = this.getPreparedFormData();
        let entity = this._Transactions.prepareTransfer(this.common, prepared, this.mosaicsMetaData);

        if (this.formData.isMultisig) {
            this.formData.innerFee = entity.otherTrans.fee;
            // Update characters left
            this.charsLeft = entity.otherTrans.message.payload.length ? 1024 - (entity.otherTrans.message.payload.length / 2) : 1024;
        } else {
            this.formData.innerFee = 0;
            // Update characters left
            this.charsLeft = entity.message.payload.length ? 1024 - (entity.message.payload.length / 2) : 1024;
        }
        this.formData.fee = entity.fee;

        this.decimalizeAmounts();
    }

    /**
     * Get a prepared form data object.
     *
     * This object will contain NEM formatted mosaic amounts.
     * this means that form input will be multiplied by 1000000
     * in the returned object
     *
     * @return {object} Object with mosaic.quantity * 1000000
     */
    getPreparedFormData() {
        let prepared = $.extend(true, {}, this.formData);

        // with DIM transfer module, transfers are always mosaic transfers
        // so the `tx.amount` field is always a multiplier
        prepared.amount = 1;
        for (var i = 0; i < prepared.mosaics.length; i++) {
            // Mosaic amounts must be * 1000000
            let spec = this._DIM.getCurrencyConfig(prepared.mosaics[i]);
            let divisibility = this._DIM.getDivisibility(spec.slug);
            prepared.mosaics[i].quantity = prepared.mosaics[i].quantity * Math.pow(10, divisibility);
        }

        return prepared;
    }

    /**
     * This method will add as man decimal places as needed for the
     * given Mosaic. On DIM with DEPOTWALLET, all transfers are Mosaic
     * Transfers. This also means that the `transaction.amount` field
     * will always be 1.
     *
     * After running this method, all mosaic quantities fields should contain
     * as much decimal places as the NEM mosaic's divisibility is configured.
     *
     * @return  {object}
     */
    decimalizeAmounts() {
        let data = this.formData;

        // with DIM transfer module, transfers are always mosaic transfers
        // so the `tx.amount` field is always a multiplier
        data.amount = 1;
        for (var i = 0; i < data.mosaics.length; i++) {
            // Mosaic amounts must be * 1000000
            let spec = this._DIM.getCurrencyConfig(data.mosaics[i]);
            let divisibility = this._DIM.getDivisibility(spec.slug);

            let asNumber = parseFloat(data.mosaics[i].quantity);
            if (isNaN(asNumber) || asNumber <= 0)
                // invalid mosaic amount
                data.mosaics[i].quantity = divisibility > 0 ? (0).toFixed(divisibility) : 0;

            if (! this.decimalizedAmounts.hasOwnProperty(spec.slug) && divisibility > 0) {
                data.mosaics[i].quantity = parseFloat(data.mosaics[i].quantity).toFixed(divisibility);
                this.decimalizedAmounts[spec.slug] = true;
            }
        }

        this.formData = data;
        return data;
    }

    /**
     * Get recipient account data from network
     *
     * @param address: The recipient address
     */
    getRecipientData(address) {
        return this._NetworkRequests.getAccountData(helpers.getHostname(this._Wallet.node), address).then((data) => {
                // Store recipient public key (needed to encrypt messages)
                this.formData.recipientPubKey = data.account.publicKey;
                // Set the address to send to
                this.formData.recipient = address;
            },
            (err) => {
                this._Alert.getAccountDataError(err.data.message);
                // Reset recipient data
                this.resetRecipientData();
                return;
            });
    }

    /**
     * Get recipient account data from network using @alias
     *
     * @param alias: The recipient alias (namespace)
     */
    getRecipientDataFromAlias(alias) {
        return this._NetworkRequests.getNamespacesById(helpers.getHostname(this._Wallet.node), alias).then((data) => {
                // Set the alias address
                this.aliasAddress = data.owner;
                // Show the read-only input containing alias address
                this.showAlias = true;
                // Check if address is from network
                if (Address.isFromNetwork(this.aliasAddress, this._Wallet.network)) {
                    // Get recipient account data from network
                    this.getRecipientData(this.aliasAddress);
                } else {
                    // Unexpected error, this alert will not dismiss on timeout
                    this._Alert.invalidAddressForNetwork(this.aliasAddress, this._Wallet.network);
                    // Reset recipient data
                    this.resetRecipientData();
                    return;
                }
            },
            (err) => {
                this._Alert.getNamespacesByIdError(err.data.message);
                // Reset recipient data
                this.resetRecipientData();
                return;
            });
    }

    /**
     * Check whether the current account has enough XEM to pay
     * for transaction fees.
     *
     * @return {boolean}
     */
    accountHasEnoughXemForFees() {
        return this.currentAccountMosaicData != undefined
            && this.currentAccountMosaicData.hasOwnProperty("nem:xem")
            && this.currentAccountMosaicData["nem:xem"].quantity
            && this.currentAccountMosaicData["nem:xem"].quantity >= this.formData.fee;
    }

    /**
     * Attach a mosaic to the formData.
     *
     * This will first retrieve the current account mosaics
     * and then attach the said mosaic to the `formData` in
     * case it was not added before.
     *
     * @param {*} mosaic
     */
    attachCustomMosaic(mosaic) {
        let spec = this._DIM.getCurrencyConfig(mosaic);
        let owned = this.currentAccountMosaicData[spec.slug];

        // Check if mosaic already present in mosaics array
        let elem = $.grep(this.formData.mosaics, function(w) {
            return helpers.mosaicIdToName(mosaic.mosaicId) === helpers.mosaicIdToName(w.mosaicId);
        });

        // If not present, update the array
        if (elem.length === 0) {
            this.formData.mosaics.push({
                'mosaicId': mosaic['mosaicId'],
                'quantity': 0,
                'gid': 'mos_id_' + this.counter
            });

            this.selectedCurrencies.push({'id': spec.slug, 'label': spec.label});
            this.selectedCurrenciesLabel = this.selectedCurrenciesLabel.length > 0 ? this.selectedCurrenciesLabel + ", " + spec.label : spec.label;

            this.counter++;
            this.updateFees();
        }
    }

    /**
     * Remove a mosaic from the formData.
     *
     * @param {*} mosaic
     */
    removeCustomMosaic(mosaic) {
        let spec = this._DIM.getCurrencyConfig(mosaic);
        var index = this.findAttachedMosaic(mosaic);
        if (index == -1)
            return ;

        this.formData.mosaics.splice(index, 1);
        this.selectedCurrencies.splice(index, 1);

        this.selectedCurrenciesLabel = "";
        if (this.selectedCurrencies.length) {
            // rebuild currencies display
            for (let i = 0, m = this.selectedCurrencies.length; i < m; i++)
                this.selectedCurrenciesLabel = this.selectedCurrenciesLabel + (i > 0 && i < m-1 ? ", " : "") + this.selectedCurrencies[i].label;
        }

        if (! this.formData.mosaics.length)
            // need *at least* nem:xem in the transaction
            this.triggerCurrencySelected("nem:xem");

        this.updateFees();
    }

    /**
     * Get selected mosaic and push it in mosaics array
     *
     * DISABLED IN DIM DEPOTWALLET
     */
    attachMosaic() {
        // increment counter
        this.counter++;
        // Get current account
        let acct = this._Wallet.currentAccount.address;
        if (this.formData.isMultisig) {
            // Use selected multisig
            acct = this.formData.multisigAccount.address;
        }
        // Get the mosaic selected
        let mosaic = this._DataBridge.mosaicOwned[acct][this.selectedMosaic];
        // Check if mosaic already present in mosaics array
        let elem = $.grep(this.formData.mosaics, function(w) {
            return helpers.mosaicIdToName(mosaic.mosaicId) === helpers.mosaicIdToName(w.mosaicId);
        });
        // If not present, update the array
        if (elem.length === 0) {
            this.formData.mosaics.push({
                'mosaicId': mosaic['mosaicId'],
                'quantity': 0,
                'gid': 'mos_id_' + this.counter
            });

            this.updateFees();
        }
    }


    /**
     * Remove a mosaic from mosaics array
     *
     * @param index: Index of mosaic object in the array
     */
    removeMosaic(index) {
        this.formData.mosaics.splice(index, 1);
        this.updateFees();
    }

    /**
     * helper to get an accounts owned mosaic names
     *
     * @param {*} account
     */
    getOwnedMosaicNames(account) {
        let mosNames = [];
        let names = Object.keys(this._DataBridge.mosaicOwned[account]).sort();
        for (let i = 0; i < names.length; i++) {
            mosNames.push(this._DIM.getCurrencyLabel(names[i]));
        }

        return mosNames;
    }

    /**
     * Get current account mosaics names
     */
    updateCurrentAccountMosaics() {

        //Fix this.formData.multisigAccount error on logout
        if (null === this.formData.multisigAccount) {
            return;
        }

        // read account
        let acct = this._Wallet.currentAccount.address;
        if (this.formData.isMultisig) {
            // Use selected multisig
            acct = this.formData.multisigAccount.address;
        }

        // Set current account mosaics names if mosaicOwned is not undefined
        if (undefined !== this._DataBridge.mosaicOwned[acct]) {

            // update current account mosaics
            this.currentAccountMosaicData  = this._DataBridge.mosaicOwned[acct];
            this.currentAccountMosaicNames = this.getOwnedMosaicNames(acct);
        }
        else {
            this.currentAccountMosaicNames = [this._DIM.getCurrencyLabel("nem:xem")];
            this.currentAccountMosaicData = "";
        }

    }

    /**
     * Read the URL for state parameters to define
     * what data is pre-selected, etc.
     */
    handleStateParameters() {
        // Prepare mosaics default values (+ interpret URL)
        let assetData = (!this._state.params.asset || !this._state.params.asset.length ? "nem|xem" : this._state.params.asset).split('|');
        let urlAsset  = assetData[0] + ":" + assetData[1];

        //console.log("handling state parameters");
        //console.log(this._state.params);
        //console.log(assetData, urlAsset);

        // Now check which feature was asked for
        if (this._state.params.opt === 'trnsfr') {
            // Transfer: Check whether we have an asset ID provided
            //           in the URL.

            // set currency selected and attach mosaic in case its not done yet

            //FIX: currently disabled because the currency amount
            //     is not displayed after programmatic selection
            //this.triggerCurrencySelected(urlAsset);
        }
        else if (this._state.params.opt === 'dim') {
            // DIM Packages Features - When Transferring DIM a default Package
            // Message is included in the transaction.

            // DIM Coins send with this feature will always be sent to
            // @see AppConstants.dimcoin

            this.formData.rawRecipient = this._appConst.dimcoin;

            this.formData.message = "DIM Coins Package: " + (this.dimPackages[parseInt(this._state.params.astid) - 1]) + " dim.";
            this.processRecipientInput();
        }
        else if (this._state.params.opt === 'buy') {
            // Buying currently disabled.
            this.prepareBuy(assetData[1]);
        }
        else if (this._state.params.opt === 'sell') {
            // Selling currently disabled.
            this.prepareSell(assetData[1]);
        }
    }

    prepareBuy(assetTicker) {
        /**
        this._NetworkRequests.getStockData(assetTicker).then((apiData) => {
                this.selectedMosaic = "dim:coin";
                this.formData.mosaics = [{
                    'mosaicId': {
                        'namespaceId': 'dim',
                        'name': 'coin'
                    },
                    'quantity': parseFloat(this._state.params.astid) * parseFloat(apiData.price),
                    'gid': 'mos_id_0'
                }];
            },
            (err) => {
                d.price = 0.00;
                d.listType = 'Not Listed';
            });

        this.formData.message = "Buy request: " + this.selectedMosaic + " of " + this._state.params.astid;
        **/
    }

    prepareSell(assetTicker) {
        /**
        if (assetData[1].lastIndexOf('hbis', 0) === 0) {
            this.formData.rawRecipient = this._appConst.hybse;
            this.processRecipientInput();
        } else if (assetData[1] === 'coin') {
            this.formData.rawRecipient = this._appConst.dimsell;
            this.processRecipientInput();
        }
        **/
    }

    /**
     * Reset data stored for recipient
     */
    resetRecipientData() {
        // Reset public key data
        this.formData.recipientPubKey = '';
        // Hide alias address input field
        this.showAlias = false;
        // Reset cleaned recipient address
        this.formData.recipient = '';
        // Encrypt message set to false
        this.formData.encryptMessage = false;
    }

    /**
     * Reset form data
     */
    resetData() {
        this.formData.rawRecipient = '';
        this.formData.message = '';
        this.rawAmount = 0;
        this.formData.amount = 0;
        this.formData.invoiceRecipient = this._Wallet.currentAccount.address;
    }

    /**
     * get a given mosaic balance for the current account
     *
     * @param {*} mosaic
     */
    getBalance(mosaic) {
        var spec = this._DIM.getCurrencyConfig(mosaic);

        if (!this.currentAccountMosaicData.length || !this.currentAccountMosaicData.hasOwnProperty(spec.slug))
            return 0.000000;

        return this.currentAccountMosaicData[spec.slug].quantity;
    }

    /**
     * Display/Hide the DIM currency selector in
     * the view template transferTransaction.html
     */
    triggerCurrencySelector() {
        this.isCurrencySelectorDisplayed = !this.isCurrencySelectorDisplayed;
    }

    /**
     * Select a currency for the transfer process.
     *
     * This will *attach the mosaic* in background
     * and will automatically provide with an amount
     * field for the said currency.
     *
     * @param {*} mosaic
     */
    triggerCurrencySelected(mosaic) {
        var spec = this._DIM.getCurrencyConfig(mosaic);
        if (this.isCurrencySelected(mosaic)) {
            // remove currency
            this.removeCustomMosaic(spec);
        }
        else {
            // add currency
            this.attachCustomMosaic(spec);

            // re-trigger the selector so that it closes.
            this.triggerCurrencySelector();
        }
    }

    /**
     * Whether a currency has been selected or not.
     *
     * When a currency is selected, it will also be attached
     * as a mosaic in the transaction.
     *
     * @param {*} mosaic
     */
    isCurrencySelected(mosaic) {
        let spec = this._DIM.getCurrencyConfig(mosaic);
        return -1 !== this.findAttachedMosaic(spec);
    }

    /**
     * get the attachment index of a specific `mosaic`.
     *
     * @param {*} mosaic
     */
    findAttachedMosaic(mosaic) {
        let spec = this._DIM.getCurrencyConfig(mosaic);

        if (this.formData.mosaics && this.formData.mosaics.length) {
            for (let i = 0; i < this.formData.mosaics.length; i++) {
                let mos = this.formData.mosaics[i];
                if (mos.mosaicId.namespaceId !== spec.mosaicId.namespaceId)
                    continue;

                if (mos.mosaicId.name !== spec.mosaicId.name)
                    continue;

                return i;
            }
        }

        return -1;
    }

    /**
     * Build and broadcast the transaction to the network
     */
    send() {
      this._processBar.start();
      this.arrowclass='fa-refresh fa-spin';
      this._$timeout(() => {
          // Disable send button;
          this.okPressed = true;

          // Decrypt/generate private key and check it. Returned private key is contained into this.common
          if (!CryptoHelpers.passwordToPrivatekeyClear(this.common, this._Wallet.currentAccount, this._Wallet.algo, true)) {
              this._processBar.complete();
              this.arrowclass='fa-angle-right';
              this._Alert.invalidPassword();
              // Enable send button
              this.okPressed = false;
              return;
          } else if (!CryptoHelpers.checkAddress(this.common.privateKey, this._Wallet.network, this._Wallet.currentAccount.address)) {
              this._processBar.complete();
              this.arrowclass='fa-angle-right';
              this._Alert.invalidPassword();
              // Enable send button
              this.okPressed = false;
              return;
          }

          // Build the entity to serialize
          let formData = this.getPreparedFormData();
          let entity = this._Transactions.prepareTransfer(this.common, formData, this.mosaicsMetaData);
          // Construct transaction byte array, sign and broadcast it to the network
          return this._Transactions.serializeAndAnnounceTransaction(entity, this.common).then((res) => {
                  // Check status
                  if (res.status === 200) {
                      // If code >= 2, it's an error
                      if (res.data.code >= 2) {
                          this._processBar.complete();
                          this.arrowclass='fa-angle-right';
                          this._Alert.transactionError(res.data.message);
                      } else {
                          this._processBar.complete();
                          this.arrowclass='fa-angle-right';
                          this._location.path('/dashboard');
                          this._Alert.transactionSuccess();
                      }
                  }
                  // Enable send button
                  this.okPressed = false;
                  // Delete private key in common
                  this.common.privateKey = '';
              },
              (err) => {
                this._processBar.complete();
                this.arrowclass='fa-angle-right';
                  // Delete private key in common
                  this.common.privateKey = '';
                  // Enable send button
                  this.okPressed = false;
                  this._Alert.transactionError('Failed ' + err.data.error + " " + err.data.message);
              });
      },1000);
    }

    decriptmessgeshow() {
        if (this.decriptmessgeshowpop == true) {
            this.decriptmessgeshowpop = false;
            this.mainModel = true;
        } else {
            this.decriptmessgeshowpop = true;
            this.mainModel = false;
        }
    }
}

export default TransferTransactionCtrl;
