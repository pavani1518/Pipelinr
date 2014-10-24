'use strict';

/**
 * @ngdoc function
 * @name pipelinrApp.controller:RegisterCtrl
 * @description
 * # RegisterCtrl
 * Controller of the pipelinrApp
 */
angular.module('pipelinrApp')
  .controller('RegisterCtrl', ['$scope', '$http', '$window', 'Session', 'UserService', function($scope, $http, $window, Session, UserService) {
	  $scope.addUser = function(){
	  	var user = {name:$scope.newUser.username, email:$scope.newUser.email, password:$scope.newUser.password1};
	    UserService.create(user);

	    $scope.newUser.username = '';
	    $scope.newUser.email = '';
	    $scope.newUser.password1 = '';
	    $scope.newUser.password2 = '';
		};

		console.log($window.sessionStorage);
		console.log(Session);
}]);