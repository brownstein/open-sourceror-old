"use strict";

const script =
`"use strict";
// language of the ancients (es5)

// on(NEARBY_ENEMY, function (enemy) {
//   log(1);
//   fire(getDirection(enemy));
// });

new Promise((r) => setTimeout(() => r(2), 2000))
.then(log)
.then(log);

log(0);
`;

module.exports = script;
