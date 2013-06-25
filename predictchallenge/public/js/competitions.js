app.controller('CompDetailsCtrl', function($scope, GameList ,$modal, $rootScope) {

  if (document.referrer && document.referrer !== location.href) {
    $scope.referrer = document.referrer;
  } else {
    $scope.referrer = '/';
  }





  $scope.clearRules = function()
  {
    $scope.strategy.rules = [];
  }

  $scope.generateStrategy = function()
  {

    $.get('/randomstrategy', function(data)
    {
      console.log(data);
      $scope.strategy = data;
      $scope.$apply();
    });
  }

  $scope.showStrategy = function(strategy_index)
  {
    dpd.users.me(function(me) {
      if(me)
      {
        if(me.id == $scope.competitionData.organizer)
        {

          $scope.showingStrategyDetails = true;
          $scope.selectedStrategy = strategy_index.strat;

        }
        else
        {
          alert('This is not your competition');
        }
      }
      else{

        alert('Only organizers can see individual strategies');

      }
    });
  }


  $scope.runCompetition = function()
  {

    dpd.users.me(function(me) {
      if(me)
      {
        if(me.id == $scope.competitionData.organizer)
        {

          if($scope.competitionData.state != 'completed')
          {

            if($scope.competitionData.data.length > 1)
            {

              $.post("/simulate", { "compname": $scope.competitionData.id },

                function(result){

                  $scope.competitionData = result;
                  $scope.runDate = new Date($scope.competitionData.runtime);
                  $scope.data = getChartData($scope.competitionData.data);

                  if(result.state == "completed")
                  {
                    $scope.completed = true;
                    console.log('completed');
                  }

                  $scope.$apply();

                }, "json");
            }
            else
            {
              var needed = $scope.competitionData.minTeams - $scope.competitionData.data.length;

              alert('This competition needs more than 1 team to run');
            }
          }
          else
          {
            if($scope.completed ==false)
            {
              alert('this competition has already been run');
            }
          }
        }
        else
        {
          alert('you can only run competitions you\'ve created.');
        }
      }
      else
      {
        alert('you can only run competitions you\'ve created.');
      }
    });
  }

  $scope.addRule = function()
  {
    rule_to_add = [$("#fddropt").val(), $("#equalopt").val(), $("#roundopt").val(), $("#rainopt").val()];
    $scope.strategy.rules[$scope.strategy.rules.length] = rule_to_add;
  }

  $scope.deleteRule = function(ruleIndex)
  {
    $scope.strategy.rules.splice(ruleIndex,1);
  }

  $scope.addFakePlayer = function()
  {
       $.post("/randomplayer", { "compname": $scope.competitionData.id },

                function(result){

                    console.log(result);

//                  $scope.competitionData = result;
//                  $scope.runDate = new Date($scope.competitionData.runtime);
//                  $scope.data = getChartData($scope.competitionData.data);
//
//                  if(result.state == "completed")
//                  {
//                    $scope.completed = true;
//                    console.log('completed');
//                  }

                  $scope.$apply();

                }, "json");

  }



  // validate that hte username is either in first-last or number-first-last format
  var validateUsername = function(username)
  {
    console.log(username);

    if (username) {
      var splitname = username.split('-')
      console.log(splitname);
      if(splitname.length == 3 || splitname.length == 2)
      {
        return true;
      }
      else
      {
        return false;
      }
    }
    else
    {
      return false;
    }

  }


  $scope.submitStrategy = function()
  {
    var createDate = new Date().getTime();
    var submitstrat = $scope.strategy;

    if (validateUsername($scope.playername)) {

      dpd.strategy.post(
      {
        playerName: $scope.playername,
        competitionName: $scope.competitionData.name,
        competitionID: $scope.competitionData.id,
        createDate: createDate,
        strategy: submitstrat,
        aggregateBeans: [],
        aggregateCrises: []

      }, function (result, err) {
        if(err)
        {
          return console.log('error', err);
        }
        else
        {
          // this branch assumes we've inserted into strategy table successful
          // now add to competition table
          $scope.competitionData.data.push(
          {
            name: $scope.playername,
            strat: submitstrat,
            stratid: result.id,
            beans: -1,
            crises: -1,
            bids: -1,
            ddr:-1
          });

          if($scope.competitionData.data.length == $scope.competitionData.maxTeams)
          {
            $scope.competitionFull = true;
          }

          dpd.game.put($scope.competitionData.id, $scope.competitionData,
            function(result, err) {
              if(err) {
                return console.log(err);
              }
              else
              {
                console.log('strategy added successfully');

               $('#myTab a:last').tab('show');

                $scope.$apply();

              }
            });
        }
      });
    }
    else
    {
     console.log('username invalid');
    }
  }


  function getChartData(compdata)
  {

    var array_to_return = []
    var beans_array = []
    var crises_array = []

    if (compdata) {
      for(i=0;i<compdata.length;i++)
      {
        beans_array.push([compdata[i].bids-0.2, compdata[i].beans])
        crises_array.push([compdata[i].bids+0.2, compdata[i].crises])
      }

      array_to_return = [
      {'label': 'Beans', 'data': beans_array},
      {'label': 'Crises', 'data': crises_array}
      ];
      return array_to_return;
    }

  };


  $scope.runDate = ''
  $scope.competitionData = {}
  $scope.completed = false;
  $scope.ownership = false;
  $scope.hasPlayers = false;
  $scope.windowurl = document.URL;
  $scope.showingStrategyDetails = false;

  $scope.data = [];
  $scope.selectedStrategy = {};

  var query = location.search;
  var compname = query.split('?name=')[1];

  // populate modal with default strategy
  var strategy = {'forecast_bid': 2,
  'drr_bid': 2,
  'rules': [],
  }

  $scope.strategy = strategy;
  $scope.playername = '';

  dpd.on('StrategyPosted', function(competition){

    $scope.competitionData['data'] = competition.data;
    $scope.hasPlayers = true;
    $scope.$apply($scope);
  });



  dpd.on('SimulationDone', function(simulationData){

    $scope.competitionData = simulationData;

    console.log(simulationData)

    $scope.runDate = new Date($scope.competitionData.runDate);
    $scope.data = getChartData($scope.competitionData.data);

    if(simulationData.state == "completed")
    {
      $scope.completed = true;
      console.log('completed');
    }

    $scope.$apply();

  });



  var showStrategyTemplate = '<div ng-click="showStrategy(row.entity)" class="ngCellText" ng-class="col.colIndex()"><a class="" ng-cell-text>Show strategy</a></div>';

  $scope.competitionGridOptions = {
    data: 'competitionData.data',
    jqueryUITheme: false,
    showFilter: true,
    columnDefs: [
    {field:'name', displayName:'Team-Player', width: '*',  sortable: true},
    {field:'strat', displayName:'Strategy', cellTemplate: showStrategyTemplate, width: '*',  sortable: false },
    {field:'beans', displayName:'Beans', width: '*',  sortable: true},
    {field:'crises', displayName:'Crises', width: '*',  sortable: true},
    {field:'bids', displayName:'Forecast bids', width: '*',  sortable: true}
    ]
  }


  if (!compname) {

    console.log('no id provided, should redirect')
    location.href = "/";

    }
    else
    {
      $scope.compname = compname;

      dpd.game.get({'name':$scope.compname}, function(results) {

        if(!results)
        {
          console.log('incorrect id, should redirect')
          location.href = "/";
        }
        else
        {
          var result = results[0];

          $scope.hasPlayers = result.data.length > 0;

          dpd.users.me(function(me) {
            if(me)
            {
              $scope.ownership = me.id == result.organizer;

              console.log('ownership:', $scope.ownership)
              $scope.$apply();

            }
            else
            {
              $scope.ownership = false;
            }
          });


          $scope.competitionData = result;
          console.log(result);
          $scope.runDate = new Date($scope.competitionData.runDate);
          $scope.data = getChartData($scope.competitionData.data);

          if(result.state == "completed")
          {
            $scope.completed = true;
            $scope.$apply();

            console.log('completed');
          }
        }
      });
    }
  });


app.directive('chart', function(){
  return {
    restrict: 'A',
    replace: true,
    link: function(scope, elem, attrs) {

      scope.$watch(attrs.ngModel, function changed(new_data, old_data)
      {
        var options = {
          xaxis: {
            ticks: [0, 1, 2,3,4,5,6,7,8,9,10],
            min: -0.5,
            max: 10.5
          },
          grid: {
            show: true
          },
          series: {
            lines: { show: false },
            points: { show: true}
          },
          colors: ["rgba(98, 139, 97, 0.8)", "rgba(255, 0, 0, 0.8)"]
        }

        console.log('flot plot called', new_data);

        if (new_data) {$.plot(elem, new_data, options);};

        
      }); 
    }
  };
});

// directive for a single list
// based on code from 
// http://www.smartjava.org/content/drag-and-drop-angularjs-using-jquery-ui
app.directive('dndList', function() {

  return function(scope, element, attrs) {

        // variables used for dnd
        var toUpdate;
        var startIndex = -1;

        // watch the model, so we always know what element
        // is at a specific position
        scope.$watch(attrs.dndList, function(value) {
          toUpdate = value;
        },true);

        // use jquery to make the element sortable (dnd). This is called
        // when the element is rendered
        $(element[0]).sortable({
          items:'li',
          start:function (event, ui) {
                // on start we define where the item is dragged from
                startIndex = ($(ui.item).index());
              },
              stop:function (event, ui) {
                // on stop we determine the new index of the
                // item and store it there
                var newIndex = ($(ui.item).index());
                var toMove = toUpdate[startIndex];
                toUpdate.splice(startIndex,1);
                toUpdate.splice(newIndex,0,toMove);

                // we move items in the array, if we want
                // to trigger an update in angular use $apply()
                // since we're outside angulars lifecycle
                scope.$apply(scope.model);
              },
              axis:'y'
            })
      }
    });
