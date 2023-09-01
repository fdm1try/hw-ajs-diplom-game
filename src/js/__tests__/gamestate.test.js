import GameState from '../GameState';

const savedStateSample = {
  score: 140,
  level: 1,
  isPlayerMove: true,
  isGameOver: false,
  playerTeam: [{
    type: 'swordsman',
    level: 2,
    health: 97,
    position: 8,
  }, {
    type: 'swordsman',
    level: 2,
    health: 100,
    position: 24,
  }, {
    type: 'swordsman',
    level: 2,
    health: 100,
    position: 49,
  }, {
    type: 'swordsman',
    level: 2,
    health: 99,
    position: 1,
  },
  ],
  enemyTeam: [{
    type: 'daemon',
    level: 1,
    health: 50,
    position: 15,
  }, {
    type: 'undead',
    level: 1,
    health: 50,
    position: 46,
  }, {
    type: 'daemon',
    level: 1,
    health: 50,
    position: 22,
  }, {
    type: 'vampire',
    level: 1,
    health: 50,
    position: 39,
  },
  ],
};
let gameState;

beforeEach(() => {
  gameState = GameState.from(savedStateSample);
});

test('The json() function returns the state as an object', () => {
  expect(gameState.json).toEqual(savedStateSample);
});

test('The reset() function resets points, level, and teams', () => {
  gameState.reset();
  expect(gameState.json).toEqual({
    score: 0,
    level: 0,
    isGameOver: false,
    isPlayerMove: true,
    playerTeam: [],
    enemyTeam: [],
  });
});

test('When there are more points than ever, the highscore is equal to the current score', () => {
  const newScore = gameState.score + 100;
  gameState.score = newScore;
  expect(gameState.score).toBe(newScore);
  expect(gameState.highScore).toBe(newScore);
});

test(
  'If the number of points is changed to less than or equal to highscore, then highscore does not change',
  () => {
    gameState.score += 100;
    const { highScore } = gameState;
    gameState.score -= 100;
    expect(gameState.highScore).toBe(highScore);
  },
);

test(
  'Function allCharacters() returns a list of characters of both teams, the positions property - the positions of the characters of both teams',
  () => {
    const positionedCharacters = gameState.getAllPositionedCharacters();
    const characters = positionedCharacters.map((item) => item.character);
    const positions = positionedCharacters.map((item) => item.position);
    expect(gameState.positions).toEqual(positions);
    const expected = [...gameState.playerTeam.characters, ...gameState.enemyTeam.characters];
    expect(characters).toEqual(expected);
  },
);

test('After removing the position, the character is removed from his team', () => {
  const [character] = gameState.playerTeam.characters;
  const position = gameState.getPosition(character);
  gameState.removePosition(position);
  const result = gameState.findPCByPosition(position);
  expect(result).toBeNull();
});

test(
  'An error is thrown if there is no data about one of the commands or one of them is empty',
  () => {
    const parseState = () => GameState.from({ playerTeam: [1], enemies: [2] });
    expect(parseState).toThrow();
  },
);

test(
  'An error is thrown when trying to change the state of the command when it is not empty',
  () => {
    const check = () => gameState.setTeamState(gameState.playerTeam, {});
    expect(check).toThrow();
  },
);

test('The removePosition() function return false if it empty', () => {
  const result = gameState.removePosition(5);
  expect(result).toBe(false);
});
