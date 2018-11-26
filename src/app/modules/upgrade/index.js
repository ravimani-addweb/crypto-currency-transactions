import angular from 'angular';

// Create the module where our functionality can attach to
let upgradeModule = angular.module('app.accountUpgrade', []);

// Include our UI-Router for account upgrades
import UpgradeConfig from './upgrade.config';
upgradeModule.config(UpgradeConfig);

// Controllers
import UpgradeCtrl from './upgrade.controller';
upgradeModule.controller('UpgradeCtrl', UpgradeCtrl);

export default upgradeModule;
