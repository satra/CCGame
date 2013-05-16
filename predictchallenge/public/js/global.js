var app = angular.module('predictionApp', ['ngGrid', '$strap.directives']);

// this controller handles:
// login, 
// logout, 
// change password functionality 
// list of the user's competition
// 
app.controller('UserCtrl', function($scope, $rootScope) {

  $rootScope.userLoaded = false;

  $scope.showLogin = true;

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
          
          // $scope.showSignUp(false);

          getMe();

          $scope.$apply();
        });
      }
    });
  };

  // $scope.showLogin = function(val) {
  //   $scope.loginVisible = val;
  //   if (val) {
  //     $scope.username = '';
  //     $scope.password = '';
  //   }
  // };

  // $scope.showSignUp = function(val) {
  //   $scope.signUpVisible = val;
  //   if (val) {
  //     $scope.suusername = '';
  //     $scope.supassword = '';
  //   }
  // };


  $scope.login = function() {
    dpd.users.login({
      username: $scope.username,
      password: $scope.password
    }, function(session, error) {
      if (error) {
        alert(error.message);
      } else {
        // $scope.showLogin(false);
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
    // query.$limit = PAGE_SIZE + 1;
    query.createDate = {$lt: this.lastTime};
    query.$sort = {createDate: -1};

    dpd.competitions.get(query, function(result) {

      console.log(result);

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

app.factory('ResultList', function($rootScope) 
{

  var PAGE_SIZE = 10;

  var ResultList = function CompetitionList(query)
  {
    this.query = query || {};
    this.competitions = [];
    this.lastTime = 0;
    this.moreToLoad = false;
  };

  ResultList.prototype.getList = function() {
    var _list = this;

    var query = angular.copy(this.query);
    // query.$limit = PAGE_SIZE + 1;
    query.createDate = {$lt: this.lastTime};
    query.$sort = {createDate: -1};

    dpd.strategy.get(query, function(result) {

      console.log(result);

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

  ResultList.prototype.refresh = function() {

    this.lastTime = new Date().getTime();
    this.competitions.length = 0;
    this.getList();
    this.moreToLoad = false;

  };

  return ResultList;

});




