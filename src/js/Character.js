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
  constructor(level, type = 'generic', attack = 0, defence = 0) {
    if (new.target.name === 'Character') {
      throw new Error('You cannot call the Character constructor, use Bowman, Swordsman, Magician and others to create a character');
    }
    this.level = 1;
    this.attack = attack;
    this.defence = defence;
    this.health = 50;
    this.type = type;
    while (this.level < level) {
      this.levelUp();
    }
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
