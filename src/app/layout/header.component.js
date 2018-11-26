import Network from '../utils/Network';
import helpers from '../utils/helpers';
import Nodes from '../utils/nodes';

class AppHeaderCtrl {
    constructor(AppConstants, Alert, $localStorage, $translate, Wallet, $scope, $location, Connector, DataBridge, $filter) {
        'ngInject';

        // Navbar app name
        this.appName = AppConstants.appName;
        // Application constants
        this._AppConstants = AppConstants;
        // Local storage
        this._storage = $localStorage;
        // Alert service
        this._Alert = Alert;
        // Translation service
        this._$translate = $translate;
        // Wallet service
        this._Wallet = Wallet;
        // Connector service
        this._Connector = Connector;
        // DataBridge service
        this._DataBridge = DataBridge;
        // $location to redirect
        this._$location = $location;
        // Filters
        this._$filter = $filter;
        // menu
        // this.toggelmenu="top-right-menu-close";
        // Set nodes for current and selected
        this.currentNode = undefined;
        this.customNode = undefined;
        this.langBox=false;

        this.submenulogin=false;
        this.submenusignup=false;
        this.submenuaccount=false;
        this.submenutransfer=false;
        this.arrow='down-arrow';
        // Available languages
        this.languages = AppConstants.languages;
        //console.log("this.selectOption",this.selectOption);

        /**
         * Watch if a wallet is set and set the right nodes
         */
        $scope.$watch('Wallet.current', (val) => {
            if (!val) {
                return;
            }
            // Show right nodes list according to network
            if (Wallet.network == Network.data.Mainnet.id) {
                this.nodes = Nodes.mainnetNodes;
            } else if (Wallet.network == Network.data.Testnet.id) {
                this.nodes = Nodes.testnetNodes;
            } else {
                this.nodes = Nodes.mijinNodes;
            }

            // Get default node
            this.currentNode = Wallet.node;

            // Set wallet name
            this.walletName = val.name;
        });

        /**
         * Fix dropdown closing if click on select
         */
        $(document).on('click', '.navbar .container-fluid li .dropdown-menu', function(e) {
            e.stopPropagation();
        });

        $(".navbar-toggle").click(function(){
          $(".top-right-menu").slideToggle();
        });
        $(document).on('click', '.navbar-nav li a', function(e) {
          if($(window).width()<=1200){
            $(".top-right-menu").slideToggle();
          }
        });
        $(document).on('change', '#languageschange', function(e) {
          if($(window).width()<=1200){
            $(".top-right-menu").slideToggle();
          }
        });

        $(function(){
          $('.responsive-list').click(function(){
            $(this).closest('.submenu-wallet').toggleClass('collapsed');
          });
        });

        // $( window ).resize(function(e){
        //   e.stopPropagation();
        //   if($(window).width()<=991){
        //     $(".top-right-menu").slideToggle();
        //   }
        // });
        if(this._storage.lang){
          this._$translate.use(this._storage.lang.key.toString());
          this.selectOption = this._storage.lang;
        }else{
          this.selectOption = AppConstants.selectOption;
          this._storage.lang= this.selectOption;
        }
        $(function() {
            $(["/images/logo-clean.png", "/images/logomark.png"])
                .preload();
        });
    }
    showSubnavlogin(){
        if(this.submenulogin == true) this.submenulogin=false; else this.submenulogin = true;
    }
    showSubnavsignup(){
      if(this.submenusignup == true) this.submenusignup=false; else this.submenusignup = true;
    }
    showSubnavaccount(){
      if(this.submenuaccount == true) this.submenuaccount=false; else this.submenuaccount = true;
    }
    showSubnavtransfer(){
      if(this.submenutransfer == true) this.submenutransfer=false; else this.submenutransfer = true;
    }
    /**
    * menuToggele() for responcive menu
    */
    // menuToggele(){
    //     if(this.toggelmenu=="top-right-menu-open"){
    //       this.toggelmenu="top-right-menu-close";
    //     }else{
    //       this.toggelmenu="top-right-menu-open";
    //     }
    // }

    /**
     * purge() Reset data from localstorage
     */
    purge() {
        if (confirm(this._$filter('translate')('HEADER_PURGE_MESSAGE')) == true) {
           this._storage.wallets = [];
            this._Alert.successPurge();
        } else {
            this._Alert.purgeCancelled();
        }
    }

    /**
     * logout() Delete current wallet stored in Wallet service and redirect to home logged out
     */
    logout() {
        // Close connector
        this._DataBridge.connector.close();
        // Set connection status to false
        this._DataBridge.connectionStatus = false;
        // Show success alert
        this._Alert.successLogout();
        // Reset data in DataBridge service
        this._DataBridge.reset();
        // Reset data in Wallet service
        this._Wallet.reset();
        // Redirect to home
        this._$location.path('/');
    }

    /**
     * changeLanguage() Change app language
     * @param key: language key
     */
    changeLanguage(key) {
      this.selectOption=key;
      this._storage.lang=key;
      this._$translate.use(key.key.toString());
    };

    /**
     * changeNode() Change node and store it in local storage
     *
     * @param node: node uri
     */
    changeNode(node) {
        if (!node) {
            this._Alert.noNodeSet();
            return;
        }

        //Check and format url from user input
        let properNode = helpers.checkAndFormatUrl(node, this._AppConstants.defaultWebsocketPort.toString());
        if(!properNode) {
            this._Alert.invalidCustomNode();
            return;
        } else if(properNode === 1) {
            this._Alert.invalidWebsocketPort();
            return;
        }

        // Disconnect and connect to node
        this.reconnect(properNode);

        //Reset node values
        this.currentNode = properNode;
        this.customNode = undefined;

        // Set new node in Wallet service
        this._Wallet.node = properNode;

        // Set node in local storage according to network
        if (this._Wallet.network == Network.data.Mainnet.id) {
            this._storage.selectedMainnetNode = properNode;
        } else if (this._Wallet.network == Network.data.Testnet.id) {
            this._storage.selectedTestnetNode = properNode;
        } else {
            this._storage.selectedMijinNode = properNode;
        }
    }
    langSelectBox(){
      if(this.langBox==true){
        this.langBox=false;
      }else {
        this.langBox=true;
      }
    }
    /**
     * reconnect() Disconnect and connect to specified node
     *
     * @param node: node uri
     */
    reconnect(node) {
        // Close connector
        this._DataBridge.connector.close();
        this._DataBridge.connectionStatus = false;
        // Reset data in DataBridge service
        this._DataBridge.reset();
        // Connect
        let connector = this._Connector.create({
            'uri': node
        }, this._Wallet.currentAccount.address);
        this._DataBridge.openConnection(connector);
    }

}

let AppHeader = {
    controller: AppHeaderCtrl,
    templateUrl: 'layout/header.html'
};

export default AppHeader;
