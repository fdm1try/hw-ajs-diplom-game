import Character from '../Character';

export default class Magician extends Character {
  constructor(level, type = 'magician') {
    super(1, type);
    this.attack = 10;
    this.defence = 40;
    for (let i = 1; i < level; i += 1) {
      this.levelUp();
    }
  }
}
