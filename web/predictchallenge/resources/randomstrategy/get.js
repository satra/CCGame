// this needs to be mapped to site-specific location
var numeric = require('/Users/stonerri/Documents/SatraPrediction/CCGame/web/predictchallenge/node_modules/numeric');
var max_beans = 10
var max_rounds = 10;
var round_change = 6;

if(Object.keys(parts).length == 3)
{
    max_beans = parts[0];
    max_rounds = parts[1];
    round_change = parts[2];
}
//console.log(max_beans, max_rounds, round_change);

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

var strategy = generateStrategy(max_beans,max_rounds, round_change, false);

setResult(strategy);