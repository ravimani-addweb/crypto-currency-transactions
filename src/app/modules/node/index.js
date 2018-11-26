import angular from 'angular';

// Create the module where our functionality can attach to
let NodeModule = angular.module('app.node', []);

// Include our UI-Router config settings
import NodeConfig from './node.config';
NodeModule.config(NodeConfig);

// Controllers
import NodeCtrl from './node.controller';
NodeModule.controller('NodeCtrl', NodeCtrl);


export default NodeModule;
