app.controller('AllCompControl', function($scope, GameList, $modal, $rootScope) {

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

  $scope.quickjoinname = '';

  var feed ={};

  $rootScope.$watch('currentUser', function() {

    if($rootScope.currentUser)
    {
      console.log($rootScope.currentUser.competitions);

      if(!$scope.statusq)
      {
        console.log('searching for all');
        feed  = new GameList(
                  {
          state: "completed"
        });  

        feed.refresh();

        $scope.feed = feed;
        $scope.updateList = feed.getList;
        $scope.gdata = feed.competitions;

      }
      else
      {
        console.log('searching for ', $scope.statusq)

        feed  = new GameList(
        {
          state: $scope.statusq
        });  

        feed.refresh();

        $scope.feed = feed;
        $scope.updateList = feed.getList;
        $scope.gdata = feed.competitions;
      }
    }
   });

  feed  = new GameList();

  feed.refresh();

  $scope.feed = feed;
  $scope.updateList = feed.getList;
  $scope.gdata = feed.competitions;

  dpd.on('CompetitionPosted', function(post){
      console.log('allcomps competition posted')
      console.log(feed.competitions);
      feed.refresh();
  });

  var customCellTemplate = '<div ng-click="selectCompetition(row.entity)" class="ngCellText" ng-class="col.colIndex()"><span ng-cell-text>{{row.getProperty(col.field)}}</span></div>';
  var openCompetitionTemplate = '<div class="ngCellText" ng-class="col.colIndex()"><button class="btn btn-mini btn-primary btn-block" ng-click="openCompetitionWindow(row.entity)" ng-cell-text>View competition result</button></div>';
  var dateTemplate = '<div class="ngCellText" ng-class="col.colIndex()">{{row.getProperty(col.field) | date:"medium"}}</div>';  

  $scope.gridOptions = { 
        data: 'gdata',
        jqueryUITheme: false,
        showFilter: true,
        columnDefs: [
          {field:'createDate', displayName:'Date created', cellTemplate: dateTemplate},
          {field:'name', displayName:'Name', cellTemplate: customCellTemplate },
          {field:'organizerName', displayName:'Organizer', width:'100px'},
          {field:'state', displayName:'Status', width: '100px'},
          {field:'name', displayName:'Actions', cellTemplate: openCompetitionTemplate }
        ]
      };

  $scope.openCompetitionWindow = function(competition) {
    window.location = '/competition.html?name=' + competition.name;
  }

  $scope.quickJoin = function()
  {

    if( $scope.quickjoinname.length == 8)
    {
      window.location = '/competition.html?name=' + $scope.quickjoinname;
    }
  }


});




