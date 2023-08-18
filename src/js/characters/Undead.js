import Character from '../Character';

export default class Undead extends Character {
  constructor(level, type = 'undead') {
    super(1, type);
    this.attack = 40;
    this.defence = 10;
    for (let i = 1; i < level; i += 1) {
      this.levelUp();
    }
  }
}
