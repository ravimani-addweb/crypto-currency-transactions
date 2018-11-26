import angular from 'angular';

// Create the module where our functionality can attach to
let assetExplorerModule = angular.module('app.assetExplorer', []);

// Include our UI-Router config settings
import AssetExplorerConfig from './assetExplorer.config';
assetExplorerModule.config(AssetExplorerConfig);

// Controllers
import AssetExplorerCtrl from './assetExplorer.controller';
assetExplorerModule.controller('AssetExplorerCtrl', AssetExplorerCtrl);


export default assetExplorerModule;
