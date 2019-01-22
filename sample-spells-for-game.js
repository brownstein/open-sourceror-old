/**
 * Sample spell for game
 */
function startCreatingPath () {
  // circleSymbol, motionSymbol {
  me.on("MOVE", 2) {
    // lambdaSymbol voidSymbol(here + facing * 2) {
    if isEmpty(me.location + me.orientation * 2) {
      // "rock" <= "findSymbol" "rockSymbol" 1
      rock = find("rock", "1m");
      // moveSymbol "rock" selfSymbol + orientationSymbol * 2
      move(rock, me.location + me.orientation * 2);
    }
  }
}

// this should visually compile to:
/**
a large circle with a self icon paired with a motion icon
|- a lambda, an empty circle symbol with the eontents of isEmpty
  |- a find symbol, an empty circle containing a rock and a meter
    |- a motion symbol with a circle containing a location, orientation
*/
