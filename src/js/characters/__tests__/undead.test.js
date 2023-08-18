import Undead from '../Undead';

test('Test Undead character class', () => {
  const undead = new Undead(2);
  expect(undead).toEqual({
    type: 'undead',
    health: 100,
    level: 2,
    attack: 52,
    defence: 13,
  });
});

test('undead level-up test when health is very low', () => {
  const undead = new Undead(1);
  undead.health = 1;
  undead.levelUp();
  expect(undead).toEqual({
    type: 'undead',
    health: 81,
    level: 2,
    attack: 40,
    defence: 10,
  });
});
