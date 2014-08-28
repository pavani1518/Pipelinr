'use strict';

/* Controllers */

angular.module('myApp.controllers', [])
  .controller('PipelinesCtrl', ['$scope', '$http', 'Socket', 'PipelineService', 'DatasetService', 'Session', function($scope, $http, Socket, PipelineService, DatasetService, Session) {

  // Set for page refresh
	$http.defaults.headers.common['token'] = Session.token;

	$scope.alerts = [];
  $scope.closeAlert = function(index) {
    $scope.alerts.splice(index, 1);
  };

  // Search
  $scope.search = function(item) {
  	if (item.name.indexOf($scope.query)!=-1 || item.origin_id.indexOf($scope.query)!=-1 || angular.isUndefined($scope.query)) {           
      return true;
    }
    return false;
	};

	// Get pipelines
	var pipelines = PipelineService.query();
	pipelines.$promise.then(function(pipelines) {

	  $scope.pipelines = pipelines;
	  console.log(pipelines);

		$scope.deletePipeline = function (pipeline) {
	    PipelineService.remove({ id: pipeline._id }, function (response) {
				var index = $scope.pipelines.indexOf(pipeline);
		    if (index != -1) {
	        $scope.pipelines.splice(index, 1);
    			$scope.alerts.push({ type: 'success', msg: 'Pipeline deleted successfully.'});
    		}
	    }, function (error) {
	      $scope.alerts.push({ type: 'danger', msg: error.status + ": " + error.data});
	    });
	  };

		$scope.deleteDataset = function (pipeline, dataset) {
	    DatasetService.remove({ pipeline_id: dataset._pipeline, dataset_id: dataset._id }, function (response) {
				var pipe_index = $scope.pipelines.indexOf(pipeline);
		    if (pipe_index != -1) {
	        var data_index = $scope.pipelines[pipe_index].datasets.indexOf(dataset);
	        if (data_index != -1) {
						$scope.pipelines[pipe_index].datasets.splice(data_index, 1);
			    	$scope.alerts.push({ type: 'success', msg: 'Dataset deleted successfully.'});
	        }
	      }
	    }, function (error) {
	      $scope.alerts.push({ type: 'danger', msg: error.status + ": " + error.data});
	    });
	  };

    // Push notifications
		Socket.on('add_pipeline', function (p_data) {
			$scope.alerts.push({ type: 'info', msg: 'Pipeline "' + p_data.pipeline.name + '" added.'});
			p_data.pipeline.state = "new";
			$scope.pipelines.push(p_data.pipeline);	
			addDatasetSocket(p_data.pipeline);
	 	});

  	angular.forEach($scope.pipelines, function(pipeline, key) {
  		addDatasetSocket(pipeline);
			angular.forEach(pipeline.datasets, function(dataset, key) {
				addValueSocket(dataset);
			});
		});

		// Push notification for each dataset on each pipeline
		function addDatasetSocket(pipeline) {
			Socket.on('add_dataset_' + pipeline._id, function (d_data) { // same as (A)
				$scope.alerts.push({ type: 'info', msg: 'Dataset "' + d_data.dataset.key + '" in Pipeline "' + pipeline.name + '" added.'});
				d_data.dataset.state = "new";
				pipeline.datasets.push(d_data.dataset);

				addValueSocket(d_data.dataset);
			});
		}

		// Push notification for each value on each dataset
		function addValueSocket(dataset) {
			Socket.on('add_value_' + dataset._id, function (v_data) { // same as (B)
				if(typeof dataset.count == "undefined")
					dataset.count = 1;
				else
					dataset.count++;
		 	});
		}

	});

	// Destroy on navigate away
  $scope.$on('$destroy', function (event) {
    Socket.getSocket().removeAllListeners();
  });

}])  
.controller('PipelineDetailCtrl', ['$scope', '$http', '$routeParams', 'Socket', 'PipelineService', 'DataProcessing', 'Session', function($scope, $http, $routeParams, Socket, PipelineService, DataProcessing, Session) {

	// Set for refresh
	$http.defaults.headers.common['token'] = Session.token; 

	// Get and resolve pipeline
	$scope.rendered = false;
	var pipeline = PipelineService.get({id: $routeParams.id, tool: []});
	// Resolve new pipeline
	pipeline.$promise.then(function(pipeline) {
		console.log(pipeline);

		// Dashboard directive
		$scope.pipeline = pipeline;

		// Detail window
		$scope.earliestDate = DataProcessing.earliestDate(pipeline);
		$scope.latestDate = DataProcessing.latestDate(pipeline);

		// Checkboxes
		$scope.allKeys = DataProcessing.getDatasetKeys(pipeline);
		$scope.selection = DataProcessing.getDatasetKeys(pipeline);
		$scope.toggleSelection = function toggleSelection(key) {
		  var idx = $scope.selection.indexOf(key);
		  // Is currently selected
		  if (idx > -1) {
		    $scope.selection.splice(idx, 1);
		  }
		  // Is newly selected
		  else {
		    $scope.selection.push(key);
		  }
		};
		
		// Push notification for each value on each dataset
		angular.forEach($scope.pipeline.datasets, function(dataset, key) {
			Socket.on('add_value_' + dataset._id, function (v_data) {
				$scope.date = v_data;
		 	});
		});
  });

	// Destroy on navigate away
  $scope.$on('$destroy', function (event) {
      Socket.getSocket().removeAllListeners();
  });

  // Get Pipeline with tools
  $scope.getPipeline = function(){

		$scope.rendered = false; // Enable rendering in directive and waiting animation

  	var tools = [];
  	var tool;

		if($scope.selection.length != 0) {
			tool = {
				keys: $scope.selection,
				task: "selectDatasets"
			}
			tools.push(tool);
			console.log(tool);
		}

  	var begin = $scope.dateDropDownInput1;
  	var end = $scope.dateDropDownInput2;
  	if(typeof begin !== "undefined" && typeof end !== "undefined") {
			begin = moment(begin).format('DD MM YYYY, HH:mm:ss');
			end = moment(end).format('DD MM YYYY, HH:mm:ss');

			tool = {
				begin: begin,
				end: end,
				task: "trimPipeline"
			}
			tools.push(tool);
			console.log(tool);
		}

		//console.log(Socket.getSocket().listeners());

		var pipeline = PipelineService.get({id: $routeParams.id, tool: tools});

		pipeline.$promise.then(function(newdata) {
			$scope.pipeline = newdata;
  	});
	};

}]) 
.controller('RegisterCtrl', ['$scope', '$http', 'UserService', function($scope, $http, UserService) {
  $scope.addUser = function(){
  	var user = {name:$scope.newUser.username, email:$scope.newUser.email, password:$scope.newUser.password1};
    UserService.create(user);

    $scope.newUser.username = '';
    $scope.newUser.email = '';
    $scope.newUser.password1 = '';
    $scope.newUser.password2 = '';
	};
}])
.controller('SessionCtrl', ['$scope', '$http', '$location', '$cookieStore', 'SessionInService', 'SessionOutService', 'Session', function($scope, $http, $location, $cookieStore, SessionInService, SessionOutService, Session) {
	$scope.Session = Session;

	$scope.loginUser = function(){
		var session = {email:$scope.user.email, password:$scope.user.password};
	    console.log(session);
		$http.defaults.useXDomain = true;
		delete $http.defaults.headers.common['X-Requested-With'];
	    SessionInService.create(session, function(data){

			console.log(data);

			console.log(data.token);
			Session.isLogged = true;
			Session.token = data.token;

			$cookieStore.put("token", data.token);

			console.log(Session);

		  $scope.user.email = '';
			$scope.user.password = '';

			$location.path( '/pipeline-list' );

			$http.defaults.headers.common['token'] = Session.token;
		});
	};
	$scope.logoutUser = function(){
		SessionOutService.create(function(data) {

		  Session.isLogged = false;
		  Session.token = "";
		  $cookieStore.remove("token");

		  console.log(Session);

		  $location.path( '/register' );

  		  $http.defaults.headers.common['token'] = "";
		});
	};
}]);