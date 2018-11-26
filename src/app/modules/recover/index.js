import angular from 'angular';

// Create the module where our functionality can attach to
let recoverModule = angular.module('app.recover', []);

// Include our UI-Router config settings
import RecoverConfig from './recover.config';
recoverModule.config(RecoverConfig);

// Controllers
import RecoverCtrl from './recover.controller';
recoverModule.controller('RecoverCtrl', RecoverCtrl);

export default recoverModule;
