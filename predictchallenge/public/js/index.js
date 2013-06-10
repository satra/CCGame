app.controller('UserCompControl', function($scope, CompetitionList, $modal, $rootScope) {

  if (document.referrer && document.referrer !== location.href) {
    $scope.referrer = document.referrer;
  } else {
    $scope.referrer = '/';
  }

  $scope.selectedCompetition = {};
  $scope.showCompetitionDetail = false;

  var feed ={};

  $rootScope.$watch('currentUser', function() {

    if($rootScope.currentUser)
    {
      console.log($rootScope.currentUser.competitions);

      feed  = new CompetitionList(
      {
        $or: [{
          ownerName: $rootScope.currentUser.username
        }, {
          id: {$in: $rootScope.currentUser.competitions}
        }]
      });
      feed.refresh();

      $scope.feed = feed;
      $scope.updateList = feed.getList;
      $scope.gdata = feed.competitions;

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
  var openCompetitionTemplate = '<div ng-click="openCompetitionWindow(row.entity)" class="ngCellText" ng-class="col.colIndex()"><a class="" ng-cell-text>Open competition page</a></div>';

  $scope.gridOptions = { 
        data: 'gdata',
        showFilter: true,
        columnDefs: [
        {field:'competitionName', displayName:'Name', cellTemplate: customCellTemplate },
        {field:'ownerName', displayName:'Owner'}, 
        {field:'simulateState', displayName:'Status'},
        {field:'id', displayName:'Actions', cellTemplate: openCompetitionTemplate },
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
          newname = 'Unnamed competition'; 
        }


        dpd.competitions.post(
        {  
          runtime: 0,
          simulateState: 'open',
          maxTeams: $scope.modal.maxPlayers,
          minTeams: $scope.modal.minPlayers,
          climateChangeRound: $scope.modal.climateChangeRound,
          numberBeans: $scope.modal.numberBeans,
          numberRounds: $scope.modal.numberRounds,
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

            // window.location = '/competition.html?id=' + result.id;


          }
        });
      
      });
  }


});




