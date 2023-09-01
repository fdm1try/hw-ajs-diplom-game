import { charactersMap } from './generators';
import PositionedCharacter from './PositionedCharacter';
import Team from './Team';

export default class GameState {
  #score;

  #positions;

  constructor() {
    this.isPlayerMove = true;
    this.playerTeam = new Team();
    this.enemyTeam = new Team();
    this.#positions = new Map();
    this.level = 0;
    this.#score = 0;
    this.highScore = 0;
    this.isGameOver = false;
  }

  reset() {
    this.isPlayerMove = true;
    this.playerTeam = new Team();
    this.enemyTeam = new Team();
    this.#positions = new Map();
    this.isGameOver = false;
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

  getAllPositionedCharacters() {
    return [...this.playerTeam.characters, ...this.enemyTeam.characters]
      .map((character) => new PositionedCharacter(character, this.#positions.get(character)));
  }

  get positions() {
    return [...this.#positions.values()];
  }

  getPosition(character) {
    return this.#positions.get(character);
  }

  setPosition(character, position) {
    this.#positions.set(character, position);
  }

  removePosition(position) {
    const character = this.findPCByPosition(position);
    if (!character) return false;
    this.#positions.delete(character);
    const team = [this.playerTeam, this.enemyTeam].find((_team) => _team.has(character));
    team.remove(character);
    return true;
  }

  findPCByPosition(index) {
    for (const [character, position] of this.#positions) {
      if (position === index) {
        return character;
      }
    }
    return null;
  }

  getTeamState(team) {
    return team.characters.map((character) => {
      const { type, level, health } = character;
      const position = this.getPosition(character);
      return {
        type, level, health, position,
      };
    });
  }

  setTeamState(team, data) {
    if (team.size > 0) {
      throw new Error('Can not set state of not empty team');
    }
    for (const item of data) {
      const character = new charactersMap[item.type](item.level);
      character.health = item.health;
      team.add(character);
      this.#positions.set(character, item.position);
    }
  }

  get json() {
    return {
      score: this.#score,
      level: this.level,
      isGameOver: this.isGameOver,
      isPlayerMove: this.isPlayerMove,
      playerTeam: this.getTeamState(this.playerTeam),
      enemyTeam: this.getTeamState(this.enemyTeam),
    };
  }

  static from(object) {
    const state = new GameState();
    state.#score = 'score' in object ? object.score : 0;
    state.level = 'level' in object ? object.level : 0;
    state.isGameOver = !!object.isGameOver;
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
    state.setTeamState(state.playerTeam, object.playerTeam);
    state.setTeamState(state.enemyTeam, object.enemyTeam);
    return state;
  }
}
