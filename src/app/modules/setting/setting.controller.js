import Network from '../../utils/Network';
import helpers from '../../utils/helpers';
import Nodes from '../../utils/nodes';

class SettingCtrl {
    constructor(AppConstants,Wallet,$location,Alert,$filter,$translate,$state,$localStorage) {
    'ngInject';
    // Alert service
    this._Alert = Alert;
    // Filters
    this._$filter = $filter;
    // $location to redirect
    this._location = $location;
    // Wallet service
    this._Wallet = Wallet;
    // Translation service
    this._$translate = $translate;
    // Local storage
    this._storage = $localStorage;
    // Alert service
    this._$state = $state;

    this._appConstants=AppConstants;
    this.backimage = AppConstants.Bgimage;
    // Available languages
    this.languages = this._appConstants.languages;
    this.selectOption = this._appConstants.selectOption;
    this.isColorSelectorDisplayed=false;
    this.isLanguageSelectorDisplayed=false;
      this.themeColor=[{
        "type":'blue',
        "key":'DEFAULT_SCREEN'
      },{
        "type":'orange',
        "key":'ORANGE'
      },{
        "type":'blue',
        "key":'BLUE'
      },{
        "type":'default',
        "key":'GREY'
      }/*,{
        "type":'nightview',
        "key":'NIGHT_VIEW'
      }*/];
      if(this._storage.themes){
          this.selectedColor=this._storage.themes;
          $("body").removeClass('blue')
          $("body").addClass(this.selectedColor.type);
      }else {
        this.selectedColor=this.themeColor[0];
      }


    // If no wallet show alert and redirect to home
    if (!this._Wallet.current) {
    this._Alert.noWalletLoaded();
    this._location.path('/');
    }

    this._$translate.use(this._storage.lang.key);
    this.selectOption = this._storage.lang;

      $(function() {
        $(["/images/dashboard.png","/images/close-o.png"]).preload();
      });

  }
    /**
     * changeLanguage() Change app language
     *
     * @param key: language key
     */
    changeLanguage(key) {
        this.selectOption=key;
        this._storage.lang=key;
        this._$translate.use(key.key);
    };
    /**
     * Redirect to login page
     */
    redirect() {
        this._$state.go("app.dashboard");
    }
    isColorSelector(){
      if(this.isColorSelectorDisplayed == true) this.isColorSelectorDisplayed=false; else this.isColorSelectorDisplayed=true;
    }
    isLanguageSelector(){
      if(this.isLanguageSelectorDisplayed == true) this.isLanguageSelectorDisplayed=false; else this.isLanguageSelectorDisplayed=true;
    }
    /**
    *Change background color
    */
    changeColor(key){
      this._storage.themes=key;
      this.selectedColor=key;
      this.isColorSelector()
      if($("body").find('.default')){
        $("body").removeClass('default')
        $("body").addClass(key.type);

      }
      if($("body").find('.orange')){
        $("body").removeClass('orange')
        $("body").addClass(key.type);

      }
      if($("body").find('.blue')){
        $("body").removeClass('blue')
        $("body").addClass(key.type);

      }
      if($("body").find('.nightview')){
        $("body").removeClass('nightview')
        $("body").addClass(key.type);
      }
    }

}

export default SettingCtrl;
