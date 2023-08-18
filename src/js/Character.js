/**
 * Базовый класс, от которого наследуются классы персонажей
 * @property level - уровень персонажа, от 1 до 4
 * @property attack - показатель атаки
 * @property defence - показатель защиты
 * @property health - здоровье персонажа
 * @property type - строка с одним из допустимых значений:
 * swordsman
 * bowman
 * magician
 * daemon
 * undead
 * vampire
 * @method levelUp
 */
export default class Character {
  constructor(level, type = 'generic') {
    if (new.target.name === 'Character') {
      throw new Error('');
    }
    this.level = level;
    this.attack = 0;
    this.defence = 0;
    this.health = 50;
    this.type = type;
  }

  damage(attackPower) {
    const damage = Math.round(Math.max(attackPower - this.defence, attackPower * 0.1));
    this.health -= damage;
    return damage;
  }

  levelUp() {
    if (this.level < 4) {
      this.attack = Math.max(this.attack, (this.attack * (80 + this.health)) / 100);
      this.defence = Math.max(this.defence, (this.defence * (80 + this.health)) / 100);
      this.level += 1;
    }
    this.health += 80;
    if (this.health > 100) {
      this.health = 100;
    }
  }
}
