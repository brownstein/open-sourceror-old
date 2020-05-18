export default class CollisionManager {
  constructor () {
    this.contactEventHandlersById = {};
    this.entitiesByBodyId = {};
  }
  addHandler (id, handler) {
    if (!this.contactEventHandlersById[id]) {
      this.contactEventHandlersById[id] = [];
    }
    this.contactEventHandlersById[id].push(handler);
  }
  runHandlers (narrowphase) {
    narrowphase.contactEquations.forEach(eq => {
      const bodyAHandlers = this.contactEventHandlersById[eq.bodyA.id];
      const bodyBHandlers = this.contactEventHandlersById[eq.bodyB.id];
      if (bodyAHandlers) {
        bodyAHandlers.forEach(h => h(eq));
      }
      if (bodyBHandlers) {
        bodyBHandlers.forEach(h => h(eq));
      }
    });
  }
}
