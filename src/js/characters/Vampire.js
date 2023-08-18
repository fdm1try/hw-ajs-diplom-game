import Character from '../Character';

export default class Vampire extends Character {
  constructor(level, type = 'vampire') {
    super(1, type);
    this.attack = 25;
    this.defence = 25;
    for (let i = 1; i < level; i += 1) {
      this.levelUp();
    }
  }
}
