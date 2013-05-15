app.controller('AllCompControl', function($scope, CompetitionList, $modal, $rootScope) {

  if (document.referrer && document.referrer !== location.href) {
    $scope.referrer = document.referrer;
  } else {
    $scope.referrer = '/';
  }

  var query = location.search;
  var status = query.split('?status=')[1];

  $scope.statusq = status;

  $scope.selectedCompetition = {};
  $scope.showCompetitionDetail = false;

  var feed ={};

  $rootScope.$watch('currentUser', function() {

    if($rootScope.currentUser)
    {
      console.log($rootScope.currentUser.competitions);

      if(!$scope.statusq)
      {
        console.log('searching for all');
        feed  = new CompetitionList();

        feed.refresh();

        $scope.feed = feed;
        $scope.updateList = feed.getList;
        $scope.gdata = feed.competitions;

      }
      else
      {
        console.log('searching for ', $scope.statusq)

        feed  = new CompetitionList(
        {
          simulateState: $scope.statusq
        });  

        feed.refresh();

        $scope.feed = feed;
        $scope.updateList = feed.getList;
        $scope.gdata = feed.competitions;
      }
    }
   });

  $scope.modal = {
    compname : '',
    minPlayers : 1,
    maxPlayers  : 10,
    numberBeans  : 10,
    numberRounds  : 10,
    climateChangeRound  : 7
  }

  var customCellTemplate = '<div ng-click="selectCompetition(row.entity)" class="ngCellText" ng-class="col.colIndex()"><span ng-cell-text>{{row.getProperty(col.field)}}</span></div>';
  var openCompetitionTemplate = '<div ng-click="openCompetitionWindow(row.entity)" class="ngCellText" ng-class="col.colIndex()"><a class="" ng-cell-text>Detailed View</a></div>';

  $scope.gridOptions = { 
        data: 'gdata',
        columnDefs: [
        {field:'competitionName', displayName:'Title', cellTemplate: customCellTemplate },
        {field:'ownerName', displayName:'Owner'}, 
        {field:'simulateState', displayName:'State'}, 
        {field:'id', displayName:'State', cellTemplate: openCompetitionTemplate },
        ]
      };

  $scope.openCompetitionWindow = function(competition) {
    window.location = '/competition.html?id=' + competition.id;
  }

  $scope.parentController = function(dismiss) {
    // console.log(dismiss);
    // do something

     dpd.users.me(function(me) {

        var createDate = new Date().getTime();
        var newname = $scope.modal.compname;        

        if(newname.length == 0)
        {
          newname = 'Unnamed competition' + createDate;
        }


        dpd.competitions.post(
        {  
          simulateState: 'created',
          runtime: 0,
          maxTeams: $scope.modal.maxPlayers,
          minTeams: $scope.modal.minPlayers,
          climateChangeRound: $scope.modal.climateChangeRound,
          numberBeans: $scope.modal.numberBeans,
          numberRounds: $scope.modal.numberRound,
          teamCount: 1,
          owner: me.id,
          ownerName: me.username,
          competitionName: newname,
          data: [],
          createDate: createDate

        }, 

        function (result, err) {
          if(err) 
          {
            return console.log(err);
          }
          else
          {
            console.log(result, result.id);
            feed.refresh();

            me.competitions.push(result.id);

            dpd.users.put(me, function(result, err) {
              if(err) return console.log(err);
              console.log(result, result.id);
            });


            dismiss();

            // uncomment to redirect to competition page after creation
            // window.location = '/competition.html?id=' + result.id;


          }
        });
      
      });
  }


});




