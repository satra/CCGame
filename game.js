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
    return arr;
};

function generateRainfall(n_sides, n_teams, target_rain){
    /*Randomly generate local and regional rainfall and determine flooding
     */
    var regional_rainfall = getRandom(1, n_sides, n_teams);
    var local_rainfall = getRandom(1, 6, n_teams);
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

/*
def generate_strategy(max_beans, max_rounds, die_change_round):
    """
    0+ - if [F and DRR/F/DRR/neither] and [round eeq/geq/leq (1,10)] and
         [regional forecast >= int(1, 6 or 8)] then take early action

    """
    strategy = {'forecast_bid': int(np.random.randint(0, max_beans/2, 1))}
    strategy['drr_bid'] = int(np.random.randint(0,
                                            max_beans/2-strategy['forecast_bid'],
                                            1))
    strategy['rules'] = []
    bid_conditions = ['F+DRR', 'F', 'DRR', 'neither']
    round_condition = ['geq', 'eeq', 'leq']
    random_select = lambda x : x[np.random.randint(0, len(x) - 1, 1)]
    for i in range(np.random.randint(0, 10, 1)):
        rule = [random_select(bid_conditions),
                random_select(round_condition),
                int(np.random.randint(1, max_rounds, 1))]
        max_sides = 6
        if rule[2] >= die_change_round:
            max_sides = 8
        rule.append(int(np.random.randint(1, max_sides, 1)))
        strategy['rules'].append(rule)
    return strategy
*/

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
        if (this.teams.indexOf(team_id) != -1) this.teams.push(team_id);
        return this.teams.indexOf(team_id);
};

RainGame.prototype.submit_strategy = function(team_id, strategy){
        this.strategies[team_id] = strategy;
        this.submit_forecast_bid(team_id, strategy['forecast_bid']);
        this.submit_drr_bid(team_id, strategy['drr_bid']);
};

RainGame.prototype.submit_forecast_bid = function(team_id, bid){
        team_index = this.get_team_index(team_id);
        this.forecast_bids[team_index] = bid;
};

RainGame.prototype.submit_drr_bid = function(team_id, bid){
        team_index = this.get_team_index(team_id);
        this.drr_bids[team_index] = bid;
};

RainGame.prototype.get_payments = function(regional_rainfall, forecast_teams, drr_teams, turn){
        /*
        0+ - if [F and DRR/F/DRR/neither] and [round eeq/geq/leq (1,10)] and
             [regional forecast >= int(1, 6 or 8)] then take early action
        */
        //payments = zeros(this.n_teams);
        payments = this.teams.map(function(team){
            team_index = this.get_team_index(team);
            rules = this.strategies[team]['rules']
            var payment = 0
            for(var rule in rules){
                var regional_forecast_bad = (regional_rainfall[team_index] >= rule[3]);
                if (regional_forecast_bad){
                    valid_round = (((rule[1] == 'eeq') & (turn == rule[2])) |
                              ((rule[1] == 'geq') & (turn >= rule[2])) |
                              ((rule[1] == 'leq') & (turn <= rule[2])));
                    if (valid_round){
                       var forecast = ((rule[0].indexOf('F') != -1) & forecast_teams[team_index]);
                       var drr = ((rule[0].indexOf('DRR')) & drr_teams[team_index]);
                       var neither = (rule[0].indexOf('neither') != -1);
                       if ((forecast & drr) | forecast | drr | neither) payment = 1;
                    };
                };
            };
            return payment;
        });
};

RainGame.prototype.simulateOnce = function(random_state){
        var beans = numeric.mul(this.n_beans, ones([this.n_teams]));
        var crises = zeros([this.n_teams]);

        //# perform forecast bids
        var forecast_bids = this.forecast_bids.slice(0);
        forecast_bids.sort();
        var half_teams = numeric.floor(this.n_teams/2);
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
                                    this.n_teams,
                                    this.target_rain);
            payments = this.get_payments(rain['regional'],
                                         forecast_teams, drr_teams,
                                         turn)
            beans = adjust_beans(beans.slice(0), payments, flooded, turn,
                                 drr_teams,
                                 this.penalty, this.drr_penalty,
                                 this.drr_round_start)
        };
        if (debug){
            console.log(beans.T);
        };
        return beans
};

RainGame.prototype.simulate = function(n_iters){
        /*
        var result_beans = np.zeros((self.n_teams, n_iters))
        winners = np.zeros((self.n_teams, n_iters))
        for i in range(n_iters):
            beans = self.simulate_once()
            result_beans[:, i] = beans
            winners[:, i] = beans == beans[np.argsort(beans)][-1]
        if debug:
            print result_beans
        crises = np.sum(result_beans * (result_beans < 0), axis=1)
        result = []
        for team in self.teams:
            team_index = self.get_team_index(team)
            result.append(dict(team=team,
                               summary=[np.sum(winners[team_index, :]),
                                        crises[team_index]]))
        return result
        */
};

                                             console.log(getRandom(1, 6, 10));
result = generateRainfall(6, 2, 10);
console.log(adjustBeans([10, 10], [1, 1], result['flood'], 1, [false, false], 4, 2, 2));
console.log(zeros([4]));

game = RainGame(10, 1, 10, 10, 7);
console.log(game);
game.simulateOnce(0);
