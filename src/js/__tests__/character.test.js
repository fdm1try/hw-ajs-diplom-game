import Character from '../Character';
import Bowman from '../characters/Bowman';

test('The maximum level of the character is 4, the characteristics do not increase when trying to level up above 4', () => {
  const character = new Bowman(4);
  const {
    defence, attack, level, health, type,
  } = character;
  character.levelUp();
  expect(character).toEqual({
    defence, attack, level, health, type,
  });
});

test('Character constructor should throw an error if it is called using new', () => {
  let character;
  try {
    character = new Character(1);
  } catch (error) {
    expect(error).toBeInstanceOf(Error);
  }
  expect(character).toBeUndefined();
});
