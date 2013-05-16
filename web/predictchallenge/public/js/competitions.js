app.controller('CompDetailsCtrl', function($scope, CompetitionList,$modal, $rootScope) {

  if (document.referrer && document.referrer !== location.href) {
    $scope.referrer = document.referrer;
  } else {
    $scope.referrer = '/';
  }


  // $scope.data = [[[0, 1], [1, 5], [2, 2]]];

  $scope.clearRules = function()
  {
    $scope.modal.strategy.rules = [];
  }

  $scope.generateStrategy = function()
  {

    $.get('/randomstrategy', function(data)
    {
      $scope.modal.strategy = data;
      $scope.$apply($scope.model);
    });
  }

  $scope.showStrategy = function(strategy_index)
  {
    $scope.showingStrategyDetails = true;
    $scope.selectedStrategy = strategy_index.strat;
  }


  $scope.runCompetition = function()
  {

    dpd.users.me(function(me) {
      if(me)
      {
        if(me.id == $scope.competitionData.owner)
        {

          if($scope.competitionData.simulateState != 'completed')
          {

            if($scope.competitionData.data.length >= $scope.competitionData.minTeams)
            {

              $.post("/simulate", { "compid": $scope.compid },

              function(data){
                
                $scope.competitionData = data;
                $scope.runDate = new Date($scope.competitionData.runtime);
                $scope.data = getChartData($scope.competitionData.data);
                // console.log(data); // John
                // alert('comp run'); 

                $scope.completed = true;

                $scope.$apply();

              }, "json");
            }
            else
            {
              var needed = $scope.competitionData.minTeams - $scope.competitionData.data.length;

              alert('This competition needs ' + needed + ' more players/teams before it can be run');
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
    $scope.modal.strategy.rules[$scope.modal.strategy.rules.length] = rule_to_add;
  }

  $scope.deleteRule = function(ruleIndex)
  {
    $scope.modal.strategy.rules.splice(ruleIndex,1);
  }

  // this is the callback from the modal to try to register a strategy
  $scope.parentController = function(dismiss) {

    // do something
     dpd.users.me(function(me) {

        var createDate = new Date().getTime();
        var submitstrat = $scope.modal.strategy;

        dpd.strategy.post(
        {
          owner: me.id,
          ownerName: me.username,
          competitionName: $scope.competitionData.competitionName, 
          competitionID: $scope.competitionData.id,
          strategy: submitstrat, 
          aggregateBeans: [],
          aggregateCrises: [],
          createDate: createDate
        }, function (result, err) {
          if(err) 
          {
            return console.log(err);
          }
          else
          {
            // this branch assumes we've inserted into strategy table successful
            // now add to competition table
            $scope.competitionData.data.push(
              {
                id:me.id, 
                name: me.username, 
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

            dpd.competitions.put($scope.competitionData.id, $scope.competitionData,
              function(result, err) {
                if(err) {
                  return console.log(err);
                }
                else
                {                  
                  // $scope.details = result;    
                  // $scope.apply($scope.modal);  
                  $scope.refreshCompetitionData();
                }
            });

            dismiss();

            $scope.$apply($scope.model);

          }
        });      
      });
  }

  // this may be uncessary
  $scope.refreshCompetitionData = function()
  {
    $scope.compid = compid;

    dpd.competitions.get(compid, function(result) {
      if(!result)
      {
        console.log('incorrect id, should redirect')    
        location.href = "/";
      }
      else
      {
        // console.log(result);
        $scope.competitionData = result;
        $scope.runDate = new Date($scope.competitionData.runtime);
        $scope.data = getChartData($scope.competitionData.data);

      }
    });
  }

  function getChartData(compdata)
  {

    var array_to_return = []
    var beans_array = []
    var crises_array = []


    for(i=0;i<compdata.length;i++)
    {
      
      // beans_array.push([compdata[i][6] - 0.5, compdata[i][4]])
      // crises_array.push([compdata[i][6] - 0.5, compdata[i][5]])
      beans_array.push([compdata[i].bids-0.2, compdata[i].beans])
      crises_array.push([compdata[i].bids+0.2, compdata[i].crises])
    }

    // array_to_return = [beans_array, crises_array];
        array_to_return = [{'label': 'Beans', 'data': beans_array},
        {'label': 'Crises', 'data': crises_array}];


    return array_to_return;
  }

  $scope.runDate = ''

  $scope.competitionData = {}
  $scope.completed = false;
  $scope.competitionFull = false;
  $scope.ownership = false;
  $scope.showingStrategyDetails = false;
  $scope.data = [];

  $scope.selectedStrategy = {};

  var query = location.search;
  var compid = query.split('?id=')[1];


// populate modal with default strategy
  var strategy = {'forecast_bid': 2,
                'drr_bid': 2,
                'rules': [],
              }

  $scope.modal = {
    autogen: false,
    strategy: strategy
  }

  dpd.on('StrategyPosted', function(competition){
      $scope.competitionData['data'] = competition.data;
      $scope.$apply($scope.model);
  });

  dpd.on('SimulationDone', function(simulation){
      $scope.refreshCompetitionData();
      $scope.completed = true;
      $scope.$apply($scope.model);
  });

  var showStrategyTemplate = '<div ng-click="showStrategy(row.entity)" class="ngCellText" ng-class="col.colIndex()"><a class="" ng-cell-text>Click for details</a></div>';

  // $scope.competitionGridOptions = {
  //   data: 'competitionData.data',
  //   columnDefs: [
  //       {field:'1', displayName:'Player / Team name'},
  //       {field:'2', displayName:'Strategy', cellTemplate: showStrategyTemplate }, 
  //       {field:'4', displayName:'Beans'}, 
  //       {field:'5', displayName:'Crises'},
  //       {field:'6', displayName:'Forecasts'}
  //       ]
  //   }    

        $scope.competitionGridOptions = {
    data: 'competitionData.data',
    columnDefs: [
        {field:'name', displayName:'Player / Team name', width: '*',  sortable: true},
        {field:'strat', displayName:'Strategy', cellTemplate: showStrategyTemplate, width: '*',  sortable: false }, 
        {field:'beans', displayName:'Beans', width: '*',  sortable: true}, 
        {field:'crises', displayName:'Crises', width: '*',  sortable: true},
        {field:'bids', displayName:'Forecast bids', width: '*',  sortable: true}
        ]
    }    


  if (!compid) {

    console.log('no id provided, should redirect')    
    location.href = "/";

  }
  else
  {
    $scope.compid = compid;

    console.log('loading compid:' + compid);

    dpd.users.me(function(me) {
      if(me)
      {
        console.log(me);
        
        if (me.competitions.indexOf(compid) >= 0)
        {
          $scope.ownership = true;
          console.log("this is your competition");


        }
      }
    });

    dpd.competitions.get(compid, function(result) {
    
      if(!result)
      {
        console.log('incorrect id, should redirect')    
        location.href = "/";
      }
      else
      {
        $scope.competitionData = result;
        $scope.runDate = new Date($scope.competitionData.runtime);
        $scope.data = getChartData($scope.competitionData.data);

        if($scope.competitionData.simulateState == 'completed')
        {
          $scope.completed = true;
        }

        if($scope.competitionData.data.length == $scope.competitionData.maxTeams)
        {
          $scope.competitionFull = true;
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

            scope.$watch(attrs.ngModel, function changed(a,b)
            {
                // var options = {
                //     xaxis: {
                //       ticks: [0, 1, 2,3,4,5,6,7,8,9,10]
                //     },
                //     grid: {
                //       show: true
                //     },
                //     series: {
                //       bars: { show: true },
                //       lines: { show: false },
                //       points: { show: true }
                //     }
                // };

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
                };

              $.plot(elem, scope.data, options);
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