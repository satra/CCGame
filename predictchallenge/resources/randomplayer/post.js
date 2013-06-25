

// this needs to be mapped to site-specific location
//var numeric = require('/Users/stonerri/Documents/SatraPrediction/CCGame/web/predictchallenge/node_modules/numeric');
var numeric = require('node_modules/numeric');

function getRandom(min, max, n_samples){
    /* Generate a random number between min and max inclusive
     */
    var arr = numeric.random([n_samples]);
    arr = numeric.floor(numeric.add(min, numeric.mul(arr, max - min + 1)));
    if (n_samples == 1) return arr[0];
    return arr;
};

function randomSelect(x){
    return x[getRandom(0, x.length - 1, 1)];
};


function generateStrategyOriginal(max_beans, max_rounds, die_change_round){
    /*
    0+ - if [F and DRR/F/DRR/neither] and [round eeq/geq/leq (1,10)] and
         [regional forecast >= int(1, 6 or 8)] then take early action

    */
    strategy = {'forecast_bid': getRandom(0, Math.floor(max_beans/2), 1)};
    strategy['drr_bid'] =
        getRandom(0, Math.floor(max_beans/2 - strategy['forecast_bid']), 1);
    strategy['rules'] = [];
    bid_conditions = ['F+DRR', 'F', 'DRR', 'neither'];
    round_condition = ['geq', 'eeq', 'leq'];
    for(var i=0; i < getRandom(0, 10, 1); i++){
        rule = [randomSelect(bid_conditions),
                randomSelect(round_condition),
                getRandom(1, max_rounds, 1)];
        var max_sides = 6;
        if (rule[2] >= die_change_round) max_sides = 8;
        rule.push(getRandom(1, max_sides, 1));
        strategy['rules'].push(rule);
    };
    return strategy;
};

function generateStrategy(max_beans, max_rounds, die_change_round, with_drr){
    /*
    0+ - if [F and DRR/F/DRR/neither] and [round eeq/geq/leq (1,10)] and
         [regional forecast >= int(1, 6 or 8)] then take early action

    */
    strategy = {'forecast_bid': getRandom(0, Math.floor(max_beans/2), 1)};
    strategy['drr_bid'] =
        getRandom(0, Math.floor(max_beans/2 - strategy['forecast_bid']), 1);
    strategy['rules'] = [];
    if (with_drr){
        bid_conditions = ['F+DRR', 'F', 'DRR', 'none'];
    }else{
        bid_conditions = ['F', 'none'];
    }
    round_condition = ['geq', 'eeq', 'leq'];
    for(var i=0; i < getRandom(0, 10, 1); i++){
        rule = [randomSelect(bid_conditions),
                randomSelect(round_condition),
                getRandom(1, max_rounds, 1)];
        var max_sides = 6;
        if (rule[2] >= die_change_round) max_sides = 8;
        rule.push(getRandom(1, max_sides, 1));
        strategy['rules'].push(rule);
    };
    return strategy;
};




function makeid()
{
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < 5; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}







dpd.game.get(body.compname,

    function(competitionData, error) {

        var createDate = new Date().getTime();

        // grab competition data
        var max_beans = competitionData.settings.numberBeans;
        var max_rounds = competitionData.settings.numberRounds;
        var round_change = competitionData.settings.climateChangeRound;

        var strategy = generateStrategy(max_beans,max_rounds, round_change, false);
        var playername =  'Random-User' +  Math.random().toString(36).slice(2,10);

        dpd.strategy.post(
        {
            playerName: playername,
            competitionName: competitionData.name,
            competitionID: competitionData.id,
            createDate: createDate,
            strategy: strategy,
            aggregateBeans: [],
            aggregateCrises: []
        }, function (result, err) {
            if(err)
            {
              return console.log('error', err);
            }
            else
            {
              // this branch assumes we've inserted into strategy table successful
              // now add to competition table
              competitionData.data.push(
              {
                name: playername,
                strat: strategy,
                stratid: result.id,
                beans: -1,
                crises: -1,
                bids: -1,
                ddr:-1
              });

              dpd.game.put(competitionData.id, competitionData,
                function(result, err) {
                  if(err) {
                    return console.log(err);
                    setResult(result);

                  }
                  else
                  {
                    console.log('strategy added successfully');
                  }
                });
            }
        });
    });

//
//if (validateUsername($scope.playername)) {
//
//      dpd.strategy.post(
//      {
//        playerName: $scope.playername,
//        competitionName: $scope.competitionData.name,
//        competitionID: $scope.competitionData.id,
//        createDate: createDate,
//        strategy: submitstrat,
//        aggregateBeans: [],
//        aggregateCrises: []
//
//      }, function (result, err) {
//        if(err)
//        {
//          return console.log('error', err);
//        }
//        else
//        {
//          // this branch assumes we've inserted into strategy table successful
//          // now add to competition table
//          $scope.competitionData.data.push(
//          {
//            name: $scope.playername,
//            strat: submitstrat,
//            stratid: result.id,
//            beans: -1,
//            crises: -1,
//            bids: -1,
//            ddr:-1
//          });
//
//          if($scope.competitionData.data.length == $scope.competitionData.maxTeams)
//          {
//            $scope.competitionFull = true;
//          }
//
//          dpd.game.put($scope.competitionData.id, $scope.competitionData,
//            function(result, err) {
//              if(err) {
//                return console.log(err);
//              }
//              else
//              {
//                console.log('strategy added successfully');
//
//               $('#myTab a:last').tab('show');
//
//                $scope.$apply();
//
//              }
//            });
//        }
//      });







