import angular from 'angular';

// Create the module where our functionality can attach to
let servicesModule = angular.module('app.services', ['ngToast']);

// Set Alert service
import AlertService from './alert.service';
servicesModule.service('Alert', AlertService);

// Set WalletBuilder service
import WalletBuilderService from './walletBuilder.service';
servicesModule.service('WalletBuilder', WalletBuilderService);

// Set wallet Service
import WalletService from './wallet.service';
servicesModule.service('Wallet', WalletService);

// Set Connector service
import ConnectorService from './connector.service';
servicesModule.service('Connector', ConnectorService);

// Set DataBridge service
import DataBridgeService from './dataBridge.service';
servicesModule.service('DataBridge', DataBridgeService);

// Set NetworkRequests service
import NetworkRequestsService from './networkRequests.service';
servicesModule.service('NetworkRequests', NetworkRequestsService);

// Set Transactions service
import TransactionsService from './transactions.service';
servicesModule.service('Transactions', TransactionsService);

// Set DIM service
import DimService from './dim.service';
servicesModule.service('DimService', DimService);

// Set Process Bar
import ProcessBarService from './processBar.service';
servicesModule.service('processBar', ProcessBarService);

export default servicesModule;
