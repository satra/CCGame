app.controller('CompDetailsCtrl', function($scope, CompetitionList,$modal) {

  if (document.referrer && document.referrer !== location.href) {
    $scope.referrer = document.referrer;
  } else {
    $scope.referrer = '/';
  }

  var query = location.search;
  var compid = query.split('?id=')[1];


// populate modal with 
  var strategy = {'forecast_bid': 2,
                'drr_bid': 2,
                'rules': [['neither', 'geq', 7, 1],
                          ['F', 'geq', 1, 5],
                          ['F+DRR', 'geq', 7, 7],
                          ['neither', 'geq', 7, 1],
                          ['F', 'geq', 1, 5],
                          ['F+DRR', 'geq', 7, 7],
                          ['neither', 'geq', 7, 1],
                          ['F', 'geq', 1, 5],
                          ['F+DRR', 'geq', 7, 7],
                          ['neither', 'geq', 7, 1],
                          ['F', 'geq', 1, 5],
                          ['F+DRR', 'geq', 7, 7],
                ]
              }

  $scope.modal = {
    autogen: false,
    strategy: strategy
  }







  $scope.competitionData = {};

  if (!compid) {

    console.log('no id provided, should redirect')    
    // location.href = "/";

  }
  else
  {

    $scope.compid = compid;

    dpd.competitions.get(compid, function(result) {
    
      if(!result)
      {
        console.log('incorrect id, should redirect')    
        // location.href = "/";
      }


      // console.log(result);

      $scope.competitionData = result;

      dpd.users.me(function(me) {

        if(me)
        {
          if(me.id == result.owner) 
          {
            console.log('this is mine');

            $scope.ownership = true;
          }
          else
          {
            console.log('this is not mine');
            $scope.ownership = false;            
          }
        }
        else
        {
          console.log('im not logged in');
        }
      });

      $scope.competitionCompleted = false;
      $scope.mycompetition = result


    });

    $scope.competitionGridOptions = {
      data: 'competitionData.data',
      columnDefs: [
          {field:'0', displayName:'Team name'},
          {field:'1', displayName:'Strategy'},
          {field:'2', displayName:'Wins'}, 
          {field:'3', displayName:'Beans'},
          {field:'4', displayName:'Crises'}
          ]
      }
  }
});


// directive for a single list
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