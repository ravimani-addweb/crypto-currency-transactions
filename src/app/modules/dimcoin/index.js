import angular from 'angular';

// Create the module where our functionality can attach to
let dimcoinModule = angular.module('app.dimcoin', []);

// Include our UI-Router config settings
import DimcoinConfig from './dimcoin.config';
dimcoinModule.config(DimcoinConfig);

// Controllers
import DimcoinCtrl from './dimcoin.controller';
dimcoinModule.controller('DimcoinCtrl', DimcoinCtrl);


export default dimcoinModule;
