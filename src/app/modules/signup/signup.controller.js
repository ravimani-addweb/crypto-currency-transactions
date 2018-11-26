import CryptoHelpers from '../../utils/CryptoHelpers';
import Network from '../../utils/Network';
import helpers from '../../utils/helpers';
import KeyPair from '../../utils/KeyPair';
import Address from '../../utils/Address';

class SignupCtrl {
    constructor(AppConstants, $state, Alert, WalletBuilder, $localStorage, $timeout, $location, Wallet, Connector, DataBridge, $scope, $http, $filter, processBar) {
        'ngInject';

        //Local storage
        this._storage = $localStorage;
        // Alert service
        this._Alert = Alert;
        // WalletBuilder service
        this._WalletBuilder = WalletBuilder;
        // $state for redirect
        this._$state = $state;
        //scope
        this._scope = $scope;
        // App constants
        this._AppConstants = AppConstants;
        // $timeout to digest asynchronously
        this._$timeout = $timeout;
        // Wallet service
        this._Wallet = Wallet;
        // $location for redirect
        this._location = $location;
        // $filter
        this._$filter = $filter;
        // Signup properties
        // Connector
        this._Connector = Connector;
        // DataBridge service
        this._DataBridge = DataBridge;
        // HTTP service
        this.$http = $http;
        //Loder for loading
        this.arrowclass='fa-angle-right';
        $('body').find('.process-bar-wrap').hide();
        this.flag = 0;
        this._processBar =processBar;

        this.network = this._AppConstants.defaultNetwork;

        // All externamlink
        this.basicvideo = this._AppConstants.basicWallet_video;
        this.basicpdf = this._AppConstants.basicWallet_pdf;
        this.primiumvideo = this._AppConstants.primiumWallet_video;
        this.primiumpdf = this._AppConstants.primiumWallet_pdf;
        this.stepbip32 = this._AppConstants.steps_Bip32;
        this.viplist = this._AppConstants.vipWallet_priseList;

        // Available networks
        this.networks = Network.data;
        // Get wallets from local storage or create empty array
        this._storage.wallets = this._storage.wallets || [];
        // Needed to prevent user to click twice on send when already processing
        this.okPressed = false;

        // Force users to confirm they have account keys safe
        this.haveWalletFile = true;
        this.havePrivateKeySaved = false;
        //OpenModel as new Them
        this.infopopup = true;
        this.openAdialog = false;
        this.infopopupsubscribe=false;

        this.box = {};
        // this.box.password=false;
        // this.box.privkey=false;
        // this.box.walletfile=false;

        // Wallet data to show
        this.rawWallet = "";
        this.walletPrivateKey = "";
        this.currentWallet = "";
        this.subscriberEmail=""
        this.formData = {};
        //Default Tab/Option
        this.opt = AppConstants.opt;

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

        this.mainscreen = true;

        this.common = {
            'password': '',
            'privateKey': ''
        };
        $(function() {
            $(["/images/account.png",
            "/images/arrow-b.png",
            "/images/info-o.png",
            "/images/warning-o.png",
            "/images/download-o.png",
            "/images/download-o.png",
            "/images/wtl.file.png",
            "/images/arrrow_right.png",
            "/images/usb.png",
            "/images/secure-o.png",
            "/images/private-key-o.png",
            "/images/private-key.png",
            "/images/offline.png",
            "/images/finish-o.png"])
                .preload();
        });

    }

    /**
     * changeWalletType() Change the selected wallet type
     *
     * @param type: Type number
     */
    changeWalletType(type) {

        // Set wallet typeModalOpen
        this.mainscreen = true;
        this._selectedType = this.walletTypes[type - 1];
        this.walletkey=this._selectedType.type;

        this.childscreen = '';
        this.formData.walletName = "";
        this.formData.password = "";
        this.formData.confirmPassword = "";
        this.subscribeEmail = "";
        this._scope.passwordStrengthBrain = '';
        this._scope.passwordStrengthPremium = '';
        this._scope.passwordstrengthMessage = '';
        $('body').find('.process-bar-wrap').hide();
    };



    warnningsteps(type) {
        this.mainscreen = false;
        this.wallettype = type;
    };

    inforsteps(key) {
        this.wallettype = "comman";
        this.childscreen = key;
    };

    checkbasicform() {
        // Check form
        if (!this.formData || !this.formData.walletName || !this.formData.password || !this.formData.confirmPassword) {

            this._Alert.missingFormData();
            return;
        }

        // Check if wallet already loaded
        if (helpers.haveWallet(this.formData.walletName, this._storage.wallets)) {
            this._Alert.walletNameExists();
            return;
        }

        // Check if passwords match
        if (this.formData.password !== this.formData.confirmPassword) {
            this._Alert.passwordsNotMatching();
            return;
        }
    };

    /**
     * changeNetwork() Change wallet network
     *
     * @param network: Network id to use at wallet creation
     */
    changeNetwork(id) {
        if (id == Network.data.Mijin.id && this._AppConstants.mijinDisabled) {
            this._Alert.mijinDisabled();
            // Reset network to default
            this.network = this._AppConstants.defaultNetwork;
            return;
        } else if (id == Network.data.Mainnet.id && this._AppConstants.mainnetDisabled) {
            this._Alert.mainnetDisabled();
            // Reset network to default
            this.network = this._AppConstants.defaultNetwork;
            return;
        }
        // Set Network
        this.network = id;
    };

    /**
     * download() trigger download of the wallet
     *
     * @param wallet: Wallet object
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

    checkbasicform() {

    };

    downloadWallet() {
        this.download(this.currentWallet);
    };

    infoPass(flag, type, key){
        //console.log('Working on depot wallet',flag);
        this.basicwallet = key;
        this.infopopup = flag;
        this.wallettypes = type;
    };

    /**
     * createWallet() create a new PRNG wallet
     */
    createWallet() {
        // Check form
        this._processBar.start();
        this.arrowclass='fa-refresh fa-spin';
        this._$timeout(() => {
            if (!this.formData || !this.formData.walletName || !this.formData.password || !this.formData.confirmPassword) {
              this.arrowclass='fa-angle-right';
                this._processBar.complete();
              this.flag = 1;
              this._Alert.missingFormData();
              return;
            }else{ this.flag = 0;}
            if (!this.formData.password) {
              this.arrowclass='fa-angle-right';
              this._processBar.complete();
              this.flag = 1;
              this._Alert.badPasswordData2();
              return;
            }else{ this.flag = 0;}
            // Check if wallet already loaded
            if (helpers.haveWallet(this.formData.walletName, this._storage.wallets)) {
              this.arrowclass='fa-angle-right';
              this._processBar.complete();
              this.flag = 1;
              this._Alert.walletNameExists();
              return;
            }else{ this.flag = 0;}
            // Check if passwords match
            if (this.formData.password !== this.formData.confirmPassword) {
              this.arrowclass='fa-angle-right';
              this._processBar.complete();
              this.flag = 1;
              this._Alert.passwordsNotMatching();
                return;
              }else{ this.flag = 0;}
            if(this.flag == 0){
              this.createWalletPrivate();
            }
          }, 1000);
    };
    createWalletPrivate(){
    this._processBar.start();
      this.arrowclass='fa-refresh fa-spin';
            //if (this.network === Network.data.Mainnet.id && this.formData.password.length < 64) {
            //    this._Alert.premiumPasswordTooShort();
            //    return;
            //}
          this.okPressed = true;
          // Create the wallet from form data
      return this._WalletBuilder.createWallet(this.formData.walletName, this.formData.password, this.network)
             .then((wallet) => {
               this._$timeout(() => {
                    if (wallet) {
                      this.arrowclass = 'fa-angle-right';
                      this._processBar.complete();
                        // On success concat new wallet to local storage wallets
                        this._storage.wallets = this._storage.wallets.concat(wallet);
                        this.common.password = this.formData.password;
                        this.currentWallet = wallet;
                        // Wallet object string to word array
                        var wordArray = CryptoJS.enc.Utf8.parse(JSON.stringify(wallet));
                        // Word array to base64
                        this.rowfile = CryptoJS.enc.Base64.stringify(wordArray);

                        this._Alert.createWalletSuccess();
                        // Trigger download

                        // Set wallet data for view
                        this.rawWallet = this.encodeWallet(wallet);
                        // We need private key so we create a common object with the wallet password
                        let common = { "password": this.formData.password, "privateKey": "" };
                        // Decrypt account private key
                        if (!CryptoHelpers.passwordToPrivatekeyClear(common, wallet.accounts[0], wallet.accounts[0].algo, true)) {
                            this.walletPrivateKey = "Cannot get the private key..";
                        } else if (!CryptoHelpers.checkAddress(common.privateKey, wallet.accounts[0].network, wallet.accounts[0].address)) {
                            this.arrowclass='fa-angle-right';
                            this._processBar.complete();
                            this._Alert.invalidPassword();
                            this.walletPrivateKey = "Wallet address does not correspond to decrypted private key..";
                            // Enable send button
                            this.okPressed = false;
                            return;
                        } else {
                            // Set the decrypted private key
                            this.walletPrivateKey = common.privateKey;
                        }
                        // Unlock button
                        this.okPressed = false;

                         this.inforsteps(1);
                        // Reset form data
                        this.formData = "";
                        // Open modal and force user to backup data
                        // $('#safetyModal').modal({
                        //     backdrop: 'static',
                        //     keyboard: false
                        // });
                        this.openAdialog = true;

                    }
                  }, 1000);
            }, (err) => {
                this.arrowclass='fa-angle-right';
                this._processBar.complete();
                this._Alert.createWalletFailed(err);
                this.okPressed = false;
            });
    }
    /**
     * createBrainWallet() create a new brain wallet
     */
    createBrainWallet() {
        // Check form
        this._processBar.start();
        this.arrowclass='fa-refresh fa-spin';
        this._$timeout(() => {
          if (!this.formData || !this.formData.walletName || !this.formData.confirmPassword) {
              this.arrowclass='fa-angle-right';
                this._processBar.complete();
              this._Alert.missingFormData();
              return;
          }

          if (!this.formData.password) {
              this.arrowclass='fa-angle-right';
                this._processBar.complete();
              this._Alert.badPasswordData();
              return;
          }

          // Check if wallet already loaded
          if (helpers.haveWallet(this.formData.walletName, this._storage.wallets)) {
              this.arrowclass='fa-angle-right';
                this._processBar.complete();
              this._Alert.walletNameExists();
              return;
          }

          // Check if passwords match
          if (this.formData.password !== this.formData.confirmPassword) {
              this.arrowclass='fa-angle-right';
                this._processBar.complete();
              this._Alert.passwordsNotMatching();
              return;
          }

        //if (this.network === Network.data.Mainnet.id && this.formData.password.length < 64) {
        //    this._Alert.brainPasswordTooShort();
        //    return;
        //}
      //  debugger;
        this.okPressed = true;
        // Create the wallet from form data
        return this._WalletBuilder.createBrainWallet(this.formData.walletName, this.formData.password, this.network)
            .then((wallet) => {
                    if (wallet) {
                        // On success ccreateBrainWalletoncat new wallet to local storage wallets
                        this._storage.wallets = this._storage.wallets.concat(wallet);
                        this._Alert.createWalletSuccess();
                        // Trigger download
                        this.currentWallet = wallet;
                        //  this.download(wallet)
                        // Set wallet data for view
                        this.rawWallet = this.encodeWallet(wallet);
                        this.walletPrivateKey = CryptoHelpers.derivePassSha(this.formData.password, 6000).priv;
                        // Unlock button
                        this.okPressed = false;

                        // Reset form data
                        this.formData = "";
                        this.arrowclass='fa-angle-right';
                          this._processBar.complete();
                        this._$state.go("app.login", { 'slug': 0 });
                        // this.inforsteps(1);
                        // Open modal and force user to backup data
                        // $('#safetyModal').modal({
                        //     backdrop: 'static',
                        //     keyboard: false
                        // });
                        this.openAdialog = true;

                    }
            }, (err) => {
                this.arrowclass='fa-angle-right';
                  this._processBar.complete();
                this._Alert.createWalletFailed(err);
                this.okPressed = false;
            });
          }, 1000);
    };

    /**
     * createPrivateKeyWallet() create a new private key wallet
     */
    createPrivateKeyWallet() {
        // Check form
        if (!this.formData || !this.formData.walletName || !this.formData.password || !this.formData.confirmPassword || !this.formData.privateKey) {
            this._Alert.missingFormData();
            return;
        }

        // Check if wallet already loaded
        if (helpers.haveWallet(this.formData.walletName, this._storage.wallets)) {
            this._Alert.walletNameExists();
            return;
        }

        // Check if passwords match
        if (this.formData.password !== this.formData.confirmPassword) {
            this._Alert.passwordsNotMatching();
            return;
        }

        if (this.formData.privateKey.length === 64 || this.formData.privateKey.length === 66) {

            let kp = KeyPair.create(this.formData.privateKey);
            this.formData.address = Address.toAddress(kp.publicKey.toString(), this.network);

            this.okPressed = true;

            // Create the wallet from form data
            return this._WalletBuilder.createPrivateKeyWallet(this.formData.walletName, this.formData.password, this.formData.address, this.formData.privateKey, this.network)
                .then((wallet) => {
                    this._$timeout(() => {
                        if (wallet) {
                            // On success concat new wallet to local storage wallets
                            this._storage.wallets = this._storage.wallets.concat(wallet);
                            this._Alert.createWalletSuccess();
                            // Trigger download
                            this.download(wallet)
                                // Set wallet data for view
                            this.rawWallet = this.encodeWallet(wallet);
                            this.walletPrivateKey = this.formData.privateKey;
                            // Unlock button
                            this.okPressed = false;
                            // Reset form data
                            this.formData = "";
                            // Open modal and force user to backup data
                            $('#safetyModal').modal({
                                backdrop: 'static',
                                keyboard: false
                            });
                        }
                    }, 10);
                }, (err) => {
                    this._Alert.createWalletFailed(err);
                    this.okPressed = false;
                });
        } else {
            this._Alert.invalidPrivateKey();
        }
    };

    generateAddress() {
        if (undefined !== this.formData.privateKey && this.formData.privateKey.length) {
            if (this.formData.privateKey.length === 64 || this.formData.privateKey.length === 66) {
                let kp = KeyPair.create(this.formData.privateKey);
                this.formData.address = Address.toAddress(kp.publicKey.toString(), this.network);
            } else {
                this.formData.address = "";
                this._Alert.invalidPrivateKey();
            }
        }
    };

    /**
     * Redirect to login page
     */
    redirect() {
        if (this.box.password == undefined || this.box.password == false) {
            this._Alert.checkPasswordbox()
        } else if (this.box.walletfile == undefined || this.box.walletfile == false) {
            this.inforsteps(2);
        } else if (this.box.privkey == undefined || this.box.privkey == false) {
            this.inforsteps(4);
        } else if (this.box.password == true && this.box.walletfile == true && this.box.privkey == true) {
            this._$state.go("app.login", { 'slug': 1 });
        }
    };

    /**
     * Encode a wallet object to base 64
     */
    encodeWallet(wallet) {
        // Wallet object string to word array
        var wordArray = CryptoJS.enc.Utf8.parse(JSON.stringify(wallet));
        // Word array to base64
        return CryptoJS.enc.Base64.stringify(wordArray);
    };

    closePop() {
        if (this.openAdialog == true) {
            this.openAdialog = false;
        } else {
            this.openAdialog = true;
        }
    };

    downloadPK() {
        var pk = this.walletPrivateKey;
        var wallet = this.currentWallet;

        // Set download element attributes
        $("#downloadPK").attr('href', 'data:application/text,' + pk);
        $("#downloadPK").attr('download', wallet.name + '.txt');

        // Simulate click to trigger download
        document.getElementById("downloadPK").click();
    };

    subscribeVIP() {
    this._processBar.start();
      this.arrowclass='fa-refresh fa-spin';
      this._$timeout(() =>  {
          if(this.subscriberEmail == ''){
            this._processBar.complete();
              // this.arrowclass='fa-angle-right';
              this._Alert.emailRequired();
              return;
          }

          if (!this.subscriberEmail) {
            this._processBar.complete();
              // this.arrowclass='fa-angle-right';
              this._Alert.emailNotValid();
              return;
          }
          else {
              var req = {
                  method: 'POST',
                  url: "/vip/subscribe",
                  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                  transformRequest: function(obj) {
                      // http_build_query ..

                      var str = [];
                      for (var p in obj)
                          str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));

                      return str.join("&");
                  },
                  data: { email: this.subscriberEmail }
              };
              //console.log("[DEBUG] Now sending POST with: ", req);

              this.$http(req).then(function(data) {
                  // this.arrowclass='fa-angle-right';
                  this._processBar.complete();
                  //console.log("Success: ", data);
                  this.infoPass(false,'vip','');
                  this.subscriberEmail="";
              }, function(data) {
                  // this.arrowclass='fa-angle-right';
                  this._processBar.complete();
                  //console.log("Error: ", data);
                  //console.log('Working on depot wallet');
              });
          }
        }, 1000);
      };

}
export default SignupCtrl;
