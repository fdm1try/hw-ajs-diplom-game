export default class GameStateService {
  constructor(storage) {
    this.storage = storage;
  }

  save(state) {
    this.storage.setItem('state', JSON.stringify(state));
  }

  load() {
    try {
      return JSON.parse(this.storage.getItem('state'));
    } catch (e) {
      throw new Error('Invalid state');
    }
  }

  saveByLabel(label, data) {
    this.storage.setItem(label, JSON.stringify(data));
  }

  loadByLabel(label) {
    try {
      return JSON.parse(this.storage.getItem(label));
    } catch (e) {
      throw new Error('Invalid state');
    }
  }
}
