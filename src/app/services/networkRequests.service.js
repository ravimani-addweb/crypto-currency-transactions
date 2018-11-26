import Nodes from '../utils/nodes';
import Network from '../utils/Network';

/** Service containing various API requests */
class NetworkRequests {

    /**
     * Initialize services and properties
     *
     * @param {service} $http - The angular $http service
     * @param {config} AppConstants - The Application constants
     * @param {service} Wallet - The Wallet service
     */
    constructor($http, AppConstants, Wallet) {
        'ngInject';

        /***
         * Declare services
         */
        this._$http = $http;
        this._AppConstants = AppConstants;
        this._Wallet = Wallet;
    }

    /**
     * Get port from network
     */
    getPort() {
        return this._Wallet.network === Network.data.Mijin.id ? this._AppConstants.defaultMijinPort : this._AppConstants.defaultNisPort;
    }

    /**
     * Gets the current height of the block chain.
     *
     * @param {string} host - An host ip or domain
     *
     * @return {number} - The current height on chosen endpoint
     */
    getHeight(host) {
        let port = this.getPort();
        return this._$http({
            url: "https://" + host + ":" + port + "/chain/height",
            method: 'GET'
        }).then(
            (res) => {
                return res.data.height;
            }
        );
    }

    /**
     * Gets the AccountMetaDataPair of an account.
     *
     * @param {string} host - An host ip or domain
     * @param {string} address - An account address
     *
     * @return {object} - An [AccountMetaDataPair]{@link http://bob.nem.ninja/docs/#accountMetaDataPair} object
     */
    getAccountData(host, address) {
    let port = this.getPort();
      let obj = {'params':{'address':address}};
        return this._$http.get('https://' + host + ':' + port + '/account/get', obj)
        .then(
            (res) => {
                return res.data;
            }
        );
    }

    /**
     * Gets an array of harvest info objects for an account.
     *
     * @param {string} host - An host ip or domain
     * @param {string} address - An account address
     *
     * @return {array} - An array of [HarvestInfo]{@link http://bob.nem.ninja/docs/#harvestInfo} objects
     */
    getHarvestedBlocks(host, address){
        let port = this.getPort();
        let obj = {'params':{'address':address}};
     return this._$http.get('https://' + host + ':' + port + '/account/harvests', obj)
        .then(
            (res) => {
                return res.data;
            }
        );
    }

    /**
     * Gets the namespace with given id.
     *
     * @param {string} host - An host ip or domain
     * @param {string} id - A namespace id
     *
     * @return {object} - A [NamespaceInfo]{@link http://bob.nem.ninja/docs/#namespace} object
     */
    getNamespacesById(host, id) {
        let port = this.getPort();
        let obj = {'params':{'namespace':id}};
        return this._$http.get('https://' + host + ':' + port + '/namespace', obj)
        .then(
            (res) => {
                return res.data;
            }
        );
    }

    /**
     * Gets an array of TransactionMetaDataPair objects where the recipient has the address given as parameter to the request.
     *
     * @param {string} host - An host ip or domain
     * @param {string} address - An account address
     * @param {string} txHash - A starting hash for search (optional)
     *
     * @return {array} - An array of [TransactionMetaDataPair]{@link http://bob.nem.ninja/docs/#transactionMetaDataPair} objects
     */
    getIncomingTxes(host, address, txHash){
        let port = this.getPort();
        let obj = {'params':{'address':address, 'hash': txHash}};
     return this._$http.get('https://' + host + ':' + port + '/account/transfers/incoming', obj)
        .then(
            (res) => {
                return res.data;
            }
        );
    }

     /**
     * Gets the array of transactions for which an account is the sender or receiver and which have not yet been included in a block.
     *
     * @param {string} host - An host ip or domain
     * @param {string} address - An account address
     *
     * @return {array} - An array of [UnconfirmedTransactionMetaDataPair]{@link http://bob.nem.ninja/docs/#unconfirmedTransactionMetaDataPair} objects
     */
    getUnconfirmedTxes(host, address){
        let port = this.getPort();
        let obj = {'params':{'address':address}};
     return this._$http.get('https://' + host + ':' + port + '/account/unconfirmedTransactions', obj)
        .then(
            (res) => {
                return res.data;
            }
        );
    }

    /**
     * Audit an apostille file
     *
     * @param {string} publicKey - The signer public key
     * @param {string} data - The file data of audited file
     * @param {string} signedData - The signed data into the apostille transaction message
     *
     * @return {boolean} - True if valid, false otherwise
     */
    auditApostille(publicKey, data, signedData) {

            let obj = {
                'publicKey': publicKey,
                'data': data,
                'signedData': signedData
            };

            let req = {
             method: 'POST',
             url: Nodes.apostilleAuditServer,
             headers: {
               'Content-Type': 'application/x-www-form-urlencoded;'
             },
             params: obj
            }

            return this._$http(req)
            .then((res)  => {
               return res.data;
            });
        }

    /**
     * Gets information about the maximum number of allowed harvesters and how many harvesters are already using the node
     *
     * @param {string} host - An host ip or domain
     *
     * @return {object} - An [UnlockInfo]{@link http://bob.nem.ninja/docs/#retrieving-the-unlock-info} object
     */
    getUnlockedInfo(host) {
        let port = this.getPort();
        return this._$http.post('https://'+host+':' + port + '/account/unlocked/info', "").then((res) => {
            return res.data;
        });
    };

    /**
     * Unlocks an account (starts harvesting).
     *
     * @param {string} host - An host ip or domain
     * @param {string} privateKey - A delegated account private key
     *
     * @return - Nothing
     */
    unlockAccount(host, privateKey){
        let port = this.getPort();
        let obj = {'value':privateKey};
        return this._$http.post('https://'+host+':' + port + '/account/unlock', obj).then((res) => {
            return res;
        });
    };

     /**
     * Locks an account (stops harvesting).
     *
     * @param {string} host - An host ip or domain
     * @param {string} privateKey - A delegated account private key
     *
     * @return - Nothing
     */
    lockAccount(host, privateKey){
        let port = this.getPort();
        let obj = {'value':privateKey};
        return this._$http.post('https://'+host+':' + port + '/account/lock', obj).then((res) => {
            return res;
        });
    };

    /**
     * Gets nodes of the node reward program
     *
     * @return {array} - An array of SuperNodeData objects
     */
    getSupernodes(){
        return this._$http.get('https://supernodes.nem.io/nodes').then((res) => {
            return res;
        });
    };

    /**
     * Gets market information from Poloniex api
     *
     * @return {object} - A MarketInfo object
     */
    getMarketInfo(){
        return this._$http.get('https://poloniex.com/public?command=returnTicker').then((res) => {
            return res.data["BTC_XEM"];
        });
    };

    /**
     * Gets BTC price from blockchain.info API
     *
     * @return {object} - A MarketInfo object
     */
    getBtcPrice(){
        return this._$http.get('https://blockchain.info/ticker', {params: {"cors": true}}).then((res) => {
                return res.data["USD"];
        });
    };

    /**
     * Gets BTC price from blockchain.info API
     *
     * @return {object} - A MarketInfo object
     */
    getBtcEuroPrice(){
        return this._$http.get('https://blockchain.info/ticker', {params: {"cors": true}}).then((res) => {
                return res.data["EUR"];
        });
    };

    /**
     * Gets a TransactionMetaDataPair object from the chain using it's hash
     *
     * @param {string} host - An host ip or domain
     * @param {string} txHash - A transaction hash
     *
     * @return {object} - A [TransactionMetaDataPair]{@link http://bob.nem.ninja/docs/#transactionMetaDataPair} object
     */
    getTxByHash(host, txHash){
        let port = this.getPort();
        let obj = {'params':{'hash':txHash}};
     return this._$http.get('https://' + host + ':' + port + '/transaction/get', obj)
        .then(
            (res) => {
                return res.data;
            }
        );
    }

    /**
     * Determines if NIS is up and responsive.
     *
     * @param {string} host - An host ip or domain
     *
     * @return {object} - A [NemRequestResult]{@link http://bob.nem.ninja/docs/#nemRequestResult} object
     */
    heartbeat(host) {
        let port = this.getPort();
        return this._$http.get('https://' + host + ':' + port + '/heartbeat')
        .then(
            (res) => {
                console.log(res)
                return res.data;
            }
        );
    }

    /**
     * Gets the AccountMetaDataPair of the account for which the given account is the delegate account
     *
     * @param {string} host - An host ip or domain
     * @param {string} account - An account address
     *
     * @return {object} - An [AccountMetaDataPair]{@link http://bob.nem.ninja/docs/#accountMetaDataPair} object
     */
    getForwarded(host, account) {
        let port = this.getPort();
        let obj = {'params':{'address':account}};
        return this._$http.get('https://' + host + ':' + port + '/account/get/forwarded', obj)
        .then(
            (res) => {
                return res.data;
            }
        );
    }

    /**
     * Broadcast a transaction to the NEM network
     *
     * @param {string} host - An host ip or domain
     * @param {object} obj - A RequestAnnounce object
     *
     * @return {object} - A [NemAnnounceResult]{@link http://bob.nem.ninja/docs/#nemAnnounceResult} object
     */
    announceTransaction(host, obj) {
        let port = this.getPort();
        return this._$http.post('https://' + host + ':' + port + '/transaction/announce', obj)
        .then(
            (res) => {
                return res;
            }
        );
    }

    /**
     * Broadcast a transaction to the NEM network and return isolated data
     *
     * @param {string} host - An host ip or domain
     * @param {object} obj - A RequestAnnounce object
     * @param {anything} data - Any kind of data
     * @param {number} k - The position into the loop
     *
     * @return {object} - A [NemAnnounceResult]{@link http://bob.nem.ninja/docs/#nemAnnounceResult} object with loop data and k to isolate them into the callback.
     */
    announceTransactionLoop(host, obj, data, k) {
        let port = this.getPort();
        return this._$http.post('https://' + host + ':' + port + '/transaction/announce', obj)
        .then(
            (res) => {
                return {
                    'res': res,
                    'tx': data,
                    'k': k
                };
            }
        );
    }

    /**
     * Gets root namespaces.
     *
     * @param {string} host - An host ip or domain
     * @param {number|null} id - The namespace id up to which root namespaces are returned, null for most recent
     *
     * @return {object} - An array of [NamespaceMetaDataPair]{@link http://bob.nem.ninja/docs/#namespaceMetaDataPair} objects
     */
    getNamespaces(host, id){
        let port = this.getPort();
        let obj1 = {'params':{'pageSize':100}};
        let obj2 = {'params':{ 'id': id, 'pageSize':100}};
        let req;
        if(id === null) {
            req = this._$http.get('https://' + host + ':' + port + '/namespace/root/page', obj1)
        } else {
            req = this._$http.get('https://' + host + ':' + port + '/namespace/root/page', obj2)
        }
        return req.then(
            (res) => {
                return res.data;
            }
        );
    }

    /**
     * Gets sub-namespaces of a parent namespace
     *
     * @param {string} host - An host ip or domain
     * @param {string} address - An account address
     * @param {string} parent - The namespace parent
     *
     * @return {object} - An array of [NamespaceMetaDataPair]{@link http://bob.nem.ninja/docs/#namespaceMetaDataPair} objects
     */
    getSubNamespaces(host, address, parent){
        let port = this.getPort();
        let obj = {'params':{ 'address': address, 'parent':parent}};
        return this._$http.get('https://' + host + ':' + port + '/account/namespace/page', obj).then(
            (res) => {
                return res.data;
            }
        );
    }

    /**
     * Gets mosaics of a parent namespace
     *
     * @param {string} host - An host ip or domain
     * @param {string} address - An account address
     * @param {string} parent - The namespace parent
     *
     * @return {object} - An array of [MosaicDefinition]{@link http://bob.nem.ninja/docs/#mosaicDefinition} objects
     */
    getMosaics(host, address, parent){
        let port = this.getPort();
        let obj = {'params':{ 'address': address, 'parent':parent}};
        return this._$http.get('https://' + host + ':' + port + '/account/mosaic/definition/page', obj).then(
            (res) => {
                return res.data;
            }
        );
    }

    /**
     * Gets all mosaics definitions of an account
     *
     * @param {string} host - An host ip or domain
     * @param {string} address - An account address
     *
     * @return {array} - An array of [MosaicDefinition]{@link http://bob.nem.ninja/docs/#mosaicDefinition} objects
     */
    getMosaicsDefinitions(host, address){
        let port = this.getPort();
        let obj = {'params':{ 'address': address}};
        return this._$http.get('https://' + host + ':' + port + '/account/mosaic/owned/definition', obj).then(
            (res) => {
                return res.data;
            }
        );
    }

    /**
     * Gets all transactions of an account
     *
     * @param {string} host - An host ip or domain
     * @param {string} address - An account address
     * @param {string} txHash - A starting hash (optional)
     *
     * @return {array} - An array of [TransactionMetaDataPair]{@link http://bob.nem.ninja/docs/#transactionMetaDataPair} objects
     */
    getAllTransactions(host, address, txHash){
        let port = this.getPort();
        let obj = {'params':{'address':address, 'hash': txHash}};
     return this._$http.get('https://' + host + ':' + port + '/account/transfers/all', obj)
        .then(
            (res) => {
                return res.data;
            }
        );
    }

    /**
     * Get network time in ms
     *
     * @param {string} host - An host ip or domain
     *
     * @return {object} - A [communicationTimeStamps]{@link http://bob.nem.ninja/docs/#communicationTimeStamps} object
     */
    getNEMTime(host) {
        let port = this.getPort();
        return this._$http.get('https://' + host + ':' + port + '/time-sync/network-time')
        .then(
            (res) => {
                return res.data;
            }
        );
    }

    /**
     * Gets mosaics of a parent namespace
     *
     * @param {string} host - An host ip or domain
     * @param {string} id - The full mosaic id
     *
     * @return {object} - An array of [MosaicDefinition]{@link http://bob.nem.ninja/docs/#mosaicDefinition} objects
     */
    getOtherMosaic(host, id){
        let port = this.getPort();
        let obj = {'params':{ 'namespace':id}};
        return this._$http.get('https://' + host + ':' + port + '/namespace/mosaic/definition/page', obj).then(
            (res) => {
                return res.data;
            }
        );
    }

    /**
     * Gets mosaics of a parent namespace
     *
     * @param {string} symbol - Stock symbol
     *
     * @return {object} - An array of [MosaicDefinition]{@link http://bob.nem.ninja/docs/#mosaicDefinition} objects
     */
    getStockData(symbol){
        return this._$http.get('https://api.hybse.com/company/getstockprice/symbol/' + symbol).then(
                (res) => {
                let apiData = res.data;

                if (!apiData.data)
                    if (symbol == 'dim')
                        return 0.98;
                    else
                        return 0.00;
                else
                    return apiData.data;
            }
        );
    }

    /**
     * Gets the nearest nodes
     *
     * @param {object} coords - A coordinates object: https://www.w3schools.com/html/html5_geolocation.asp
     *
     * @return {array} - An array of supernodeInfo objects
     */
    getNearestNodes(coords) {
        let obj = {
           "latitude": coords.latitude,
           "longitude": coords.longitude,
           "numNodes": 5
        }
        return this._$http.post('http://199.217.113.179:7782/nodes/nearest', obj)
        .then((res) => {
                return res.data;
        });
    }

    /**
     * Gets FIAT currencies exchange rates from *fixer.io*.
     *
     * @return {object}
     */
    getFiatRates() {
        let api = "https://api.fixer.io/latest?base=USD";
        let symbols = ['INR', 'EUR', 'GBP'];
        return this._$http.get(api + "&symbols=" + symbols.join(",")).then((res) => {
            if (!res || res.status != 200) {
                return {};
            }

            return res.data['rates'];
        });
    };

}

export default NetworkRequests;