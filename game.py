"""
Strategy simulator for Red Cross Climate Center Game


"""
import numpy as np

def generate_rainfall(n_sides, n_teams, target_rain):
    """Randomly generate local and regional rainfall and determine flooding
    """
    regional_rainfall = np.random.randint(1, n_sides, size=(n_teams,))
    local_rainfall = np.random.randint(1, 7, size=(n_teams,))
    total_rainfall = local_rainfall + regional_rainfall
    flooded = (total_rainfall >= target_rain).astype(np.int)
    print regional_rainfall.T, local_rainfall.T, flooded.T
    return regional_rainfall, local_rainfall, flooded


def adjust_beans(beans, payments, flooded, round_idx, drr_teams,
                 penalty, drr_penalty, drr_round_start):
    if round_idx < drr_round_start:
        drr_penalty = penalty
    payments = payments * (beans > 0)
    penalized = np.maximum(flooded - payments, 0)
    beans_to_remove = drr_penalty * penalized * (drr_teams == 1) + \
                      penalty * penalized * (drr_teams == 0)
    already_in_crisis = beans * (beans < 0)
    beans[already_in_crisis < 0] = 0
    beans = beans - payments - beans_to_remove
    beans_joining_crisis = beans < 0
    beans = beans * (beans > 0)
    in_crisis = already_in_crisis - beans_joining_crisis
    return beans + in_crisis

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

class RainGame(object):

    def __init__(self, n_teams=10, n_persons_per_team=1, n_beans=10,
                 n_rounds = 10, die_change_round=7):
        self.n_teams = n_teams
        self.n_persons_per_team = n_persons_per_team
        self.n_beans = n_beans
        self.n_rounds = n_rounds
        self.n_die_change = die_change_round
        self.target_rain = 10
        self.penalty = 4
        self.drr_penalty = 2
        self.drr_round_start = 3
        self.forecast_bids = np.zeros((n_teams)) # receive regional forecast
        self.drr_bids = np.zeros((n_teams))  # have disaster risk reduction
        self.strategies = {}
        self.teams = []

    def get_team_index(self, team_id):
        if team_id not in self.teams:
            self.teams.append(team_id)
        return self.teams.index(team_id)

    def submit_strategy(self, team_id, strategy):
        self.strategies[team_id] = strategy
        self.submit_forecast_bid(team_id, bid=strategy['forecast_bid'])
        self.submit_drr_bid(team_id, bid=strategy['drr_bid'])

    def submit_forecast_bid(self, team_id, bid):
        team_index = self.get_team_index(team_id)
        self.forecast_bids[team_index] = bid

    def submit_drr_bid(self, team_id, bid):
        team_index = self.get_team_index(team_id)
        self.drr_bids[team_index] = bid

    def get_payments(self, regional_rainfall, forecast_teams, drr_teams, turn):
        """
        0+ - if [F and DRR/F/DRR/neither] and [round eeq/geq/leq (1,10)] and
             [regional forecast >= int(1, 6 or 8)] then take early action
        """
        payments = np.zeros(forecast_teams.shape)
        for team in self.teams:
            team_index = self.get_team_index(team)
            rules = self.strategies[team]['rules']
            payments[team_index] = 0
            for rule in rules:
                regional_forecast_bad = regional_rainfall[team_index] >= rule[3]
                if not regional_forecast_bad:
                    continue
                valid_round = ((rule[1] == 'eeq') & (turn == rule[2])) | \
                              ((rule[1] == 'geq') & (turn >= rule[2])) | \
                              ((rule[1] == 'leq') & (turn <= rule[2]))
                if not valid_round:
                    continue
                forecast = ('F' in rule[0]) & forecast_teams[team_index].astype(bool)
                drr = ('DRR' in rule[0]) & drr_teams[team_index].astype(bool)
                neither = 'neither' in rule[0]
                if ((forecast and drr) | forecast | drr | neither):
                    payments[team_index] = 1
                    break
        return payments

    def simulate(self, random_state=0):
        beans = self.n_beans * np.ones((self.n_teams))
        crises = np.zeros((self.n_teams))
        # perform forecast bids
        forecast_teams = np.ones(self.forecast_bids.shape)
        sort_index = np.argsort(self.forecast_bids)
        forecast_teams[sort_index[:self.n_teams/2]] = 0 # only half the teams win it

        # Winning teams pay their beans
        beans = beans - (forecast_teams * self.forecast_bids)

        # perform drr bids
        drr_teams = np.ones(self.drr_bids.shape)
        sort_index = np.argsort(self.drr_bids)
        drr_teams[sort_index[:-1]] = 0 # only one person wins it

        # Winning teams pay their beans
        beans = beans - (drr_teams * self.drr_bids)
        print beans.T
        print forecast_teams
        print drr_teams

        np.random.RandomState(random_state)

        for turn in range(1, self.n_rounds + 1):
            n_sides = 6
            if turn == self.n_die_change: # 7th round
                n_sides = 8
            regional_rainfall, local_rainfall, flooded = \
                generate_rainfall(n_sides=n_sides,
                                  n_teams=self.n_teams,
                                  target_rain=self.target_rain)
            payments = self.get_payments(regional_rainfall,
                                         forecast_teams, drr_teams,
                                         turn)
            beans = adjust_beans(beans.copy(), payments, flooded, turn,
                                 drr_teams,
                                 self.penalty, self.drr_penalty,
                                 self.drr_round_start)
        print beans.T
        result = {}
        for team in self.teams:
            result[team] = beans[self.get_team_index(team)]
        return result

if __name__ == "__main__":
    rg = RainGame()
    """
    0+ - if [F and DRR/F/DRR/neither] and [round eeq/geq/leq (1,10)] and
         [regional forecast >= int(1, 6 or 8)] then take early action
    # Conditions:
    If I have neither DRR nor forecast and round greater than 6 then take early action.
    If I have forecast and the rolled dice is more than 4 then take early action.
    If I have DRR and forecast and round greater than 6 and dice greater than 6 then take early action.
    By default take no action.
    """
    strategy = {'forecast_bid': 2,
                'drr_bid': 2,
                'rules': [['neither', 'geq', 7, 1],
                          ['F', 'geq', 1, 5],
                          ['F+DRR', 'geq', 7, 7],
                ]
    }
    rg.submit_strategy('T000', strategy)
    for team_id in range(1, rg.n_teams):
        rg.submit_strategy('T%03d' % team_id, generate_strategy(rg.n_beans,
                                                                rg.n_rounds,
                                                                rg.n_die_change))
    result = rg.simulate()
    print result


