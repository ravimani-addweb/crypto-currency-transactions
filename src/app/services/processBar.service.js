export default class  ProcessBar {
  constructor($timeout){
      'ngInject';

      // this._scope = $scope;
      this._$timeout = $timeout;
      this.process = 0;
      this.endVal = 100 ;
      $('body').find('.process-bar-wrap').hide();
  }

  start() {
    $('body').find('.process-bar-wrap').show();
    if(this.process <= 90) {
      this.timer();
    }
  }
  stop() {
  }
  complete() {
    console.log('complete...');
    $('body').find('.process-bar').removeClass('width-20');
    $('body').find('.process-bar').removeClass('width-40');
    $('body').find('.process-bar').removeClass('width-60');
    $('body').find('.process-bar').removeClass('width-80');

    $('body').find('.process-bar').addClass('width-complete');
      this._$timeout(() => {

      if($('body').find('.process-bar').hasClass('width-complete')){
        $('body').find('.process-bar').removeClass('width-20');
        $('body').find('.process-bar').removeClass('width-40');
        $('body').find('.process-bar').removeClass('width-60');
        $('body').find('.process-bar').removeClass('width-80');
        $('body').find('.process-bar').removeClass('width-complete');
        $('body').find('.process-bar-wrap').hide();

         this.process = 0;
         this.endVal = 100 ;
      }
    },100);
  }
  timer(){
    console.log('comming...',this.process);
    this.process= this.process + 10;

      if(this.process <= 20){
          $('body').find('.process-bar').removeClass('width-20');
          $('body').find('.process-bar').removeClass('width-40');
          $('body').find('.process-bar').removeClass('width-60');
          $('body').find('.process-bar').removeClass('width-80');
          $('body').find('.process-bar').removeClass('with-complete');

          $('body').find('.process-bar').addClass('width-20');
      }
      if(this.process == 40){
        $('body').find('.process-bar').removeClass('width-20');
        $('body').find('.process-bar').removeClass('width-40');
        $('body').find('.process-bar').removeClass('width-60');
        $('body').find('.process-bar').removeClass('width-80');
        $('body').find('.process-bar').removeClass('with-complete');


        $('body').find('.process-bar').addClass('width-40');
      }
      if(this.process == 60){
        $('body').find('.process-bar').removeClass('width-20');
        $('body').find('.process-bar').removeClass('width-40');
        $('body').find('.process-bar').removeClass('width-60');
        $('body').find('.process-bar').removeClass('width-80');
        $('body').find('.process-bar').removeClass('with-complete');


        $('body').find('.process-bar').addClass('width-60');
      }
      if(this.process == 80){
        $('body').find('.process-bar').removeClass('width-20');
        $('body').find('.process-bar').removeClass('width-40');
        $('body').find('.process-bar').removeClass('width-60');
        $('body').find('.process-bar').removeClass('width-80');
        $('body').find('.process-bar').removeClass('with-complete');


        $('body').find('.process-bar').addClass('width-80');
      }
      this._$timeout(() => {
        if(this.process <= 80) {
          this.timer();
        }
              // this.process = 0;
              // $('body').find('.process-bar-wrap').hide();
              // $('body').find('.process-bar').css('width',this.process+'%');
              // this.endVal = 100 ;


      },100);
  }
  reset(){
  }
};
