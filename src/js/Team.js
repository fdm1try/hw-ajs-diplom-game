import Character from './Character';
/**
 * Класс, представляющий персонажей команды
 *
 * @todo Самостоятельно продумайте хранение персонажей в классе
 * Например
 * @example
 * ```js
 * const characters = [new Swordsman(2), new Bowman(1)]
 * const team = new Team(characters);
 *
 * team.characters // [swordsman, bowman]
 * ```
 * */
export default class Team {
  // TODO: write your logic here
  #members;

  constructor() {
    this.#members = [];
  }

  add(character) {
    if (character instanceof Character) {
      this.#members.push(character);
      return true;
    }
    return false;
  }

  remove(character) {
    this.#members = this.#members.filter((item) => item !== character);
  }

  get characters() {
    return [...this.#members];
  }

  has(character) {
    return this.#members.includes(character);
  }

  get size() {
    return this.#members.length;
  }
}
