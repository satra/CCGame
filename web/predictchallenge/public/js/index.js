app.controller('UserCompControl', function($scope, CompetitionList, $modal) {

  if (document.referrer && document.referrer !== location.href) {
    $scope.referrer = document.referrer;
  } else {
    $scope.referrer = '/';
  }

  $scope.selectedCompetition = {};
  $scope.showCompetitionDetail = false;

  var feed = new CompetitionList();
  feed.refresh();

  $scope.modal = {
    compname : '',
    minPlayers : 1,
    maxPlayers  : 2,
    numberBeans  : 10,
    numberRounds  : 10,
    numberRain  : 10
  }

  $scope.feed = feed;
  $scope.updateList = feed.getList;
  $scope.gdata = feed.competitions;

  var customCellTemplate = '<div ng-click="selectCompetition(row.entity)" class="ngCellText" ng-class="col.colIndex()"><span ng-cell-text>{{row.getProperty(col.field)}}</span></div>';
  var openCompetitionTemplate = '<div ng-click="openCompetitionWindow(row.entity)" class="ngCellText" ng-class="col.colIndex()"><a class="" ng-cell-text>Detailed View</a></div>';

  $scope.gridOptions = { 
        data: 'gdata',
        columnDefs: [
        {field:'competitionName', displayName:'Title', width: 180, cellTemplate: customCellTemplate },
        {field:'ownerName', displayName:'Owner'}, 
        {field:'simulateState', displayName:'State'}, 
        {field:'id', displayName:'State',width: 100, cellTemplate: openCompetitionTemplate },
        ]
      };

  $scope.competitionGridOptions = {
    data: 'selectedCompetition.data',
    columnDefs: [
        {field:'0', displayName:'Rank'},
        {field:'1', displayName:'Player'}, 
        {field:'2', displayName:'Wins'},
        {field:'3', displayName:'Beans'},
        {field:'4', displayName:'Crises'}
        ]
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
          simulationDate: null,
          simulateState: 'created',
          maxTeams: $scope.modal.maxPlayers,
          minTeams: $scope.modal.minPlayers,
          numberRain: $scope.modal.numberRain,
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
            
            dismiss();

              window.location = '/competition.html?id=' + result.id;


          }
        });
      
      });
  }

  $scope.selectCompetition = function(entry_id) {

    $scope.selectedCompetition = entry_id;
    $scope.showCompetitionDetail = true;
  }

  $scope.openCompetitionWindow = function(competition) {

    window.location = '/competition.html?id=' + competition.id;
  }


});




