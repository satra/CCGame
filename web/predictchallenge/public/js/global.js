var app = angular.module('predictionApp', ['ngGrid']);


app.factory('Feed', function($rootScope) {
  var PAGE_SIZE = 5;

  var Feed = function Feed(query) {
    this.query = query || {};
    this.posts = [];
    this.lastTime = 0;
    this.moreToLoad = false;
  };

  Feed.prototype.loadPosts = function() {
    var feed = this;

    var query = angular.copy(this.query);
    query.$limit = PAGE_SIZE + 1;
    query.postedTime = {$lt: this.lastTime};
    query.$sort = {postedTime: -1};

    dpd.posts.get(query, function(result) {
      if (result.length > PAGE_SIZE) {
        result.pop();
        feed.moreToLoad = true;
      } else {
        feed.moreToLoad = false;
      }
      if (result.length) feed.lastTime = result[result.length - 1].postedTime;

      Array.prototype.push.apply(feed.posts, result);

      $rootScope.$apply();
    });
  };

  Feed.prototype.refresh = function() {
    this.lastTime = new Date().getTime();
    this.posts.length = 0;
    this.loadPosts();
    this.moreToLoad = false;
  };

  return Feed;
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