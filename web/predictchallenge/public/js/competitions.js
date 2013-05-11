app.controller('CompDetailsCtrl', function($scope, CompetitionList) {

  var query = location.search;
  var compid = query.split('?id=')[1];

  if (!compid) {

    console.log('no id provided')
    // location.href = "/";
  }

  $scope.compid = compid;

  var feed = new CompetitionList({
    creatorName: compid
  });
  feed.refresh();

  // var mentionsFeed = new Feed({
  //   mentions: username
  // });
  // mentionsFeed.refresh();

  // $scope.switchFeeds = function(feedName) {

  //   $scope.feedName = feedName;
  //   if (feedName == 'mentions') {
  //     $scope.feed = mentionsFeed;
  //   } else if (feedName == 'posts') {
  //     $scope.feed = feed;
  //   } else {
  //     $scope.feed = null;
  //   }
  // };

  // $scope.switchFeeds('posts');
  $scope.feed = feed;
});