import Daemon from '../Daemon';

test('Test Daemon character class', () => {
  const daemon = new Daemon(2);
  expect(daemon).toEqual({
    type: 'daemon',
    health: 100,
    level: 2,
    attack: 13,
    defence: 13,
  });
});

test('daemon level-up test when health is very low', () => {
  const daemon = new Daemon(1);
  daemon.health = 1;
  daemon.levelUp();
  expect(daemon).toEqual({
    type: 'daemon',
    health: 81,
    level: 2,
    attack: 10,
    defence: 10,
  });
});
