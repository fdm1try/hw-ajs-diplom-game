import { characterGenerator, generateTeam } from '../generators';

test(
  'Character generation does not create characters with a level higher than specified, character types always correspond to the types specified in allowedTypes',
  () => {
    const allowedTypes = ['swordsman', 'undead'];
    const maxLevel = 3;
    const generator = characterGenerator(allowedTypes, maxLevel);
    let count = 100;
    while (count) {
      const character = generator.next().value;
      expect(allowedTypes).toContain(character.type);
      expect(character.level).toBeLessThanOrEqual(maxLevel);
      count -= 1;
    }
  },
);

test(
  'The generated command has the size specified in count, the level is not higher than maxLevel, character types always correspond to the types specified in allowedTypes',
  () => {
    const allowedTypes = ['vampire', 'magician', 'daemon'];
    const maxLevel = 3;
    const count = 15;
    const team = generateTeam(allowedTypes, maxLevel, count);
    expect(team.characters.length).toBe(count);
    for (const character of team.characters) {
      expect(allowedTypes).toContain(character.type);
      expect(character.level).toBeLessThanOrEqual(maxLevel);
    }
  },
);
