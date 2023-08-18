import Bowman from '../Bowman';

test('Test bowman character class', () => {
  const bowman = new Bowman(2);
  expect(bowman).toEqual({
    type: 'bowman',
    health: 100,
    level: 2,
    attack: 32.5,
    defence: 32.5,
  });
});

test('Bowman level-up test when health is very low', () => {
  const bowman = new Bowman(1);
  bowman.health = 1;
  bowman.levelUp();
  expect(bowman).toEqual({
    type: 'bowman',
    health: 81,
    level: 2,
    attack: 25,
    defence: 25,
  });
});
