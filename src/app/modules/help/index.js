import angular from 'angular';

// Create the module where our functionality can attach to
let helpModule = angular.module('app.needhelp', []);

// Include our UI-Router config settings
import HelpConfig from './help.config';
helpModule.config(HelpConfig);

// Controllers
import HelpCtrl from './help.controller';
helpModule.controller('HelpCtrl', HelpCtrl);

export default helpModule;
