import angular from 'angular';

// Create the module where our functionality can attach to
let settingModule = angular.module('app.setting', []);

// Include our UI-Router config settings
import SettingConfig from './setting.config';
settingModule.config(SettingConfig);

// Controllers
import SettingCtrl from './setting.controller';
settingModule.controller('SettingCtrl', SettingCtrl);

export default settingModule;
