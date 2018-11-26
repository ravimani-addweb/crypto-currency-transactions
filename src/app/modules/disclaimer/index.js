import angular from 'angular';

// Create the module where our functionality can attach to
let disclaimerModule = angular.module('app.disclaimer', []);

// Include our UI-Router config settings
import DisclaimerConfig from './disclaimer.config';
disclaimerModule.config(DisclaimerConfig);

// Controllers
import DisclaimerCtrl from './disclaimer.controller';
disclaimerModule.controller('DisclaimerCtrl', DisclaimerCtrl);

export default disclaimerModule;
