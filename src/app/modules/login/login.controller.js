import helpers from '../../utils/helpers';
import convert from '../../utils/convert';
import CryptoHelpers from '../../utils/CryptoHelpers';
import KeyPair from '../../utils/KeyPair';
import Network from '../../utils/Network';
import Address from '../../utils/Address';

class LoginCtrl {
    constructor($localStorage, $state, $location, $scope, Alert, Wallet, $timeout, AppConstants, Connector, DataBridge, WalletBuilder, processBar) {
        'ngInject';



        // Local storage
        this._storage = $localStorage;
        // $location for redirect
        this._location = $location;
        // Alert service
        this._Alert = Alert;

        this._processBar =processBar;
        // $state for redirect
        this._$state = $state;
        // Wallet service
        this._Wallet = Wallet;
        // WalletBuilder service
        this._WalletBuilder = WalletBuilder;
        // $timeout to digest asynchronously
        this._$timeout = $timeout;
        // Application constants
        this._AppConstants = AppConstants;
        // Connector
        this._Connector = Connector;
        // DataBridge service
        this._DataBridge = DataBridge;
        //Loder for loading
        this.arrow=false;
        this.arrowclass='fa-angle-right';
        $('body').find('.process-bar-wrap').hide();

        this.scope = $scope;
        this.scope.processStentg='';
        // Get wallets from local storage or create empty array
        this._storage.wallets = this._storage.wallets || [];
        //this._storage.premium = this.noBasicWallets() || [];
        this._storage.premium = this._storage.wallets || [];
        this._storage.vips    = this.noBasicWallets() || [];

        // this.brainwallet = [];
        // this.primiumwallet = [];
        this.selectedWallet = ""
        if (this._storage.wallets) {
            this.selectedWallet = this._storage.wallets[0];
        }

        // DIM Wallet Selector features
        this.isWalletSelectorDisplayed = false;

        // setup wallet selector when no state parameters are passed
        this.selectedWalletLabel = this._storage.wallets && this._storage.wallets.length ? this._storage.wallets[0].name : "";

        // Wallet types
        this.walletTypes = [{
            "type": 1,
            "key" : 'BASIC_WALLET'
        }, {
            "type": 2,
            "key" : 'PREMIUM_WALLET'
        }, {
            "type": 3,
            "key" : 'VIP_WALLET'
        }];
        // Default is "create a new wallet" (PRNG)
        if (this._$state.params.slug) {
            this._selectedType = this.walletTypes[this._$state.params.slug];
            this.walletkey = this._selectedType.type;
        } else {
          this._selectedType = this.walletTypes[0];
            this.walletkey=this._selectedType.type;
        }

        // Object to contain our password & private key data.
        this.common = {
            'password': '',
            'privateKey': ''
        };

        $(function() {
            $(["/images/depotwallet-white-transp.png", "/images/logomark.png","/images/login.png"])
                .preload();
        });

        //$timeout(function() {
        //    $('[data-toggle="tooltip"]').tooltip()
        //});
    }

    /**
     * Return premium wallets only for the <select> in login screen.
     *
     * `this._storage.wallet` is not affected by this filtering mechanism!
     *
     * @return {array}
     */
    noBasicWallets() {
        let filtered = [];
        for (let i = 0; i < this._storage.wallets.length; i++) {
            let w = this._storage.wallets[i];
            if (w.accounts[0].algo == "pass:6k")
                continue;

            filtered.push(w);
        }

        return filtered;
    }

    /**
     * loadWallet() Load the wallet in app and store in local storage
     *
     * @param data: base64 data from .wlt file
     * @param: isNCC: true if NCC wallet, false otherwise
     */
    loadWallet(data, isNCC) {
        if (!data) {
            this._Alert.noWalletData();
            return;
        }
        let wallet;
        if (isNCC) {
            // NCC wallet
            wallet = JSON.parse(data);
        } else {
            // Wallet base64 to word array
            let parsedWordArray = CryptoJS.enc.Base64.parse(data);
            // Word array to wallet string
            let walletStr = parsedWordArray.toString(CryptoJS.enc.Utf8);
            // Wallet string to JSON object
            wallet = JSON.parse(walletStr);
        }

        //check if already present
        if (helpers.haveWallet(wallet.name, this._storage.wallets)) {
            this._Alert.walletNameExists();
        } else {
            // Set wallet in local storage
            this._storage.wallets = this._storage.wallets.concat(wallet);
            this._Alert.loadWalletSuccess();
            this.selectedWallet = this._storage.wallets[0];

        }
    }
    /**
     * This method lets people authenticate to Brain Wallets (DIM Basic Wallet).
     *
     * It will automatically generate/build the wallet in case it is not present
     * in the localStorage before login.
     *
     * Technically, only an *empty password* will be refused access here.
     *
     * @param {String} pw
     */
    loginBasic() {
      this._processBar.start();
      this.arrowclass='fa-refresh fa-spin';
        this._$timeout(() => {
          if (!CryptoHelpers.passwordToPrivatekeyClear(this.common, {}, "pass:6k", false)) {
            this._processBar.complete();
              this.arrowclass='fa-angle-right';
              this._Alert.invalidPassword();
              this.okPressed = false;

              return false;
          } else {
            this.arrowclass='fa-refresh fa-spin';

              // Basic Wallet login DONE.
              // We will now either use a loaded wallet or automatically
              // load the brain wallet in storage for the user.

              // derive private key from password (brainwallet algorithm)
              var r = CryptoHelpers.derivePassSha(this.common.password, 6000);
              this.okPressed = true;

              // generate keypair to retrieve NEM address
              var kp = KeyPair.create(r.priv);
              var address = Address.toAddress(kp.publicKey.toString(), this._AppConstants.defaultNetwork);

              // first check if we have this wallet in private storage
              // search by address
              var wallet = false;
              var fnd = false;
              for (var i = 0; i < this._storage.wallets.length; i++) {
                this.arrow=true;
                  var iterator = this._storage.wallets[i];
                  for (var j = 0; j < Object.keys(iterator.accounts).length; j++) {
                      var acct = iterator.accounts[j];
                      if (acct.address === address) {
                          // wallet already loaded in storage
                          wallet = iterator;
                          fnd = true;
                          break;
                      }
                  }
                  if (fnd) break;
              }


              this.arrowclass='fa-refresh fa-spin';

              if (wallet !== false) {
                  // Login with already-stored wallet (faster)
                  return this.successLogin(wallet);
              }

              return this.createBasicWallet(address);
          }
        },1000);
    }

    /**
     * This method will set a wallet as selected. It will then
     * clear sensitive data (password/private key), connect to
     * the NEM node and redirect to user to /dashboard.
     *
     * @param {Wallet} wallet
     */
    successLogin(wallet) {
        this._Wallet.setWallet(wallet);

        // always warn about weak Basic Wallets on dashboard
        // If basic wallet pass is weak
        let isWeakPass = false;
        if (wallet.accounts[0].network === Network.data.Mainnet.id
            && wallet.accounts[0].algo === 'pass:6k'
            && this.common.password.length < 64) {
            isWeakPass = true;
            //this._Alert.brainWalletUpgrade();
        }

        // Clean data
        this.clearSensitiveData();
        // Connect to node
        this.connect();
        // Redirect to dashboard
        this._processBar.complete();
        this.arrowclass='fa-angle-right';
        let path = "/dashboard";
        if (isWeakPass)
            path = "/account-upgrade";
        this._$timeout(() => {
          this._location.path(path);
        },1000);
    }

    /**
     * login() Log into the application if no need to upgrade
     *
     * @param wallet: Wallet object
     */
    login(wallet) {
          this.arrowclass='fa-refresh fa-spin';
          this._processBar.start();

        this._$timeout(() => {

        if (!wallet) {
          this.arrowclass='fa-angle-right';
          this._processBar.complete();
            this._Alert.cantLoginWithoutWallet();
            return;
        }
        // If mainnet disabled
        if (wallet.accounts[0].network === Network.data.Mainnet.id && this._AppConstants.mainnetDisabled) {
          this.arrowclass='fa-angle-right';
          this._processBar.complete();
            this._Alert.mainnetDisabled();
            return;
        }
        // If mijinnet disabled
        if (wallet.accounts[0].network === Network.data.Mijin.id && this._AppConstants.mijinDisabled) {
          this.arrowclass='fa-angle-right';
          this._processBar.complete();
            this._Alert.mijinDisabled();
            return;
        }
        // Check if the wallet have child or upgrade
        if (wallet.accounts[0].child) {
            //console.log('this.common', this.common)

            // Decrypt/generate private key and check it. Returned private key is contained into this.common
            if (!CryptoHelpers.passwordToPrivatekeyClear(this.common, wallet.accounts[0], wallet.accounts[0].algo, false)) {
              this.arrowclass='fa-angle-right';
              this._processBar.complete();
                this._Alert.invalidPassword();
                // Enable send button
                this.okPressed = false;
                return;
            } else if (!CryptoHelpers.checkAddress(this.common.privateKey, wallet.accounts[0].network, wallet.accounts[0].address)) {
              this.arrowclass='fa-angle-right';
              this._processBar.complete();
                this._Alert.invalidPassword();
                // Enable send button
                this.okPressed = false;
                return;
            }

            // Login SUCCESS
            return this.successLogin(wallet);
        } else {
            // Open upgrade modal
            $("#upgradeWallet").modal({
                keyboard: false
            });
        }
      }, 1000);
    }

    /**
     * upgradeWallet() Derive a child account using bip32 for each accounts in the wallet
     */
    upgradeWallet() {
        // Loop through all accounts
        for (let i = 0; i < Object.keys(this.selectedWallet.accounts).length; i++) {
            // Decrypt/generate private key and check it. Returned private key is contained into this.common
            if (!CryptoHelpers.passwordToPrivatekeyClear(this.common, this.selectedWallet.accounts[i], this.selectedWallet.accounts[i].algo, false)) {
                this._Alert.invalidPassword();
                return;
            } else if (!CryptoHelpers.checkAddress(this.common.privateKey, this.selectedWallet.accounts[i].network, this.selectedWallet.accounts[i].address)) {
                this._Alert.invalidPassword();
                return;
            }
            // Generate bip32 data
            CryptoHelpers.generateBIP32Data(this.common.privateKey, this.common.password, 0, this.selectedWallet.accounts[i].network).then((data) => {
                    this._$timeout(() => {
                        // Add generated child to account
                        this.selectedWallet.accounts[i].child = data.publicKey;
                    });
                },
                (err) => {
                    this._$timeout(() => {
                        this._Alert.bip32GenerationFailed(err);
                        // Clean data
                        this.clearSensitiveData();
                        return;
                    }, 0)
                });
            // If last account
            if (i === Object.keys(this.selectedWallet.accounts).length - 1) {
                this._$timeout(() => {
                    this._Alert.upgradeSuccess();
                    // Hide modal
                    $("#upgradeWallet").modal('hide');
                    // Clean data
                    this.clearSensitiveData();
                    // Download wallet
                    this.download(this.selectedWallet);
                });
            }
        }
    }

    /**
     * download() Trigger download of the wallet
     *
     * @param wallet: Wallet object
     */
    download(wallet) {
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
     * clearSensitiveData() Reset the common object
     */
    clearSensitiveData() {
            this.common = {
                'password': '',
                'privateKey': ''
            };
        }
        /**
         * () Change the selected wallet type
         *
         * @param type: Type number
         */
    changeWalletType(type) {
        // Set wallet typeModalOpen
        this._selectedType = this.walletTypes[type - 1];
        this.common.password = "";
        this.walletkey=this._selectedType.type;
        $('body').find('.process-bar-wrap').hide();

        //console.log('event2');
        //$(function() {
        //  $('select').selectric();
        //});
    }

    /**
     * connect() Open connection to default node
     */
    connect() {
            let connector = this._Connector.create({
                'uri': this._Wallet.node
            }, this._Wallet.currentAccount.address);
            this._DataBridge.openConnection(connector);
    }

    /**
     * Redirect to login page
     */
    redirect() {
        this._$state.go("app.recover");
    }

    /**
     * This method *creates* a basic wallet *on the fly*. This means
     * that the browser resources will be used to derive the brain wallet
     * password and it might take some time.
     *
     * This has now been disabled such that only *loaded* Basic Wallets
     * can be logged in to.
     *
     * @param   {string}    address
     */
    createBasicWallet(address) {
        // Login action will *build* wallet
        var rand = CryptoHelpers.randomKey();
        rand     = convert.ua2hex(rand);
        var name = "basic-" + address.substr(0, 6) + "-" + rand.substr(0, 4);

        return this._WalletBuilder.createBrainWallet(name, this.common.password, this._AppConstants.defaultNetwork)
            .then((wallet) => {
                this._$timeout(() => {
                    if (wallet) {
                        return this.successLogin(wallet);
                    }
                });
            }, (err) => {
                this._Alert.createWalletFailed(err);
                this.okPressed = false;

                return false;
            });
    }

    // selectrick(){
    //   console.log('inited.....1');
    //
    // }
    // ngAfterViewInit(){
    //     console.log('inited.....');
    //     this.selectrick();
    // }

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

export default LoginCtrl;
