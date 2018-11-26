import Network from '../../utils/Network';
import helpers from '../../utils/helpers';
import Nodes from '../../utils/nodes';

class NodeCtrl {
    constructor(AppConstants, Alert, $localStorage, Wallet, $scope, $location, Connector, DataBridge, $filter) {
        'ngInject';
        // Navbar app name
        this.appName = AppConstants.appName;
        // Application constants
        this._AppConstants = AppConstants;
        // Local storage
        this._storage = $localStorage;
        // Alert service
        this._Alert = Alert;

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

        this.isnodeselect=false;

        // Set nodes for current and selected
        this.currentNode = undefined;
        this.customNode = undefined;

        //console.log(Wallet.current,'this.nodes',Nodes.mainnetNodes);


        /**
         * Watch if a wallet is set and set the right nodes
         */
        // $scope.$watch('Wallet.current', (val) => {
        //   console.log('#######2>',val);
        //
        //     if (!val) {
        //         return;
        //     }
        if (!this._Wallet.current) {
            this._Alert.noWalletLoaded();
            this._$location.path('/');
        }
        else{

            // Show right nodes list according to network
            if (Wallet.network == Network.data.Mainnet.id) {
                this.nodes = Nodes.mainnetNodes;
                //console.log('this.nodes',this.nodes);
            } else if (Wallet.network == Network.data.Testnet.id) {
                this.nodes = Nodes.testnetNodes;
            } else {
                this.nodes = Nodes.mijinNodes;
            }

            // Get default node
            this.currentNode = Wallet.node;

            // Set wallet name
            this.walletName = Wallet.name;
        //  });
      }

        /**
         * Fix dropdown closing if click on select
         */
        $(document).on('click', '.navbar .container-fluid li .dropdown-menu', function(e) {
            e.stopPropagation();
        });
    }
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
    isSelectNode(){
      if(this.isnodeselect == true){
        this.isnodeselect = false;
      }else{
        this.isnodeselect = true;  
      }
    }

}
export default NodeCtrl;
