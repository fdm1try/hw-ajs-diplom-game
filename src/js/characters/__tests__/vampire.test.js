import Vampire from '../Vampire';

test('Test vampire character class', () => {
  const vampire = new Vampire(2);
  expect(vampire).toEqual({
    type: 'vampire',
    health: 100,
    level: 2,
    attack: 32.5,
    defence: 32.5,
  });
});

test('Vampire level-up test when health is very low', () => {
  const vampire = new Vampire(1);
  vampire.health = 1;
  vampire.levelUp();
  expect(vampire).toEqual({
    type: 'vampire',
    health: 81,
    level: 2,
    attack: 25,
    defence: 25,
  });
});
