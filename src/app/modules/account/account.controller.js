import helpers from '../../utils/helpers';
import CryptoHelpers from '../../utils/CryptoHelpers';
import Network from '../../utils/Network';

class AccountCtrl {
    constructor(AppConstants,$state,$localStorage, $scope, $location, Alert, Wallet, $timeout, Connector, DataBridge, $translate, processBar) {
        'ngInject';

        // Application constants
        this._AppConstants = AppConstants;
        // Wallet service
        this._Wallet = Wallet;
        // $location to redirect
        this._location = $location;
        //Local storage
        this._storage = $localStorage;
        // Alert service
        this._Alert = Alert;
        this._$state=$state;
        // Connector service
        this._Connector = Connector;
        // DataBridge service
        this._DataBridge = DataBridge;
        // $timeout for async digest
        this._$timeout = $timeout;
        // Translation service
        this._$translate = $translate;
        // Default account properties
        this.moreThanOneAccount = false;
        // $timeout to digest asynchronously
        this.arrowclass='fa-angle-right';
        this._processBar =processBar;
        this.scope = $scope;
        $('body').find('.process-bar-wrap').hide();


        //model show or close
        this.mainModel=true;
        this.daccountInfoModal = false;
        this.walletModal = false;
        this.walletModalMobileApps= false;
        this.addAccountModal=false;


        this.selectedWallet = "";
        if (this._storage.wallets) {
            this.selectedWallet = this._storage.wallets[0];
        }

        // DIM Wallet Selector features
        this.isWalletSelectorDisplayed = false;

        // setup wallet selector when no state parameters are passed
        this.selectedWalletLabel = this._storage.wallets && this._storage.wallets.length ? this._storage.wallets[0].name : "";

        // If no wallet show alert and redirect to home
        if (!this._Wallet.current) {
            this._Alert.noWalletLoaded();
            this._location.path('/');
            return;
        }
        // Available languages
        this.languages = AppConstants.languages;
        this.selectOption = AppConstants.selectOption;

        // Hide private key field by default
        this.showPrivateKeyField = false;
        this.isColorSelectorDisplayed=false;
        this.isLanguageSelectorDisplayed=false

        // Empty default label for added account
        this.newAccountLabel = "";

        // Check number of accounts in wallet to show account selection in view
        this.checkNumberOfAccounts();

        // Object to contain our password & private key data.
        this.common = {
            'password': '',
            'privateKey': ''
        };
        // Wallet types
        this.walletTypes = [{
            "type": 1,
            "key" : 'ACCOUNT_ACCOUNT_INFORMATION'
        }, {
            "type": 2,
            "key" : 'ACCOUNT_EXPORT_MOBILE'
        },{
            "type": 3,
            "key" : 'GENERAL_PRIVATE_KEY'
        },{
            "type": 4,
            "key" : 'ACCOUNT_BACKUP_WALLET'
        },{
            "type": 5,
            "key" : 'SETTING'
        }];

        // Default is "create a new wallet" (PRNG)
        if (this._$state.params.slug) {
            this._selectedType = this.walletTypes[this._$state.params.slug];
            this.walletkey = this._selectedType.type;
        } else {
          this._selectedType = this.walletTypes[0];
            this.walletkey=this._selectedType.type;
        }

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

        //theme Color
        this.themeColor=[{
          "type":'blue',
          "key":'DEFAULT_SCREEN'
        },{
          "type":'orange',
          "key":'ORANGE'
        },{
          "type":'blue',
          "key":'BLUE'
        },{
          "type":'default',
          "key":'GREY'
        }/*,{
          "type":'nightview',
          "key":'NIGHT_VIEW'
        }*/];
        if(this._storage.themes){
          this.selectedColor=this._storage.themes;
        }else {
          this.selectedColor=this.themeColor[0];
        }

        // Account info model for QR
        this.accountInfoModelQR = {
            "v": this._Wallet.network === Network.data.Testnet.id ? 1 : 2,
            "type": 1,
            "data": {
                "addr": this._Wallet.currentAccount.address,
                "name": this._Wallet.current.name
            }
        }

        // Generate QR using kjua lib
        this.encodeQrCode = function(text, type) {
            let qrCode = kjua({
                size: 256,
                text: text,
                fill: '#000',
                quiet: 0,
                ratio: 2,
            });
            if (type === "wallet") {
                $('#exportWalletQR').append(qrCode);
            } else if (type === "mobileWallet") {
                $('#mobileWalletForm').html("");
                $('#mobileWalletQR').append(qrCode);
            } else {
                $('#accountInfoQR').append(qrCode);
            }
        }

        // Stringify the wallet object for QR
        this.walletString = JSON.stringify(this.WalletModelQR);
        // Stringify the account info object for QR
        this.accountString = JSON.stringify(this.accountInfoModelQR);
        // Generate the QRs
        this.encodeQrCode(this.walletString, "wallet");
        this.encodeQrCode(this.accountString, "accountInfo");

        this._$translate.use(this._storage.lang.key);
        this.selectOption = this._storage.lang;
        //console.log("this.selectOption",this._storage.lang);

        $(function() {
          $(["/images/account.png",
          "/images/select-down .png",
          "/images/info-o.png",
          "/images/qr-code-o-big.png",
          "/images/close-o.png",
          "/images/account.png",]).preload();
        });
    }

    /**
     * changeWalletType() Change the selected wallet type
     *
     * @param type: Type number
     */
    changeWalletType(type) {
        this._selectedType = this.walletTypes[type -1];
        this.walletkey =this._selectedType.type;
        $('body').find('.process-bar-wrap').hide();

    }
    /**
     * Generate the mobile wallet QR
     */
    generateWalletQR() {
      this.arrowclass='fa-refresh fa-spin';
      this._processBar.start();
      this._$timeout(() => {
            // Decrypt/generate private key and check it. Returned private key is contained into this.common
            if (!CryptoHelpers.passwordToPrivatekeyClear(this.common, this._Wallet.currentAccount, this._Wallet.algo, false)) {
                this.arrowclass='fa-angle-right';
                this._processBar.complete();
                this._Alert.invalidPassword();
                this.showPrivateKeyField = false;
                return;
            } else if (!CryptoHelpers.checkAddress(this.common.privateKey, this._Wallet.network, this._Wallet.currentAccount.address)) {
                this._Alert.invalidPassword();
                this.arrowclass='fa-angle-right';
                this._processBar.complete();
                this.showPrivateKeyField = false;
                return;
            }

            let mobileKeys = CryptoHelpers.AES_PBKF2_encryption(this.common.password, this.common.privateKey)

            let QR = {
                "v": this._Wallet.network === Network.data.Testnet.id ? 1 : 2,
                "type":3,
                "data": {
                    "name": this._Wallet.current.name,
                    "priv_key": mobileKeys.encrypted,
                    "salt": mobileKeys.salt
                }
            };

            this.arrowclass='fa-angle-right';
            this._processBar.complete();
            let QRstring = JSON.stringify(QR);
            this.encodeQrCode(QRstring, "mobileWallet");
            this.clearSensitiveData();
          },1000);
    }

    /**
     * Reveal the private key
     */
    showPrivateKey() {
      this.arrowclass='fa-refresh fa-spin';
      this._processBar.start();
      this._$timeout(() => {

        // Decrypt/generate private key and check it. Returned private key is contained into this.common
        if (!CryptoHelpers.passwordToPrivatekeyClear(this.common, this._Wallet.currentAccount, this._Wallet.algo, true)) {
            this.arrowclass='fa-angle-right';
            this._processBar.complete();
            this._Alert.invalidPassword();
            this.showPrivateKeyField = false;
            return;
        } else if (!CryptoHelpers.checkAddress(this.common.privateKey, this._Wallet.network, this._Wallet.currentAccount.address)) {
            this.arrowclass='fa-angle-right';
            this._processBar.complete();
            this._Alert.invalidPassword();
            this.showPrivateKeyField = false;
            return;
        }
        this._processBar.complete();
        this.showPrivateKeyField = true;
        this.arrowclass='fa-angle-right';
        }, 1000);
    }

    /**
     * Change current account
     *
     * @param {number} accountIndex - The account index in the wallet.accounts object
     */
    changeCurrentAccount(accountIndex) {        //modelshow or close

        // Close the connector
        this._DataBridge.connector.close()
        this._DataBridge.connectionStatus = false;
        // Reset DataBridge service properties
        this._DataBridge.reset();
        // Set the selected account
        this._Wallet.setWalletAccount(this._Wallet.current, accountIndex);
        // Connect
        let connector = this._Connector.create({
            'uri': this._Wallet.node
        }, this._Wallet.currentAccount.address);
        this._DataBridge.openConnection(connector);
        // Redirect to dashboard
        this._location.path('/dashboard');
    }

    /**
     * Trigger download of the wallet
     *
     * @param {object} wallet - A wallet object
     */
    download(wallet) {
      //console.log('-->',wallet)
        if (!wallet) {
            this._Alert.errorWalletDownload();
            return;
        }
        // Wallet object string to word array
        let wordArray = CryptoJS.enc.Utf8.parse(JSON.stringify(wallet));
        // Word array to base64
        let base64 = CryptoJS.enc.Base64.stringify(wordArray);
        // Set download element attributes
        $("#downloadWallet").attr('href', 'data:application/octet-stream,' + base64);
        $("#downloadWallet").attr('download', wallet.name + '.wlt');
        // Simulate click to trigger download
        document.getElementById("downloadWallet").click();
    }

    /**
     * Check the number of accounts in wallet
     */
    checkNumberOfAccounts() {
        if (Object.keys(this._Wallet.current.accounts).length > 1) {
            this.moreThanOneAccount = true;
        }
    }
    /**
     * FOr Opening Model
     */
    ModalOpen(modelname,key){
      this.keytype=key;
        if(modelname=='daccountInfoModal' && key == 1){
            if(this.daccountInfoModal== true){
              this.daccountInfoModal=false;
              this.mainModel=true;
            }else{
              this.daccountInfoModal=true;
              this.mainModel=false;

            }

        }else if (modelname=='walletModal' && key == 2) {
              if(this.walletModal == true){
                this.walletModal=false;
                this.mainModel=true;


              }else{
                this.walletModal=true;
                this.mainModel=false;

              }

        }else if (modelname=='walletModalMobileApps' && key == 3) {
              if(this.walletModalMobileApps == true){
                this.walletModalMobileApps=false;
                this.mainModel=true;
              }else{
                this.walletModalMobileApps=true;
                this.mainModel=false;
              }
        }else if (modelname=='addAccountModal' && key == 4) {
              if(this.addAccountModal== true){
                this.addAccountModal=false;
                this.mainModel=true;
              }else{
                this.addAccountModal=true;
                this.mainModel=false;

              }
        }else if (modelname=='infopopup' && key == 5) {
              if(this.infopopup== true){
                this.infopopup=false;
                this.mainModel=true;
              }else{
                this.infopopup=true;
                this.mainModel=false;
              }
        }else if(modelname=='infopopup' && key == 6){
          if(this.infopopup== true){
            this.infopopup=false;
            this.mainModel=true;
          }else{
            this.infopopup=true;
            this.mainModel=false;
          }
        }else if(modelname=='infopopup' && key == 7){
          if(this.infopopup== true){
            this.infopopup=false;
            this.mainModel=true;
          }else{
            this.infopopup=true;
            this.mainModel=false;
          }
        }else if (modelname=='infopopup' && key == 8) {
          if(this.infopopup== true){
            this.infopopup=false;
            this.mainModel=true;
          }else{
            this.infopopup=true;
            this.mainModel=false;
         }
       }
    }
    /**
     * changeLanguage() Change app language
     *
     * @param key: language key
     */
    changeLanguage(key) {
        this.selectOption=key;
        this._$translate.use(key.key.toString());
        this._storage.lang=key;
    };
    /**
     * Add a new bip32 account into the wallet
     */
    addNewAccount() {
        // Decrypt/generate private key and check it. Returned private key is contained into this.common
        if (!CryptoHelpers.passwordToPrivatekeyClear(this.common, this._Wallet.current.accounts[0], this._Wallet.algo, false)) {
            this._Alert.invalidPassword();
            return;
        } else if (!CryptoHelpers.checkAddress(this.common.privateKey, this._Wallet.network, this._Wallet.current.accounts[0].address)) {
            this._Alert.invalidPassword();
            return;
        }
        // Current number of accounts in wallet + 1
        let newAccountIndex = Object.keys(this._Wallet.current.accounts).length;
        // Derive the account at new index
        CryptoHelpers.generateBIP32Data(this.common.privateKey, this.common.password, newAccountIndex, this._Wallet.network).then((data) => {
                let generatedAccount = data.address;
                let generatedPrivateKey = data.privateKey;
                // Generate the bip32 seed for the new account
                CryptoHelpers.generateBIP32Data(generatedPrivateKey, this.common.password, 0, this._Wallet.network).then((data) => {
                        this._$timeout(() => {
                            // Encrypt generated account's private key
                            let encrypted = CryptoHelpers.encodePrivKey(generatedPrivateKey, this.common.password);
                            // Build account object
                            let obj = {
                                "address": generatedAccount,
                                "label": this.newAccountLabel,
                                "child": data.publicKey,
                                "encrypted": encrypted.ciphertext,
                                "iv": encrypted.iv
                            };
                            // Set created object in wallet
                            this._Wallet.current.accounts[newAccountIndex] = obj;
                            // Update to show account selection
                            this.checkNumberOfAccounts();
                            // Show alert
                            this._Alert.generateNewAccountSuccess();
                            // Clean
                            this.clearSensitiveData();
                            // Hide modal
                            $("#addAccountModal").modal('hide');
                        }, 0)
                    },
                    (err) => {
                        this._$timeout(() => {
                            this._Alert.bip32GenerationFailed(err);
                            return;
                        }, 0);
                    });
            },
            (err) => {
                this._$timeout(() => {
                    this._Alert.derivationFromSeedFailed(err);
                    return;
                }, 0);
            });
    }

    /**
     * Reset the common object
     */
    clearSensitiveData() {
      this.arrowclass='fa-refresh fa-spin';
      this._processBar.start();
      this._$timeout(() => {
          this.common = {
            'password': '',
            'privateKey': ''
          };
          this._processBar.complete();
          this.showPrivateKeyField = false;
          this.newAccountLabel = "";
            this.arrowclass='fa-angle-right';
        }, 1000);
      }
    isColorSelector(){
      if(this.isColorSelectorDisplayed == true) this.isColorSelectorDisplayed=false; else this.isColorSelectorDisplayed=true;
    }
    isLanguageSelector(){
      if(this.isLanguageSelectorDisplayed == true) this.isLanguageSelectorDisplayed=false; else this.isLanguageSelectorDisplayed=true;
    }
    /**
    *Change background color
    */
    changeColor(key){
      this._storage.themes=key;
      this.selectedColor=key;
      this.isColorSelector();
      if($("body").find('.default')){
        $("body").removeClass('default')
        $("body").addClass(key.type);
      }
      if($("body").find('.orange')){
        $("body").removeClass('orange')
        $("body").addClass(key.type);

      }
      if($("body").find('.blue')){
        $("body").removeClass('blue')
        $("body").addClass(key.type);

      }
      if($("body").find('.nightview')){
        $("body").removeClass('nightview')
        $("body").addClass(key.type);
      }

    }

        /**
         * Display/Hide the DIM wallet selector in
         * the view template login.html
         */
        triggerWalletSelector() {
            this.isWalletSelectorDisplayed = !this.isWalletSelectorDisplayed;
        }

        /**
         * Select a wallet for the premium/vip login process.
         *
         * @param {*} wallet
         */
        triggerWalletSelected(wallet) {
            if (this.isWalletSelected(wallet)) {
                // unset selected wallet
                this.selectedWallet = "";
                this.selectedWalletLabel = "";
            }
            else {
                // set wallet
                this.selectedWallet = wallet;
                this.selectedWalletLabel = wallet.name;

                // re-trigger the selector so that it closes.
                this.triggerWalletSelector();
            }
        }

        /**
         * Whether a wallet has been selected or not.
         *
         * @param {*} wallet
         */
        isWalletSelected(wallet) {
            return this.selectedWallet != "" && this.selectedWallet.name == wallet.name;
        }


}

export default AccountCtrl;
