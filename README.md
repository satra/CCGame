A web for the Red Cross Climate Center game.


Team id [enter/randomly assigned]
1 - bid X beans for forecast (F)
1 - bid Y beans for DRR
0+ - if [F and DRR/F/DRR/neither] and [round </>/=/>=/<= (1,10)] and [regional forecast > int] then take early action

0+ = 0 or more statements

once these are entered, across all participants then the backend will simulate the game and display the final bean count for each person as well as a visualization of this across the individuals over time (an updating d3 graph would work fine).

I am running the game, go to this website

    each client gets an unique ID associated with that client





Tables needed

    Users 

        id
        username
        password
        displayName
        competitions (list of comp_ids)

    Competition 

        id
        date created
        date simulated
        owner

        minTeams
        maxTeams

        simulationState

        individual_result
            [user_id, strategy_id, number of wins, number of crises]


    Stategy

        id
        owner (user_id)
        date created
        competition_id

        s_forecast_bid
        s_drr_bid
        s_rules
            ['neighter', geq', 7, 1]
            ['F', 'geq', 1, 5]
            ['FDDR', 'geq', 7, 7]

        aggregate_beans
        aggregate_crises

        