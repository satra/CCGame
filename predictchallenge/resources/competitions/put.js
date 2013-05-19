if (!(me)) {
    cancel("You need to be authenticated to submit a strategy.", 401);
}
emit("StrategyPosted", this);