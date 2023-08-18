import AI from '../AI';
import Magician from '../characters/Magician';
import Undead from '../characters/Undead';
import Bowman from '../characters/Bowman';
import PositionedCharacter from '../PositionedCharacter';

const getDistanceData = [
  [9, 50, 10, [-9, 5]],
  [4, 20, 8, [0, 2]],
  [10, 32, 7, [1, 3]],
  [0, 16, 6, [4, 2]],
  [1, 30, 5, [-1, 6]],
];
const canAttackData = [
  [1, 7, 4, 8, false],
  [40, 58, 2, 8, true],
  [50, 55, 1, 8, false],
  [15, 46, 6, 8, true],
];
const canMoveData = [
  [1, 7, 4, 8, false],
  [40, 58, 2, 8, true],
  [50, 55, 1, 8, false],
  [15, 47, 6, 8, true],
];

const getDistanceTestHandler = test.each(getDistanceData);
const canAttackTestHandler = test.each(canAttackData);
const canMoveTestHandler = test.each(canMoveData);

getDistanceTestHandler(
  'Distance from %i to %i with board size %i should be: %o',
  (from, to, size, expected) => {
    const result = AI.getDistance(from, to, size);
    expect(result).toEqual(expected);
  },
);

canAttackTestHandler(
  'Can character attack from cell %i to %i with attack range %i and board size %i? Should be: %o',
  (from, to, range, size, expected) => {
    const result = AI.canAttack(from, to, range, size);
    expect(result).toBe(expected);
  },
);

canMoveTestHandler(
  'Can character move from cell %i to %i with move range %i and board size %i? Should be: %o',
  (from, to, range, size, expected) => {
    const result = AI.canMove(from, to, range, size);
    expect(result).toBe(expected);
  },
);

test('Testing the attack threat search function', () => {
  const magician = new PositionedCharacter(new Magician(1), 9);
  const bowman = new PositionedCharacter(new Bowman(1), 12);
  const undead = new PositionedCharacter(new Undead(1), 22);
  const threats = AI.getThreats([undead], [magician, bowman], 8);
  expect(threats).toEqual([{
    attacker: bowman,
    target: undead,
  }]);
});

test('Testing the search function for moving options', () => {
  const magician = new PositionedCharacter(new Magician(1), 7);
  const moves = AI.getMovesToCell(magician, 8, 8);
  expect(moves[0]).toEqual({ distance: 4, position: 3 });
});

test('Function AI.getDistance should throw an error if the boardSize is unknown', () => {
  const check = () => AI.getDistance(0, 5);
  expect(check).toThrow();
});

test('Function AI.canAttack should throw an error if the boardSize is unknown', () => {
  const check = () => AI.canAttack(0, 3, 4);
  expect(check).toThrow();
});

test('Function AI.canMove should throw an error if the boardSize is unknown', () => {
  const check = () => AI.canMove(0, 3, 4);
  expect(check).toThrow();
});

test('Function AI.getThreats should throw an error if the boardSize is unknown', () => {
  const check = () => AI.getThreats([], []);
  expect(check).toThrow();
});

test('Function AI.getMovesToCell should throw an error if the boardSize is unknown', () => {
  const check = () => AI.getMovesToCell({}, 3);
  expect(check).toThrow();
});
