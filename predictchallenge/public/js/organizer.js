app.controller('UserCompControl', function($scope, GameList, $modal, $rootScope, $window) {

  if (document.referrer && document.referrer !== location.href) {
    $scope.referrer = document.referrer;
  } else {
    $scope.referrer = '/';
  }

  $scope.selectedCompetition = {};
  $scope.showCompetitionDetail = false;
  $scope.supportsGeo = $window.navigator;

  // $scope.position = null;
  // $scope.positionString = '';

  $scope.customBefore = false;
  $scope.customAfter = false;

  $scope.competitionSettings = {
    name : '',
    pass: '',
    position : null,
    positionString : '',
    minPlayers : 1,
    maxPlayers  : 10,
    numberBeans  : 10,
    numberRounds  : 10,
    climateChangeEnabled: true,
    climateChangeRound  : 7,
    probbefore1: '1',
    probbefore2: '1',
    probafter1: '1',
    probafter2: '2',
    modelbefore: '0',
    modelafter: '0',
    drrRound: 2,
    drrEnabled: true,
    beforeThreshold: 0.833,
    beforeNumerator1: 1,
    beforeNumerator2: 1,
    beforeDenominator1: 4,
    beforeDenominator2: 4,
    afterThreshold: 0.714,
    afterNumerator1: 1,
    afterNumerator2: 1,
    afterDenominator1: 6,
    afterDenominator2: 6
  }
  
  var feed ={};

  $rootScope.$watch('currentUser', function() {

    if($rootScope.currentUser)
    {
      // console.log($rootScope.currentUser.competitions);

      feed  = new GameList(
      {
        organizerName: $rootScope.currentUser.username
        // $or: [{
        //   ownerName: $rootScope.currentUser.username
        // }, {
        //   id: {$in: $rootScope.currentUser.competitions}
        // }]
      });
      feed.refresh();

      $scope.feed = feed;
      $scope.updateList = feed.getList;
      $scope.gdata = feed.competitions;


    }
   });

  $scope.$watch('feed', function()
  {
    if($scope.feed)
    {
      console.log($scope.feed.competitions.length);

      if($scope.feed.competitions.length > 0)
      {
         $('#myTab a:first').tab('show'); 
      }
    }
      
  }, true);

  $scope.$watch('competitionSettings', function()
  {
    // perform form validation here

    $scope.customBefore1 = $scope.competitionSettings.probbefore1 == '6';
    $scope.customBefore2 = $scope.competitionSettings.probbefore2 == '6';
    $scope.customAfter1 = $scope.competitionSettings.probafter1 == '6'
    $scope.customAfter2 = $scope.competitionSettings.probafter2 == '6';


    console.log('change');




  }, true);

  var customCellTemplate = '<div ng-click="selectCompetition(row.entity)" class="ngCellText" ng-class="col.colIndex()"><span ng-cell-text>{{row.getProperty(col.field)}}</span></div>';
  var openCompetitionTemplate = '<div ng-click="openCompetitionWindow(row.entity)" class="ngCellText" ng-class="col.colIndex()"><a class="" ng-cell-text>Open competition page</a></div>';
  var dateTemplate = '<div class="ngCellText" ng-class="col.colIndex()">{{row.getProperty(col.field) | date:"yy/MM/dd HH:mm:ss"}}</div>';

  $scope.gridOptions = { 
        data: 'gdata',
        jqueryUITheme: false,
        showFilter: true,
        columnDefs: [
        
        {field:'createDate', displayName:'Date created', cellTemplate: dateTemplate},
        {field:'name', displayName:'Name', cellTemplate: customCellTemplate },
        {field:'state', displayName:'Status'},
        {field:'id', displayName:'Actions', cellTemplate: openCompetitionTemplate },
        ]
      };

  $scope.openCompetitionWindow = function(competition) {
    window.location = '/competition.html?name=' + competition.name;
  }

  $scope.getGeo = function() {

    $window.navigator.geolocation.getCurrentPosition(function(position) {
      console.log(position);
        $scope.$apply(function() {
            $scope.competitionSettings.positionString = position.coords.latitude.toFixed(2) + ', ' + position.coords.longitude.toFixed(2);
            $scope.competitionSettings.position = position;
        });
    }, function(error) {
        alert(error);
    });

  }

  $scope.getRandom = function() {

    $scope.competitionSettings.name = Math.random().toString(36).slice(2,10);

  }

  $scope.createCompetition = function(){

    //make sure you're signed in
     dpd.users.me(function(me) {

        var createDate = new Date().getTime();

        var newname = $scope.competitionSettings.name;        

        if(newname.length == 0)
        {
          console.log('generating a random name');
          newname = Math.random().toString(36).slice(2,10);
        }

        // create new game
        dpd.game.post(
        {  
          organizer: me.id,
          organizerName: me.username,
          state: 'open',
          name: $scope.competitionSettings.name,
          createDate: createDate,
          runDate: 0,
          settings: $scope.competitionSettings,
          data: [],
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

            // redirect to competition after creation.

            // window.location = '/competition.html?id=' + result.id;

          }
        });
      });
  }
});