import GameStateService from '../GameStateService';

let gameStateService;
let localStorageData;

beforeAll(() => {
  global.Storage.prototype.getItem = jest.fn((key) => localStorageData.get(key));
  global.Storage.prototype.setItem = jest.fn((key, value) => localStorageData.set(key, value));
  gameStateService = new GameStateService(localStorage);
});

beforeEach(() => {
  localStorageData = new Map();
});

afterAll(() => {
  global.Storage.prototype.setItem.mockReset();
  global.Storage.prototype.getItem.mockReset();
});

test('Loading the game state fails when the format does not match the JSON string', () => {
  localStorageData.set('state', '{ invalid: format');
  const load = () => gameStateService.load();
  expect(load).toThrow();
});

test('Loading the game state completes successfully when the form matches the JSON string', () => {
  localStorageData.set('state', '{ "valid": "format" }');
  expect(gameStateService.load()).toEqual({ valid: 'format' });
});

test('Testing the successful saving and loading of game state', () => {
  gameStateService.save({ valid: 'format' });
  expect(gameStateService.load()).toEqual({ valid: 'format' });
});

test('Testing the successful saving and loading of data by the specified label', () => {
  gameStateService.saveByLabel('high-score', 10);
  expect(gameStateService.loadByLabel('high-score')).toBe(10);
});

test('Loading data by label fails when the format does not match the JSON string', () => {
  localStorageData.set('high-score', '{ invalid: format');
  const check = () => gameStateService.loadByLabel('high-score');
  expect(check).toThrow();
});
