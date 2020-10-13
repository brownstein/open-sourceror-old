
/**
 * A "lack of item" entity class, which reflects that an item has been removed
 * from the persistence state.
 */
export default class LackOfItem {
  constructor(persistId) {
    this.persistId = persistId;
  }
  persist() {
    return {
      removed: true
    };
  }
}
