var app = angular.module('predictionApp', ['ngGrid', '$strap.directives']);

// this controller handles:
// login, 
// logout, 
// change password functionality 
// list of the user's competition
// 
app.controller('UserCtrl', function($scope, $rootScope) {


  $rootScope.userLoaded = false;

  function getMe() {
    dpd.users.me(function(user) {
      $rootScope.currentUser = user;
      $rootScope.userLoaded = true;
      $scope.$apply();
    });
  }

  getMe();

  $scope.register = function() {
    if ($scope.supassword !== $scope.suconfirmPassword) {
      alert("Passwords do not match");
      return;
    }

    dpd.users.post({
      username: $scope.suusername,
      password: $scope.supassword,
      competitions: [],
      displayName: $scope.sudisplayname
    }, 
      function(user, error) {
      if (error) {
        if (error.message) {
          alert(message);
        } else if (error.errors) {
          var messages = '';
          var errors = error.errors;

          if (errors.username) {
            messages += "Username " + errors.username + "\n";
          }
          if (errors.password) {
            messages += "Password " + errors.password + "\n";
          }

          alert(messages);
        }
      } else {
        dpd.users.login({
          username: $scope.suusername,
          password: $scope.supassword
        }, function() {
          
          $scope.showSignUp(false);

          getMe();

          $scope.$apply();
        });
      }
    });
  };

  $scope.showLogin = function(val) {
    $scope.loginVisible = val;
    if (val) {
      $scope.username = '';
      $scope.password = '';
    }
  };

  $scope.showSignUp = function(val) {
    $scope.signUpVisible = val;
    if (val) {
      $scope.suusername = '';
      $scope.supassword = '';
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
  };

  CompetitionList.prototype.getListForUser = function(user_id) {
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

  };

  CompetitionList.prototype.refresh = function() {

    this.lastTime = new Date().getTime();
    this.competitions.length = 0;
    this.getList();
    this.moreToLoad = false;

  };

  return CompetitionList;

});







// app.directive('dpdMessageFor', function() {

//   return function(scope, element, attrs) {

//     var comp = scope.$eval(attrs.dpdMessageFor);
//     var data = comp.data;

//     // var message = post.message;
//     // var mentions = post.mentions;

//     // if (mentions) {
//     //   mentions.forEach(function(m) {
//     //     message = message.replace('@' + m, '<a href="/user.html?user=' + m + '">@' + m + '</a>');
//     //   });
//     // }

//     element.html(data);
//   };
// });



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

  $scope.parentController = function(dismiss) {
    // console.log(dismiss);
    // do something
    dismiss();
  }

  $scope.feed = feed;
  $scope.updateList = feed.getList;

  feed.refresh();
  $scope.gdata = feed.competitions;

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


  // $scope.register = function() {
      
  //     dpd.users.me(function(me) {

  //       var createDate = new Date().getTime();

  //       dpd.competitions.post(
  //       {  
  //         simulationDate: null,
  //         simulateState: 'created',
  //         maxTeams: $scope.maxPlayers,
  //         teamCount: 1,
  //         minTeams: $scope.minPlayers,
  //         owner: me.id,
  //         competitionName: $scope.compname,
  //         data: [[me.id, '', -1, -1]],
  //         createDate: createDate

  //       }, 

  //       function (result, err) {
  //         if(err) 
  //         {
  //           return console.log(err);
  //         }
  //         else
  //         {
  //           console.log(result, result.id);

  //           me.competitions.push(result.id);

  //           console.log(me);

  //           dpd.users.put(me, {"displayName":"foobar"}, function(result, err) {
  //             if(err) return console.log(err);
  //             console.log(result, result.id);
  //           });


  //           feed.refresh();
  //         }
  //       });
      
  //     });
  //   };

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

