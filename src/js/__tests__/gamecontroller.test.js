import GamePlay from '../GamePlay';
import GameController from '../GameController';
import GameStateService from '../GameStateService';
import Character from '../Character';

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
  const entity = gameCtrl.gameState.allCharacters[0];
  dispatchEventOnCell(entity.position, 'mouseenter');
  const {
    defence, attack, health, level,
  } = entity.character;
  const expectedText = `🎖${level} ⚔${attack} 🛡${defence} ❤${health}`;
  expect(mockShowCellTooltip).toHaveBeenCalledTimes(1);
  expect(mockShowCellTooltip).toHaveBeenCalledWith(expectedText, entity.position);
});

test('The character\'s movement will not happen if the cell is out of his movement zone', async () => {
  const entity = gameCtrl.gameState.playerTeam[0];
  const previousPosition = entity.position;
  const cell = entity.moveDistance + 1 + entity.position;
  const result = gameCtrl.move(entity, cell);
  expect(result).toBe(false);
  expect(entity.position).toBe(previousPosition);
});

test('The movement of the character will occur if the cell is in the zone of his movement', async () => {
  const entity = gameCtrl.gameState.playerTeam[0];
  const cell = entity.moveDistance + entity.position;
  const result = gameCtrl.move(entity, cell);
  expect(result).toBe(true);
  expect(entity.position).toBe(cell);
});

test('The attack will not occur if the target is out of the affected area, an error will be thrown', async () => {
  const attacker = gameCtrl.gameState.playerTeam[0];
  const target = gameCtrl.gameState.enemyTeam[0];
  expect(gameCtrl.attack(attacker, target)).rejects.toThrow();
});

test('Both attacker and target must be PositionedCharacter during the attack, an error will be thrown', async () => {
  const attacker = gameCtrl.gameState.playerTeam[0];
  const target = gameCtrl.gameState.enemyTeam[0];
  const range = attacker.attackDistance;
  target.position = attacker.position + range;
  expect(gameCtrl.attack(attacker, target.character)).rejects.toThrow();
});

test('The attack occurs when the target is in the affected area, a damage animation appears', async () => {
  const attacker = gameCtrl.gameState.playerTeam[0];
  const target = gameCtrl.gameState.enemyTeam[0];
  const range = attacker.attackDistance;
  target.position = attacker.position + range;
  const promise = gameCtrl.attack(attacker, target);
  expect(promise).resolves.not.toThrow();
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
  const player = gameCtrl.gameState.playerTeam[0];
  gameCtrl.gameState.playerTeam = gameCtrl.gameState.playerTeam.filter((item) => item !== player);
  player.character.health = 1;
  const enemy = gameCtrl.gameState.enemyTeam[0];
  player.position = enemy.position - 1;
  const promise = gameCtrl.makeEnemyMove();
  expect(promise).resolves.not.toThrow();
  expect(mockAttack).toHaveBeenCalled();
  expect(mockRegisterAction).toHaveBeenCalled();
});

test('After starting a new game, all the characters on the playing field are created and placed anew', () => {
  const prevState = gameCtrl.gameState.json;
  gameCtrl.gamePlay.newGameEl.click();
  expect(gameCtrl.gameState.json).not.toEqual(prevState);
});

test('If there are no characters left in the player\'s team, the game will be over after calling registerAction', () => {
  gameCtrl.gameState.playerTeam = [];
  gameCtrl.registerAction();
  expect(gameCtrl.isGameOver).toBeTruthy();
});

test('After completing the level of the game, the level of the remaining characters increases and the next level starts', () => {
  const prevCallsCount = mockCharacterLevelUp.mock.calls.length;
  const prevLevel = gameCtrl.gameState.level;
  gameCtrl.nextLevel();
  const callsCount = gameCtrl.gameState.playerTeam.length
    + gameCtrl.gameState.enemyTeam.reduce((sum, enemy) => enemy.character.level - 1 + sum, 0);
  expect(gameCtrl.gameState.level).toBe(prevLevel + 1);
  expect(mockCharacterLevelUp).toHaveBeenCalledTimes(prevCallsCount + callsCount);
});

test('After completing the last level of the game, the game is over', () => {
  gameCtrl.gameState.level = 3;
  gameCtrl.nextLevel();
  expect(gameCtrl.isGameOver).toBeTruthy();
});

test('When a level starts and there are no characters in one of the teams, the game ends', () => {
  gameCtrl.runLevel([], gameCtrl.gameState.enemyTeam);
  expect(gameCtrl.isGameOver).toBeTruthy();
});

test('When trying to select an enemy team character, an error appears', () => {
  const enemy = gameCtrl.gameState.enemyTeam[0];
  dispatchEventOnCell(enemy.position, 'click');
  expect(mockShowError).toHaveBeenCalledWith('Нельзя выбрать персонажа вражеской команды');
});

test('When you try to select a character of your team, his position is saved in the controller', () => {
  const player = gameCtrl.gameState.playerTeam[0];
  dispatchEventOnCell(player.position, 'click');
  expect(gameCtrl.selectedCell).toEqual(player);
});

test(
  'When trying to select a character of your team when another character has already been selected, the selection is removed and the selection is fixed on the selected character',
  () => {
    const [first, second] = gameCtrl.gameState.playerTeam;
    dispatchEventOnCell(first.position, 'click');
    dispatchEventOnCell(second.position, 'click');
    expect(mockDeselectCell).toHaveBeenCalledWith(first.position);
    expect(gameCtrl.selectedCell).toEqual(second);
  },
);

test('When trying to select an empty cell when a character is already selected and movement is impossible, the selection is removed', () => {
  const player = gameCtrl.gameState.playerTeam[0];
  dispatchEventOnCell(player.position, 'click');
  dispatchEventOnCell(player.position + 5, 'click');
  expect(mockDeselectCell).toHaveBeenCalledWith(player.position);
  expect(gameCtrl.selectedCell).toBeUndefined();
});

test(
  'When trying to select an empty cell, when a character is already selected and movement is possible, the character moves to this cell',
  () => {
    const player = gameCtrl.gameState.playerTeam[0];
    const newPosition = player.position + 1;
    dispatchEventOnCell(player.position, 'click');
    dispatchEventOnCell(newPosition, 'click');
    expect(mockDeselectCell).toHaveBeenCalledWith(player.position);
    expect(mockSelectCell).toHaveBeenCalledWith(newPosition);
    expect(player.position).toBe(newPosition);
  },
);

test('If a character is selected and a click occurs on the cell of an enemy character, an attack on an enemy occurs', () => {
  const player = gameCtrl.gameState.playerTeam[0];
  const enemy = gameCtrl.gameState.enemyTeam[0];
  const healthBefore = enemy.character.health;
  enemy.position = player.position + 1;
  dispatchEventOnCell(player.position, 'click');
  dispatchEventOnCell(enemy.position, 'click');
  expect(enemy.character.health).toBeLessThan(healthBefore);
});

test('If a character is selected and the cursor is hovered over a cell of an enemy character, the cell is highlighted in red', () => {
  const player = gameCtrl.gameState.playerTeam[0];
  const enemy = gameCtrl.gameState.enemyTeam[0];
  player.position = enemy.position - 1;
  dispatchEventOnCell(player.position, 'click');
  dispatchEventOnCell(enemy.position, 'mouseenter');
  expect(mockSelectCell).toHaveBeenCalledWith(enemy.position, 'red');
});

test(
  'If a character is selected and the cursor is hovered over an empty cell in the character\'s movement area, the cell is highlighted in yellow',
  () => {
    const player = gameCtrl.gameState.playerTeam[0];
    dispatchEventOnCell(player.position, 'click');
    dispatchEventOnCell(player.position + 1, 'mouseenter');
    expect(mockSelectCell).toHaveBeenCalledWith(player.position + 1, 'green');
  },
);
