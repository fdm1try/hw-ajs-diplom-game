import Character from '../Character';

export default class Daemon extends Character {
  constructor(level, type = 'daemon') {
    super(1, type);
    this.attack = 10;
    this.defence = 10;
    for (let i = 1; i < level; i += 1) {
      this.levelUp();
    }
  }
}
