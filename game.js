/**
 * Created with PyCharm.
 * User: satra
 * Date: 5/10/13
 * Time: 4:11 PM
 * To change this template use File | Settings | File Templates.
 */

function getRandom(min, max, n_samples){
    var arr = new Array(n_samples);
    for(var i=0; i<n_samples; i++){
        arr[i] = Math.floor(min + Math.random() * (max - min - 1));
    }
    return arr;
};

function generate_rainfall(n_sides, n_teams, target_rain){
    /*Randomly generate local and regional rainfall and determine flooding

     */
    regional_rainfall = getRandom(1, n_sides, n_teams);
    local_rainfall = getRandom(1, 6, n_teams)
    total_rainfall = local_rainfall + regional_rainfall
    flooded = []
    flooded = (total_rainfall >= target_rain).astype(np.int)
    if debug:
        print regional_rainfall.T, local_rainfall.T, flooded.T
    return regional_rainfall, local_rainfall, flooded
};


function adjust_beans(beans, payments, flooded, round_idx, drr_teams,
                 penalty, drr_penalty, drr_round_start){
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
};