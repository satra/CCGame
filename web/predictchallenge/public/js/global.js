var app = angular.module('predictionApp', ['ngGrid', '$strap.directives']);


app.factory('CompetitionList', function($rootScope) 
{

  var PAGE_SIZE = 10;

  var CompetitionList = function CompetitionList(query)
  {
    this.query = query || {};
    this.competitions = [];
    this.lastTime = 0;
    this.moreToLoad = false;
  };

  CompetitionList.prototype.getList = function() {
    var _list = this;

    var query = angular.copy(this.query);
    query.$limit = PAGE_SIZE + 1;
    query.createDate = {$lt: this.lastTime};
    query.$sort = {createDate: -1};

    dpd.competitions.get(query, function(result) {

      if (result.length > PAGE_SIZE) {
        result.pop();
        _list.moreToLoad = true;
      } else {
        _list.moreToLoad = false;
      }

      if (result.length) _list.lastTime = result[result.length - 1].createDate;

      Array.prototype.push.apply(_list.competitions, result);

      $rootScope.$apply();

    });

    // console.log('called get list');
    // console.log(query);
  };


  CompetitionList.prototype.refresh = function() {

    // console.log('calling refresh');

    this.lastTime = new Date().getTime();
    this.competitions.length = 0;
    this.getList();
    this.moreToLoad = false;
  };

  return CompetitionList;

});
















app.directive('dpdMessageFor', function() {

  return function(scope, element, attrs) {
  
    // console.log(attrs);

    var comp = scope.$eval(attrs.dpdMessageFor);

    var data = comp.data;

    // var message = post.message;
    // var mentions = post.mentions;

    // if (mentions) {
    //   mentions.forEach(function(m) {
    //     message = message.replace('@' + m, '<a href="/user.html?user=' + m + '">@' + m + '</a>');
    //   });
    // }

    element.html(data);
  };
});



app.controller('CompetitionsController', function($scope, CompetitionList, $modal) {
  if (document.referrer && document.referrer !== location.href) {
    $scope.referrer = document.referrer;
  } else {
    $scope.referrer = '/';
  }

  $scope.minPlayers = 1;
  $scope.maxPlayers = 2;
  $scope.selectedCompetition = {};
  $scope.showCompetitionDetail = false;

  var feed = new CompetitionList();

  $scope.modal = {content: 'Hello Modal', saved: false};

  $scope.feed = feed;
  $scope.updateList = feed.getList;

  feed.refresh();

  $scope.gdata = feed.competitions;

  // var myHeaderCellTemplate = '<div class="ngHeaderSortColumn {{col.headerClass}}" ng-style="{\'cursor\': col.cursor}"'+
  //                            'ng-class="{ \'ngSorted\': !noSortVisible }"><div ng-click="col.sort($event)" ng-class="\'colt\'' + 
  //                            'col.index" class="ngHeaderText">{{col.displayName}}</div><div class="ngSortButtonDown" ng-show="col.showSortButtonDown()">'+
  //                            '</div><div class="ngSortButtonUp" ng-show="col.showSortButtonUp()"></div><div class="ngSortPriority">{{col.sortPriority}}</div>'+
  //                            '<div ng-class="{ ngPinnedIcon: col.pinned, ngUnPinnedIcon: !col.pinned }" ng-click="togglePin(col)" ng-show="col.pinnable"></div>'+
  //                            '</div><div ng-show="col.resizable" class="ngHeaderGrip" ng-click="col.gripClick($event)" ng-mousedown="col.gripOnMouseDown($event)"></div>';

  var customCellTemplate = '<div ng-click="selectCompetition(row.entity)" class="ngCellText" ng-class="col.colIndex()"><span ng-cell-text>{{row.getProperty(col.field)}}</span></div>';

  $scope.gridOptions = { 
        data: 'gdata',
        columnDefs: [
        {field:'competitionName', displayName:'Name', width: 180, cellTemplate: customCellTemplate },
        {field:'simulateState', displayName:'State'}, 
        {field:'teamCount', displayName:'Current'},
        {field:'maxTeams', displayName:'Total'},
        ]
      };

  $scope.competitionGridOptions = {
    data: 'selectedCompetition.data',
    columnDefs: [
        {field:'0', displayName:'Name'},
        {field:'1', displayName:'State'}, 
        {field:'2', displayName:'Current'},
        {field:'3', displayName:'Total'}
        ]

  }

  $scope.selectCompetition = function(entry_id) {

    $scope.selectedCompetition = entry_id;
    $scope.showCompetitionDetail = true;
  }


  $scope.register = function() {
    
    dpd.users.me(function(me) {

      var createDate = new Date().getTime();

      dpd.competitions.post(
      {  
        simulationDate: null,
        simulateState: 'created',
        maxTeams: $scope.maxPlayers,
        teamCount: 1,
        minTeams: $scope.minPlayers,
        owner: me.id,
        competitionName: $scope.compname,
        data: [[me.id, '', -1, -1]],
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
        }
      });
    
    });
  };




  // $scope.submit = function(newPost) {
  //   dpd.posts.post({
  //     message: newPost
  //   }, function(result, error) {
  //     if (error) {
  //       if (error.message) {
  //         alert(error.message);
  //       } else if (error.errors && error.errors.message) {
  //         alert("Message " + error.errors.message);
  //       } else {
  //         alert("An error occurred");
  //       }
  //     } else {
  //       feed.posts.unshift(result);
  //       $scope.newPost = '';
  //       $scope.$apply();
  //     }
  //   }); 
  // };

  
});



app.controller('LoginCtrl', function($scope, $rootScope) {
  $rootScope.userLoaded = false;

  function getMe() {
    dpd.users.me(function(user) {
      $rootScope.currentUser = user;
      $rootScope.userLoaded = true;
      $scope.$apply();
    });
  }

  getMe();


  $scope.showLogin = function(val) {
    $scope.loginVisible = val;
    if (val) {
      $scope.username = '';
      $scope.password = '';
    }
  };

  $scope.login = function() {
    dpd.users.login({
      username: $scope.username,
      password: $scope.password
    }, function(session, error) {
      if (error) {
        alert(error.message);
      } else {
        $scope.showLogin(false);
        getMe();

        $scope.$apply();
      }
    });
  };

  $scope.logout = function() {
    dpd.users.logout(function() {
      $rootScope.currentUser = null;
      $scope.$apply();
    });
  };
});