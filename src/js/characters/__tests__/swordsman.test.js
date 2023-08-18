import Swordsman from '../Swordsman';

test('Test Swordsman character class', () => {
  const swordsman = new Swordsman(2);
  expect(swordsman).toEqual({
    type: 'swordsman',
    health: 100,
    level: 2,
    attack: 52,
    defence: 13,
  });
});

test('swordsman level-up test when health is very low', () => {
  const swordsman = new Swordsman(1);
  swordsman.health = 1;
  swordsman.levelUp();
  expect(swordsman).toEqual({
    type: 'swordsman',
    health: 81,
    level: 2,
    attack: 40,
    defence: 10,
  });
});
