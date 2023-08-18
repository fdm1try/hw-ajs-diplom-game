import PositionedCharacter from '../PositionedCharacter';
import Bowman from '../characters/Bowman';

test('Should throw an error if character is not instance of Character', () => {
  const check = () => new PositionedCharacter({}, 1);
  expect(check).toThrow();
});

test('Should throw an error if position is not a number', () => {
  const check = () => new PositionedCharacter(new Bowman(1), '');
  expect(check).toThrow();
});
