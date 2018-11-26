import helpers from '../../utils/helpers';
import CryptoHelpers from '../../utils/CryptoHelpers';
import Network from '../../utils/Network';
import KeyPair from '../../utils/KeyPair';
import Address from '../../utils/Address';
class RecoverCtrl {
    constructor($localStorage,$state, $location, Alert, Wallet, $timeout, AppConstants, Connector, DataBridge, WalletBuilder, processBar) {
        'ngInject';

        this._storage = $localStorage;
        // $location for redirect
        this._location = $location;
        // Alert service
        this._Alert = Alert;
        // WalletBuilder service
        this._WalletBuilder = WalletBuilder;
          // $state for redirect
        this._$state=$state;
        // Wallet service
        this._Wallet = Wallet;
        // $timeout to digest asynchronously
        this._$timeout = $timeout;
        // Application constants
        this._AppConstants = AppConstants;
        // Connector
        this._Connector = Connector;
        // Signup properties
        this.network = this._AppConstants.defaultNetwork;
        // Available networks
        this.networks = Network.data;
        // DataBridge service
        this._DataBridge = DataBridge;
        this.flagprivatekey=true;
        this.commo={};
        this.infopopup=true;

        //Loder for loading
        this.arrowclass='fa-angle-right';
        $('body').find('.process-bar-wrap').hide();
        this._processBar =processBar;

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
        this.formData = "";
    }

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
    }
    generateAddress() {
        if(undefined !== this.formData.privateKey && this.formData.privateKey.length) {
            if (this.formData.privateKey.length === 64 || this.formData.privateKey.length === 66) {
                let kp = KeyPair.create(this.formData.privateKey);
                this.formData.address = Address.toAddress(kp.publicKey.toString(), this.network);
            } else {
                this.formData.address = "";
                this._Alert.invalidPrivateKey();
            }
        }
    }
    checkprivatekey(){
      //console.log(pw)
      var flag=0;
      //console.log('this.privateKey',this.privateKey)
      // this.common.privateKey=this.privateKey;
      this.common.privateKey=this.formData.privateKey;
     //console.log('this.common',this.common);
      //console.log('this._storage.wallets',this._storage.wallets);
        for(let i = 0; i < this._storage.wallets.length; i++){
            if (!CryptoHelpers.passwordToPrivatekeyClear(this.common,  this._storage.wallets[i].accounts[0],  this._storage.wallets[i].accounts[0].algo, false)) {
                flag = 1;
                //this._Alert.invalidPassword();
                // Enable send button
                //this.okPressed = false;
                // return;
            } else if (!CryptoHelpers.checkAddress(this.common.privateKey, this._storage.wallets[i].accounts[0].network, this._storage.wallets[i].accounts[0].address)) {
               flag = 2;
               //this._Alert.invalidPassword();
              // Enable send button
               //this.o_AlertkPressed = false;
              //  return;
           }else{
              // Set the wallet object in Wallet service
              //  this._Wallet.setWallet(this._storage.wallets[i]);
              //console.log(this.privateKey,"==", this.common.privateKey)
              if(this.privateKey == this.common.privateKey){
                this.wallet=this._storage.wallets[i];
                this.download(this.wallet);
                //console.log('This wallet is :',this._storage.wallets[i])
                return;
                }else{
                  flag=1;
                }
              //this.walletname=this.wallet.name;
              //  // Clean data
              //  this.clearSensitiveData();
              //  // Connect to node
              //  this.connect();
              //  // Redirect to dashboard
              //  this._location.path('/dashboard');
              //flag = 0;

           }
        }
        if(flag ==1){
          this._Alert.invalidPassword();
          this.okPressed = false;
        }else if(flag == 2){
          this._Alert.invalidPassword();
          this.okPressed = false;

        }
    }
    changenext(){
      if(this.flagprivatekey==true){
        this.flagprivatekey=false;
      } else {
        this.flagprivatekey=true;
      }
    }
    popup() {
      if (this.infopopup == true) {
        this.infopopup=false;
      }else {
        this.infopopup=true;
      }
    }

    /**
     * createPrivateKeyWallet() create a new private key wallet
     */
    createPrivateKeyWallet() {
            // Check form
            this._processBar.start();
            this.arrowclass='fa-refresh fa-spin';
            this._$timeout(() => {
            if (!this.formData || !this.formData.walletName || !this.formData.password || !this.formData.confirmPassword || !this.formData.privateKey) {
                this._processBar.complete();
                this.arrowclass='fa-angle-right';
                this._Alert.missingFormData();
                return;
            }

            // Check if wallet already loaded
            if (helpers.haveWallet(this.formData.walletName, this._storage.wallets)) {
                this._processBar.complete();
                this.arrowclass='fa-angle-right';
                this._Alert.walletNameExists();
                return;
            }

            // Check if passwords match
            if (this.formData.password !== this.formData.confirmPassword) {
                this._processBar.complete();
                this.arrowclass='fa-angle-right';
                this._Alert.passwordsNotMatching();
                return;
            }

            if (this.formData.privateKey.length === 64 || this.formData.privateKey.length === 66) {

                let kp = KeyPair.create(this.formData.privateKey);
                this.formData.address = Address.toAddress(kp.publicKey.toString(), this.network);

                this.okPressed = true;
                  //console.log('this.formData.privateKey',this.formData.privateKey)
                  //this.checkprivatekey();
                // Create the wallet from form data
                return this._WalletBuilder.createPrivateKeyWallet(this.formData.walletName, this.formData.password, this.formData.address, this.formData.privateKey, this.network).then((wallet) => {
                        if (wallet) {
                            // On success concat new wallet to local storage wallets
                            this._storage.wallets = this._storage.wallets.concat(wallet);
                            this._Alert.createWalletSuccess();
                            // Trigger download
                            this._processBar.complete();
                            this.arrowclass='fa-angle-right';
                            this.download(wallet)
                            this.formData = "";
                            // Set wallet data for view
                            this.rawWallet = this.encodeWallet(wallet);
                            this.walletPrivateKey = this.formData.privateKey;
                            // Unlock button
                            this.okPressed = false;
                            // Reset form data
                            this.arrowclass='fa-angle-right';

                            // Open modal and force user to backup data
                            // $('#safetyModal').modal({
                            //   backdrop: 'static',
                            //   keyboard: false
                            // });
                        }
                },
                (err) => {
                    this._processBar.complete();
                    this.arrowclass='fa-angle-right';
                    this._Alert.createWalletFailed(err);
                    this.okPressed = false;
                });
            } else {
                this.arrowclass='fa-angle-right';
                this._Alert.invalidPrivateKey();
            }
          }, 1000);
    }


}
export default RecoverCtrl;
