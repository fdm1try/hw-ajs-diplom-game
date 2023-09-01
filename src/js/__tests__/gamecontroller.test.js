import GamePlay from '../GamePlay';
import GameController from '../GameController';
import GameStateService from '../GameStateService';
import Character from '../Character';
import Team from '../Team';

global.console = {
  error: jest.fn(),
};

const mockShowCellTooltip = jest.spyOn(GamePlay.prototype, 'showCellTooltip');
const mockShowDamage = jest.spyOn(GamePlay.prototype, 'showDamage');
const mockRegisterAction = jest.spyOn(GameController.prototype, 'registerAction');
const mockShowMessage = jest.spyOn(GamePlay, 'showMessage');
const mockShowError = jest.spyOn(GamePlay, 'showError');
const mockDeselectCell = jest.spyOn(GamePlay.prototype, 'deselectCell');
const mockSelectCell = jest.spyOn(GamePlay.prototype, 'selectCell');
const mockAttack = jest.spyOn(GameController.prototype, 'attack');
const mockCharacterLevelUp = jest.spyOn(Character.prototype, 'levelUp');

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

function dispatchEvent(el, eventType) {
  const event = new MouseEvent(eventType, {
    view: window,
    bubbles: true,
    cancelable: true,
  });
  el.dispatchEvent(event);
}

function dispatchEventOnCell(cellId, eventType) {
  const el = document.querySelector(`.board .cell:nth-child(${cellId + 1})`);
  return dispatchEvent(el, eventType);
}

let gameCtrl;
let localStorageData;

beforeAll(() => {
  global.Storage.prototype.getItem = jest.fn((key) => localStorageData.get(key));
  global.Storage.prototype.setItem = jest.fn((key, value) => localStorageData.set(key, value));
});

beforeEach(() => {
  localStorageData = new Map();
  const gamePlay = new GamePlay();
  document.body.innerHTML = '<div id="game-container"></div>';
  gamePlay.bindToDOM(document.querySelector('#game-container'));
  const stateService = new GameStateService(localStorage);
  gameCtrl = new GameController(gamePlay, stateService);
  gameCtrl.init();
});

afterAll(() => {
  global.Storage.prototype.setItem.mockReset();
  global.Storage.prototype.getItem.mockReset();
});

test('The character\'s characteristics are displayed correctly when you hover the cursor over it', async () => {
  const [entity] = gameCtrl.gameState.getAllPositionedCharacters();
  dispatchEventOnCell(entity.position, 'mouseenter');
  const {
    defence, attack, health, level,
  } = entity.character;
  const expectedText = `🎖${level} ⚔${attack} 🛡${defence} ❤${health}`;
  expect(mockShowCellTooltip).toHaveBeenCalledTimes(1);
  expect(mockShowCellTooltip).toHaveBeenCalledWith(expectedText, entity.position);
});

test('The character\'s movement will not happen if the cell is out of his movement zone', async () => {
  const character = gameCtrl.gameState.playerTeam.characters[0];
  const position = gameCtrl.gameState.getPosition(character);
  const cell = character.moveDistance + 1 + position;
  const result = gameCtrl.move(character, cell);
  const newPosition = gameCtrl.gameState.getPosition(character);
  expect(result).toBe(false);
  expect(newPosition).toBe(position);
});

test('The movement of the character will occur if the cell is in the zone of his movement', async () => {
  const character = gameCtrl.gameState.playerTeam.characters[0];
  const position = gameCtrl.gameState.getPosition(character);
  const cell = character.moveDistance + position;
  const result = gameCtrl.move(character, cell);
  const newPosition = gameCtrl.gameState.getPosition(character);
  expect(result).toBe(true);
  expect(newPosition).toBe(cell);
});

test('The attack will not occur if the target is out of the affected area, an error will be thrown', async () => {
  const attacker = gameCtrl.gameState.playerTeam.characters[0];
  const target = gameCtrl.gameState.enemyTeam.characters[0];
  expect(gameCtrl.attack(attacker, target)).rejects.toThrow();
});

test('Both attacker and target must be Character during the attack, an error will be thrown', async () => {
  const attacker = gameCtrl.gameState.playerTeam.characters[0];
  const result = gameCtrl.attack(attacker, {});
  expect(result).rejects.toThrow();
});

test('The attack occurs when the target is in the affected area, a damage animation appears', async () => {
  const attacker = gameCtrl.gameState.playerTeam.characters[0];
  const attackerPosition = gameCtrl.gameState.getPosition(attacker);
  const target = gameCtrl.gameState.enemyTeam.characters[0];
  gameCtrl.gameState.setPosition(target, attackerPosition + attacker.attackDistance);
  const result = gameCtrl.attack(attacker, target);
  expect(result).resolves.not.toThrow();
  expect(mockShowDamage).toHaveBeenCalled();
  expect(mockRegisterAction).toHaveBeenCalled();
});

test('The current state of the game is saved correctly', () => {
  const state = gameCtrl.gameState.json;
  gameCtrl.gamePlay.saveGameEl.click();
  expect(mockShowMessage).toHaveBeenCalledWith('Game saved successfully.');
  const data = JSON.parse(localStorageData.get('state'));
  expect(data).toEqual(state);
});

test('Loading the game state throws an error if the data format is not correct', () => {
  localStorageData.set('state', '{ ivalid: format');
  const stateBefore = gameCtrl.gameState.json;
  gameCtrl.gamePlay.loadGameEl.click();
  expect(mockShowError).toHaveBeenCalledWith(new Error('Invalid state'));
  expect(gameCtrl.gameState.json).toEqual(stateBefore);
});

test('The loading of the game state is successful, a notification appears', () => {
  localStorageData.set('state', JSON.stringify(savedStateSample));
  gameCtrl.gamePlay.loadGameEl.click();
  expect(mockShowMessage).toHaveBeenCalledWith('Game loaded successfully.');
  expect(gameCtrl.gameState.json).toEqual(savedStateSample);
});

test('If there is a player in the enemy team\'s defeat zone, the enemy team\'s turn ends with an attack', () => {
  const player = gameCtrl.gameState.playerTeam.characters[0];
  for (const character of gameCtrl.gameState.playerTeam.characters) {
    if (character !== player) {
      gameCtrl.gameState.playerTeam.remove(character);
    }
  }
  player.health = 1;
  const enemy = gameCtrl.gameState.enemyTeam.characters[0];
  const enemyPosition = gameCtrl.gameState.getPosition(enemy);
  gameCtrl.gameState.setPosition(player, enemyPosition - 1);
  const result = gameCtrl.makeEnemyMove();
  expect(result).resolves.not.toThrow();
  expect(mockAttack).toHaveBeenCalled();
  expect(mockRegisterAction).toHaveBeenCalled();
});

test('After starting a new game, all the characters on the playing field are created and placed anew', () => {
  const prevState = gameCtrl.gameState.json;
  gameCtrl.gamePlay.newGameEl.click();
  expect(gameCtrl.gameState.json).not.toEqual(prevState);
});

test('If there are no characters left in the player\'s team, the game will be over after calling registerAction', () => {
  gameCtrl.gameState.playerTeam = new Team();
  gameCtrl.registerAction();
  expect(gameCtrl.gameState.isGameOver).toBeTruthy();
});

test('After completing the level of the game, the level of the remaining characters increases and the next level starts', () => {
  const prevCallsCount = mockCharacterLevelUp.mock.calls.length;
  const prevLevel = gameCtrl.gameState.level;
  gameCtrl.nextLevel();
  const callsCount = gameCtrl.gameState.playerTeam.size
    + gameCtrl.gameState.enemyTeam.characters.reduce(
      (sum, enemy) => enemy.level - 1 + sum,
      0,
    );
  expect(gameCtrl.gameState.level).toBe(prevLevel + 1);
  expect(mockCharacterLevelUp).toHaveBeenCalledTimes(prevCallsCount + callsCount);
});

test('After completing the last level of the game, the game is over', () => {
  gameCtrl.gameState.level = 3;
  gameCtrl.nextLevel();
  expect(gameCtrl.gameState.isGameOver).toBeTruthy();
});

test('When a level starts and there are no characters in one of the teams, the game ends', () => {
  gameCtrl.gameState.playerTeam = new Team();
  gameCtrl.runLevel(1);
  expect(gameCtrl.gameState.isGameOver).toBeTruthy();
});

test('When trying to select an enemy team character, an error appears', () => {
  const [enemy] = gameCtrl.gameState.enemyTeam.characters;
  const position = gameCtrl.gameState.getPosition(enemy);
  dispatchEventOnCell(position, 'click');
  expect(mockShowError).toHaveBeenCalledWith('Нельзя выбрать персонажа вражеской команды');
});

test('When you try to select a character of your team, his position is saved in the controller', () => {
  const [player] = gameCtrl.gameState.playerTeam.characters;
  const position = gameCtrl.gameState.getPosition(player);
  dispatchEventOnCell(position, 'click');
  expect(gameCtrl.gameState.selectedCharacter).toEqual(player);
});

test(
  'When trying to select a character of your team when another character has already been selected, the selection is removed and the selection is fixed on the selected character',
  () => {
    const [first, second] = gameCtrl.gameState.playerTeam.characters;
    const firstPosition = gameCtrl.gameState.getPosition(first);
    const secondPosition = gameCtrl.gameState.getPosition(second);
    dispatchEventOnCell(firstPosition, 'click');
    dispatchEventOnCell(secondPosition, 'click');
    expect(mockDeselectCell).toHaveBeenCalledWith(firstPosition);
    expect(gameCtrl.gameState.selectedCharacter).toEqual(second);
  },
);

test('When trying to select an empty cell when a character is already selected and movement is impossible, the selection is removed', () => {
  const player = gameCtrl.gameState.playerTeam.characters[0];
  const position = gameCtrl.gameState.getPosition(player);
  dispatchEventOnCell(position, 'click');
  dispatchEventOnCell(position + 5, 'click');
  expect(mockDeselectCell).toHaveBeenCalledWith(position);
  expect(gameCtrl.gameState.selectedCharacter).toBeNull();
});

test(
  'When trying to select an empty cell, when a character is already selected and movement is possible, the character moves to this cell',
  () => {
    const player = gameCtrl.gameState.playerTeam.characters[0];
    const position = gameCtrl.gameState.getPosition(player);
    const newPosition = position + 1;
    dispatchEventOnCell(position, 'click');
    dispatchEventOnCell(newPosition, 'click');
    expect(mockDeselectCell).toHaveBeenCalledWith(position);
    expect(mockSelectCell).toHaveBeenCalledWith(newPosition);
    const result = gameCtrl.gameState.getPosition(player);
    expect(result).toBe(newPosition);
  },
);

test('If a character is selected and a click occurs on the cell of an enemy character, an attack on an enemy occurs', () => {
  const player = gameCtrl.gameState.playerTeam.characters[0];
  const playerPosition = gameCtrl.gameState.getPosition(player);
  const enemy = gameCtrl.gameState.enemyTeam.characters[0];
  const healthBefore = enemy.health;
  gameCtrl.gameState.setPosition(enemy, playerPosition + 1);
  dispatchEventOnCell(playerPosition, 'click');
  dispatchEventOnCell(playerPosition + 1, 'click');
  expect(enemy.health).toBeLessThan(healthBefore);
});

test('If a character is selected and the cursor is hovered over a cell of an enemy character, the cell is highlighted in red', () => {
  const [player] = gameCtrl.gameState.playerTeam.characters;
  const [enemy] = gameCtrl.gameState.enemyTeam.characters;
  const enemyPosition = gameCtrl.gameState.getPosition(enemy);
  gameCtrl.gameState.setPosition(player, enemyPosition - 1);
  dispatchEventOnCell(enemyPosition - 1, 'click');
  dispatchEventOnCell(enemyPosition, 'mouseenter');
  expect(mockSelectCell).toHaveBeenCalledWith(enemyPosition, 'red');
});

test(
  'If a character is selected and the cursor is hovered over an empty cell in the character\'s movement area, the cell is highlighted in yellow',
  () => {
    const player = gameCtrl.gameState.playerTeam.characters[0];
    const playerPosition = gameCtrl.gameState.getPosition(player);
    dispatchEventOnCell(playerPosition, 'click');
    dispatchEventOnCell(playerPosition + 1, 'mouseenter');
    expect(mockSelectCell).toHaveBeenCalledWith(playerPosition + 1, 'green');
  },
);
