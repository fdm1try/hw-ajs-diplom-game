import Character from '../Character';

export default class Bowman extends Character {
  constructor(level, type = 'bowman') {
    super(1, type);
    this.attack = 25;
    this.defence = 25;
    for (let i = 1; i < level; i += 1) {
      this.levelUp();
    }
  }
}
