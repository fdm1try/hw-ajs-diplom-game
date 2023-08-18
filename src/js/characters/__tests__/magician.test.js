import Magician from '../Magician';

test('Test magician character class', () => {
  const magician = new Magician(2);
  expect(magician).toEqual({
    type: 'magician',
    health: 100,
    level: 2,
    attack: 13,
    defence: 52,
  });
});

test('Magician level-up test when health is very low', () => {
  const magician = new Magician(1);
  magician.health = 1;
  magician.levelUp();
  expect(magician).toEqual({
    type: 'magician',
    health: 81,
    level: 2,
    attack: 10,
    defence: 40,
  });
});
