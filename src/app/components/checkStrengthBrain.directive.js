import helpers from '../utils/helpers';

function okPasswordBrain(AppConstants, $filter) {

  'ngInject';

  return {
    // restrict to only attribute and class
    restrict: 'AC',

    // use the NgModelController
    require: 'ngModel',

    // add the NgModelController as a dependency to your link function
    link: function($scope, $element, $attrs) {
      $element.on('blur change keydown', function(evt) {
          $scope.$evalAsync(function($scope) {
              // update the $scope.password with the element's value
              var pwd = $scope.$ctrl.formData.password = $element.val();
              // resolve password strength score using zxcvbn service
              if(pwd.length > 1 && pwd.length < 16){
                $scope.passwordStrengthBrain = 0;
                $scope.passwordstrengthMessage=($filter('translate')('PASSWORD_VALIDATION_1'));
              }else if (pwd.length > 16 && pwd.length < 32) {
                  $scope.passwordStrengthBrain = 1;
                  $scope.passwordstrengthMessage=($filter('translate')('PASSWORD_VALIDATION_2'));
              }else if (pwd.length > 32 && pwd.length < 48) {
                $scope.passwordStrengthBrain = 2;
                $scope.passwordstrengthMessage=($filter('translate')('PASSWORD_VALIDATION_3'));
              }else if (pwd.length > 48 && pwd.length < 64) {
                $scope.passwordStrengthBrain = 3;
                $scope.passwordstrengthMessage=($filter('translate')('PASSWORD_VALIDATION_4'));
              }else if (pwd.length > 64){
                $scope.passwordStrengthBrain = 4;
                $scope.passwordstrengthMessage=($filter('translate')('PASSWORD_VALIDATION_5'));
              }else if(pwd.length == 0){
                  $scope.passwordStrengthBrain = '';
                  $scope.passwordstrengthMessage='';
              }
              //console.log('$scope.passwordStrength',$scope.passwordStrength)
              // define the validity criterion for okPassword constraint
              //ngModelCtrl.$setValidity('okPassword', $scope.passwordStrength >= 2);
          });
      });
    }
  };
}
  export default okPasswordBrain;
