import angular from 'angular';

// Create the module where our functionality can attach to
let harvestModule = angular.module('app.harvest', []);

// Include our UI-Router config settings
import harvestConfig from './harvest.config';
harvestModule.config(harvestConfig);

// Controllers
import HarvestCtrl from './harvest.controller';
harvestModule.controller('HarvestCtrl', HarvestCtrl);


export default harvestModule;
