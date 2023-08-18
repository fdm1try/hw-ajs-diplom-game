import Character from './Character';

const moveDistance = {
  swordsman: 1,
  undead: 1,
  bowman: 2,
  vampire: 2,
  magician: 4,
  daemon: 4,
};

const attackDistance = {
  swordsman: 1,
  undead: 1,
  bowman: 2,
  vampire: 2,
  magician: 4,
  daemon: 4,
};

export default class PositionedCharacter {
  constructor(character, position) {
    if (!(character instanceof Character)) {
      throw new Error('character must be instance of Character or its children');
    }

    if (typeof position !== 'number' || position < 0) {
      throw new Error('position must be a number');
    }

    this.character = character;
    this.position = position;
  }

  get moveDistance() {
    return moveDistance[this.character.type];
  }

  get attackDistance() {
    return attackDistance[this.character.type];
  }
}
