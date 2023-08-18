import { charactersMap } from './generators';
import PositionedCharacter from './PositionedCharacter';

export default class GameState {
  #score;

  constructor() {
    this.isPlayerMove = true;
    this.playerTeam = [];
    this.enemyTeam = [];
    this.level = 0;
    this.#score = 0;
    this.highScore = 0;
  }

  reset() {
    this.isPlayerMove = true;
    this.playerTeam = [];
    this.enemyTeam = [];
    this.level = 0;
    this.#score = 0;
  }

  get score() {
    return this.#score;
  }

  set score(newScore) {
    this.#score = newScore;
    if (this.highScore < newScore) {
      this.highScore = newScore;
    }
  }

  get allCharacters() {
    return [...this.playerTeam, ...this.enemyTeam];
  }

  get positions() {
    return this.allCharacters.map((item) => item.position);
  }

  removePosition(position) {
    this.playerTeam = this.playerTeam.filter((item) => item.position !== position);
    this.enemyTeam = this.enemyTeam.filter((item) => item.position !== position);
  }

  static getCharacterState(positionedCharacter) {
    const { type, level, health } = positionedCharacter.character;
    return {
      type,
      level,
      health,
      position: positionedCharacter.position,
    };
  }

  get json() {
    return {
      score: this.#score,
      level: this.level,
      isPlayerMove: this.isPlayerMove,
      playerTeam: this.playerTeam.map(GameState.getCharacterState),
      enemyTeam: this.enemyTeam.map(GameState.getCharacterState),
    };
  }

  static from(object) {
    const state = new GameState();
    state.#score = 'score' in object ? object.score : 0;
    state.level = 'level' in object ? object.level : 0;
    if (
      !('playerTeam' in object)
      || !('enemyTeam' in object)
      || !Array.isArray(object.playerTeam)
      || !Array.isArray(object.enemyTeam)
      || !object.playerTeam.length
      || !object.enemyTeam.length
    ) {
      throw new Error('Invalid state');
    }
    const parse = (data) => {
      const character = new charactersMap[data.type](data.level);
      character.health = data.health;
      return new PositionedCharacter(character, data.position);
    };
    state.playerTeam = object.playerTeam.map(parse);
    state.enemyTeam = object.enemyTeam.map(parse);
    return state;
  }
}
