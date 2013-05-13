/**
 * Created with PyCharm.
 * User: satra
 * Date: 5/10/13
 * Time: 4:11 PM
 * To change this template use File | Settings | File Templates.
 */
var debug = true;

function getRandom(min, max, n_samples){
    /* Generate a random number between min and max inclusive
     */
    var arr = numeric.random([n_samples]);
    arr = numeric.floor(numeric.add(min, numeric.mul(arr, max - min + 1)));
    if (n_samples == 1) return arr[0];
    return arr;
};

function generateRainfall(n_sides_regional, n_sides_local,
                          n_teams, target_rain){
    /*Randomly generate local and regional rainfall and determine flooding
     */
    var regional_rainfall = getRandom(1, n_sides_regional, n_teams);
    var local_rainfall = getRandom(1, n_sides_local, n_teams);
    var total_rainfall = numeric.add(local_rainfall, regional_rainfall);
    var flooded = numeric.geq(total_rainfall, target_rain);
    return {'regional': regional_rainfall,
            'local': local_rainfall,
            'flood': flooded}
};

function adjustBeans(beans, payments, flooded, round_idx, drr_teams,
                      penalty, drr_penalty, drr_round_start){
    /*Adjust the beans according to payments, flooding and penalty
    */
    var cur_drr_penality = drr_penalty;
    if (round_idx < drr_round_start){
        cur_drr_penalty = penalty;
    }
    var payments = numeric.mul(payments, numeric.geq(beans, 1));
    var penalized = numeric.max(numeric.sub(flooded, payments), 0)
    var beans_to_remove = numeric.add(numeric.mul(cur_drr_penalty,
                                                  numeric.mul(penalized,
                                                              numeric.eq(drr_teams,
                                                                         1))),
                                      numeric.mul(penalty,
                                                  numeric.mul(penalized,
                                                              numeric.eq(drr_teams,
                                                                         0))));
    var already_in_crisis = numeric.mul(beans, numeric.leq(beans, -1));
    beans = numeric.mul(beans, numeric.geq(already_in_crisis, 0));
    beans = numeric.sub(beans, numeric.sub(payments, beans_to_remove));
    var beans_joining_crisis = numeric.leq(beans, -1);
    beans = numeric.mul(beans, numeric.geq(beans, 1));
    in_crisis = numeric.sub(already_in_crisis, beans_joining_crisis);
    return numeric.add(beans, in_crisis);
};

function randomSelect(x){
    return x[getRandom(0, x.length - 1, 1)];
};

function generateStrategy(max_beans, max_rounds, die_change_round){
    /*
    0+ - if [F and DRR/F/DRR/neither] and [round eeq/geq/leq (1,10)] and
         [regional forecast >= int(1, 6 or 8)] then take early action

    */
    strategy = {'forecast_bid': getRandom(0, Math.floor(max_beans/2), 1)};
    strategy['drr_bid'] = getRandom(0, Math.floor(max_beans/2 - strategy['forecast_bid']), 1);
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

function zeros(shape){
    return numeric.rep(shape, 0);
};

function ones(shape){
    return numeric.rep(shape, 1);
};

function RainGame(n_teams, n_persons_per_team, n_beans,
                  n_rounds, die_change_round){
        this.n_teams = n_teams
        this.n_persons_per_team = n_persons_per_team
        this.n_beans = n_beans
        this.n_rounds = n_rounds
        this.n_die_change = die_change_round
        this.target_rain = 10
        this.penalty = 4
        this.drr_penalty = 2
        this.drr_round_start = 3
        this.forecast_bids = zeros([n_teams]) // receive regional forecast
        this.drr_bids = zeros([n_teams])  // have disaster risk reduction
        this.strategies = {}
        this.teams = []
};

RainGame.prototype.get_team_index = function(team_id){
        if (this.teams.indexOf(team_id) == -1) this.teams.push(team_id);
        return this.teams.indexOf(team_id);
};

RainGame.prototype.submitStrategy = function(team_id, strategy){
        this.strategies[team_id] = strategy;
        this.submit_forecast_bid(team_id, strategy['forecast_bid']);
        this.submit_drr_bid(team_id, strategy['drr_bid']);
        if (debug) console.log(strategy);
};

RainGame.prototype.submit_forecast_bid = function(team_id, bid){
        team_index = this.get_team_index(team_id);
        if (debug) console.log(team_index);
        this.forecast_bids[team_index] = bid;
};

RainGame.prototype.submit_drr_bid = function(team_id, bid){
        team_index = this.get_team_index(team_id);
        if (debug) console.log(team_index);
        this.drr_bids[team_index] = bid;
};

RainGame.prototype.getPayments = function(regional_rainfall, forecast_teams, drr_teams, turn){
    /*
        0+ - if [F and DRR/F/DRR/neither] and [round eeq/geq/leq (1,10)] and
             [regional forecast >= int(1, 6 or 8)] then take early action
    */
    payments = zeros([this.n_teams]);
    if (debug) console.log(this);
    for(var i=0; i< this.teams.length; i++){
        var team = this.teams[i];
        team_index = this.get_team_index(team);
        var rules = this.strategies[team]['rules'];
        if (debug) console.log(rules);
        var paid = false;
        for(var j=0; j<rules.length; j++){
            var rule = rules[j];
            if (debug) console.log(rule);
            var regional_forecast_bad = (regional_rainfall[team_index] >= rule[3]);
            if (regional_forecast_bad & (!paid)){
                valid_round = (((rule[1] == 'eeq') & (turn == rule[2])) |
                               ((rule[1] == 'geq') & (turn >= rule[2])) |
                               ((rule[1] == 'leq') & (turn <= rule[2])));
                if (valid_round){
                    var forecast = ((rule[0].indexOf('F') != -1) & forecast_teams[team_index]);
                    var drr = ((rule[0].indexOf('DRR')) & drr_teams[team_index]);
                    var neither = (rule[0].indexOf('neither') != -1);
                    if ((forecast & drr) | forecast | drr | neither) paid = true;
                };
            };
        };
        if (paid) payments[team_index] =  1;
    };
    return payments;
};

RainGame.prototype.simulateOnce = function(random_state){
        var beans = numeric.mul(this.n_beans, ones([this.n_teams]));
        var crises = zeros([this.n_teams]);

        //# perform forecast bids
        var forecast_bids = this.forecast_bids.slice(0);
        forecast_bids.sort();
        var half_teams = Math.floor(this.n_teams/2);
        var forecast_value = forecast_bids[half_teams];
        var n_items = 0;
        var forecast_teams = this.forecast_bids.map(function(item){
            if ((item >= forecast_value) & (n_items < half_teams)){
                n_items += 1;
                return true;
            }
            return false;
            });

        //# Winning teams pay their beans
        beans = numeric.sub(beans, numeric.mul(forecast_teams, this.forecast_bids));

        //# perform drr bids
        var drr_bids = this.drr_bids.slice(0);
        drr_bids.sort(function(a,b){return b-a});
        var drr_value = forecast_bids[0];
        n_items = 0;
        var drr_teams = this.drr_bids.map(function(item){
            if ((item >= drr_value) & (n_items < 1)){
                n_items += 1;
                return true;
            }
            return false;
            });

        //# Winning teams pay their beans
        beans = numeric.sub(beans, numeric.mul(drr_teams, this.drr_bids));

        if (debug){
            console.log(beans);
            console.log(forecast_teams);
            console.log(drr_teams);
        }
        numeric.seedrandom.seedrandom(random_state);

        for(var turn=1; turn <= this.n_rounds; turn++){
            var n_sides = 6;
            if (turn == this.n_die_change) n_sides = 8;
            rain = generateRainfall(n_sides,
                                    6,
                                    this.n_teams,
                                    this.target_rain);
            if (debug) console.log(rain['flood']);
            if (debug) console.log(rain['regional']);
            payments = this.getPayments(rain['regional'],
                    forecast_teams, drr_teams,
                    turn);
            if (debug) console.log(payments);
            beans = adjustBeans(beans.slice(0), payments, rain['flood'], turn,
                                 drr_teams,
                                 this.penalty, this.drr_penalty,
                                 this.drr_round_start);
        }
        if (debug) console.log(beans);
        return beans
};

RainGame.prototype.simulate = function(n_iters){
    var crises = zeros([this.n_teams]);
    var wins = zeros([this.n_teams]);
    for(var i=0; i<n_iters; i++){
        var beans = this.simulateOnce();
        var beanscopy = beans.slice(0);
        beanscopy.sort();
        if (debug) console.log(beans);
        if (debug) console.log('sorted');
        if (debug) console.log(beanscopy);
        for(var j=0; j<this.n_teams; j++){
            if (beans[j]<0) crises[j] += beans[j];
            if (beans[j] == beanscopy[0]) wins[j] += 1;
        }
        if (debug) console.log(wins);
        if (debug) console.log(crises);
    }
    if (debug) console.log('collecting stats');
    result = [];
    for(i=0; i<this.teams.length; i++){
        team = this.teams[i];
        team_index = this.get_team_index(team);
        if (debug) console.log(i);
        if (debug) console.log(team);
        if (debug) console.log(team_index);
        result.push({'team': team,
                     'summary': [wins[team_index],
                                 crises[team_index]],
                      'strategy': this.strategies[team]});
    };
    return result;
};


function test(){
console.log(getRandom(1, 6, 10));
result = generateRainfall(6, 2, 10);
console.log(adjustBeans([10, 10], [1, 1], result['flood'], 1, [false, false], 4, 2, 2));
console.log(zeros([4]));
console.log(generateStrategy(10, 10, 7));

debug = false;
var game = new RainGame(10, 1, 10, 1, 7);
console.log(game);
strategy = {'forecast_bid': 2,
            'drr_bid': 2,
            'rules': [['neither', 'geq', 7, 1],
                      ['F', 'geq', 1, 5],
                      ['F+DRR', 'geq', 7, 7]
                     ]
            };
game.submitStrategy('T0', strategy)
for(var team_id=1; team_id < game.n_teams; team_id++){
   game.submitStrategy('T' + team_id, generateStrategy(game.n_beans,
                                                            game.n_rounds,
                                                            game.n_die_change));
};
console.log(game.simulate(1000));
};


