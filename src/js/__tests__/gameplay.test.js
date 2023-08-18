import GamePlay from '../GamePlay';
import GameController from '../GameController';
import GameStateService from '../GameStateService';

const mockShowModal = jest.spyOn(GamePlay, 'showModal');
const mockRemoveModal = jest.spyOn(GamePlay, 'removeModal');
const mockCallback = jest.fn();

let gameCtrl;

beforeAll(() => {
  const gamePlay = new GamePlay();
  document.body.innerHTML = '<div id="game-container"></div>';
  gamePlay.bindToDOM(document.querySelector('#game-container'));
  const stateService = new GameStateService(localStorage);
  gameCtrl = new GameController(gamePlay, stateService);
  gameCtrl.init();
});

test('When trying to bind a container that is not an HTML element, an error is thrown ', () => {
  const gamePlay = new GamePlay({});
  const bind = () => gamePlay.bindToDOM({});
  expect(bind).toThrow();
});

test('Modal window removed after click on OK', () => {
  GamePlay.showModal('information');
  const okBtn = GamePlay.modalEl.querySelector('.modal-confirm');
  okBtn.click();
  expect(mockRemoveModal).toHaveBeenCalled();
  const modalWindow = document.body.querySelector('.modal-container');
  expect(modalWindow).toBeNull();
});

test('Clicking on the save game button performs the listener functions of this event', () => {
  gameCtrl.gamePlay.addSaveGameListener(mockCallback);
  gameCtrl.gamePlay.saveGameEl.click();
  expect(mockCallback).toHaveBeenCalled();
});

test('Clicking on the load game button performs the listener functions of this event', () => {
  gameCtrl.gamePlay.addLoadGameListener(mockCallback);
  gameCtrl.gamePlay.loadGameEl.click();
  expect(mockCallback).toHaveBeenCalled();
});

test('Clicking on the new game button performs the listener functions of this event', () => {
  gameCtrl.gamePlay.addNewGameListener(mockCallback);
  gameCtrl.gamePlay.newGameEl.click();
  expect(mockCallback).toHaveBeenCalled();
});

test('When hovering over a cell, functions that listen to the onCellEnter event are called', () => {
  const cellId = 22;
  gameCtrl.gamePlay.addCellEnterListener(mockCallback);
  const event = new MouseEvent('mouseenter', {
    view: window,
    bubbles: true,
    cancelable: true,
  });
  const el = document.querySelector(`.board .cell:nth-child(${cellId + 1})`);
  el.dispatchEvent(event);
  expect(mockCallback).toHaveBeenCalledWith(cellId);
});

test('When the mouse cursor goes beyond the boundaries of the cell, functions that listen to the onCellLeave event are called', () => {
  const cellId = 9;
  gameCtrl.gamePlay.addCellLeaveListener(mockCallback);
  const event = new MouseEvent('mouseleave', {
    view: window,
    bubbles: true,
    cancelable: true,
  });
  const el = document.querySelector(`.board .cell:nth-child(${cellId + 1})`);
  el.dispatchEvent(event);
  expect(mockCallback).toHaveBeenCalledWith(cellId);
});

test('When a cell is clicked, functions that listen to the onCellClick event are called', () => {
  const cellId = 18;
  gameCtrl.gamePlay.addCellClickListener(mockCallback);
  const event = new MouseEvent('click', {
    view: window,
    bubbles: true,
    cancelable: true,
  });
  const el = document.querySelector(`.board .cell:nth-child(${cellId + 1})`);
  el.dispatchEvent(event);
  expect(mockCallback).toHaveBeenCalledWith(cellId);
});

test('The showError function calls the ShowModal function', () => {
  GamePlay.showError('someerror');
  expect(mockShowModal).toHaveBeenCalledWith('someerror', 'error');
});

test('The showMessage function calls the ShowModal function', () => {
  GamePlay.showMessage('information');
  expect(mockShowModal).toHaveBeenCalledWith('information');
});

test('The select all function selects the cell, adding the selected class and the color class, by default selected is yellow', () => {
  const el = document.querySelector('.board .cell:nth-child(10)');
  gameCtrl.gamePlay.selectCell(9);
  let result = el.classList.contains('selected', 'selected-yellow');
  expect(result).toBeTruthy();
  gameCtrl.gamePlay.deselectCell(9);
  result = el.classList.contains('selected', 'selected-yellow');
  expect(result).toBeFalsy();
});

test('The showDamage function starts the animation', () => {
  const promise = gameCtrl.gamePlay.showDamage(1, 30);
  expect(promise).resolves.toBe();
});
