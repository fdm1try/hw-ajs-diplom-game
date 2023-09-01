import themes from './themes';
import GamePlay from './GamePlay';
import GameState from './GameState';
import { generateTeam } from './generators';
import PositionedCharacter from './PositionedCharacter';
import Character from './Character';
import cursors from './cursors';
import AI from './AI';

const THEME_LIST = ['prairie', 'desert', 'arctic', 'mountain'];
const POINTS_KILL = 10;
const POINTS_LEVEL = 100;

export default class GameController {
  constructor(gamePlay, stateService) {
    this.gamePlay = gamePlay;
    this.isGameOver = false;
    this.gameState = new GameState();
    this.stateService = stateService;
    this.temprorarySelectedCell = undefined;
  }

  init() {
    try {
      let highScore = Number(this.stateService.loadByLabel('state-highscore'));
      if (!Number.isInteger(highScore)) {
        highScore = 0;
      }
      this.gameState.highScore = highScore;
    } catch (error) {
      console.error('Can not load highscore state, highscore will be 0');
    }
    AI.boardSize = this.gamePlay.boardSize;
    this.teamSize = 4;
    this.newGame = this.newGame.bind(this);
    this.loadGame = this.loadGame.bind(this);
    this.saveGame = this.saveGame.bind(this);
    this.onCellEnter = this.onCellEnter.bind(this);
    this.onCellLeave = this.onCellLeave.bind(this);
    this.onCellClick = this.onCellClick.bind(this);
    this.registerEvents();
    this.newGame();
  }

  registerEvents() {
    this.gamePlay.addCellEnterListener(this.onCellEnter);
    this.gamePlay.addCellLeaveListener(this.onCellLeave);
    this.gamePlay.addCellClickListener(this.onCellClick);
    this.gamePlay.addNewGameListener(this.newGame);
    this.gamePlay.addSaveGameListener(this.saveGame);
    this.gamePlay.addLoadGameListener(this.loadGame);
  }

  getRandomPosition(colOffset = 0) {
    const row = Math.floor(Math.random() * (this.gamePlay.boardSize - 1));
    const col = colOffset + Math.round(Math.random());
    const position = row * this.gamePlay.boardSize + col;
    if (this.gameState.positions.includes(position)) {
      return this.getRandomPosition(colOffset);
    }
    return position;
  }

  saveGame() {
    this.stateService.save(this.gameState.json);
    GamePlay.showMessage('Game saved successfully.');
  }

  loadGame() {
    try {
      const data = this.stateService.load();
      const { highScore } = this.gameState;
      this.gameState = GameState.from(data);
      this.gameState.highScore = highScore;
      this.runLevel(this.gameState.level);
      GamePlay.showMessage('Game loaded successfully.');
    } catch (error) {
      GamePlay.showError(error);
    }
  }

  newGame() {
    this.gameState.reset();
    this.gameState.playerTeam = generateTeam(['bowman', 'swordsman', 'magician'], 1, this.teamSize);
    this.gameState.enemyTeam = generateTeam(['daemon', 'undead', 'vampire'], 1, this.teamSize);
    for (const character of this.gameState.playerTeam.characters) {
      this.gameState.setPosition(character, this.getRandomPosition());
    }
    for (const character of this.gameState.enemyTeam.characters) {
      this.gameState.setPosition(character, this.getRandomPosition(6));
    }
    this.runLevel(this.gameState.level);
  }

  runLevel(level = 0) {
    if (!this.gameState.playerTeam.size || !this.gameState.enemyTeam.size) {
      return this.gameOver();
    }
    this.gameState.level = level;
    const theme = THEME_LIST[this.gameState.level];
    this.gamePlay.drawUi(themes[theme]);
    this.gamePlay.redrawScoreBoard(this.gameState.score, this.gameState.highScore);
    this.gamePlay.redrawPositions(this.gameState.getAllPositionedCharacters());
    return null;
  }

  nextLevel() {
    this.deselectCharacter();
    const pointsPenalty = (this.teamSize - this.gameState.playerTeam.size) * POINTS_KILL * 3;
    this.addScorePoints((POINTS_LEVEL * this.gameState.level) - pointsPenalty);
    const level = this.gameState.level + 1;
    if (level > 3) {
      return this.gameOver(true);
    }
    this.gameState.enemyTeam = generateTeam(['daemon', 'undead', 'vampire'], level + 1, this.teamSize);
    for (const character of this.gameState.enemyTeam.characters) {
      this.gameState.setPosition(character, this.getRandomPosition(6));
    }
    for (const character of this.gameState.playerTeam.characters) {
      character.levelUp();
      this.gameState.setPosition(character, this.getRandomPosition());
    }
    this.runLevel(level);
    return null;
  }

  gameOver() {
    this.deselectCharacter();
    this.gameState.isGameOver = true;
    const text = this.gameState.playerTeam.size ? 'You are WIN! Congratulations!' : 'You LOOSE!';
    GamePlay.showMessage(text);
  }

  addScorePoints(points) {
    const { highScore } = this.gameState;
    this.gameState.score += points;
    if (this.gameState.score > highScore) {
      this.stateService.saveByLabel('state-highscore', this.gameState.highScore);
    }
    this.gamePlay.redrawScoreBoard(this.gameState.score, this.gameState.highScore);
  }

  selectCharacter(character) {
    if (!this.gameState.playerTeam.has(character)) {
      return false;
    }
    this.deselectCharacter();
    this.gamePlay.selectCell(this.gameState.getPosition(character));
    this.gameState.selectedCharacter = character;
    return true;
  }

  deselectCharacter() {
    const cellIndex = this.gameState.getPosition(this.gameState.selectedCharacter);
    if (!cellIndex) return;
    this.gamePlay.deselectCell(cellIndex);
    this.gameState.selectedCharacter = null;
  }

  onCellClick(index) {
    if (!this.gameState.isPlayerMove || this.gameState.isGameOver) {
      return null;
    }
    const character = this.gameState.findPCByPosition(index);
    const isEnemy = this.gameState.enemyTeam.has(character);
    if (character) {
      if (!this.gameState.selectedCharacter) {
        if (isEnemy) {
          return GamePlay.showError('Нельзя выбрать персонажа вражеской команды');
        }
        this.selectCharacter(character);
        return null;
      }
      if (!isEnemy) {
        this.selectCharacter(character);
      } else if (this.gameState.selectedCharacter) {
        this.attack(this.gameState.selectedCharacter, character)
          .catch((error) => GamePlay.showError(error));
      }
    } else if (this.gameState.selectedCharacter) {
      const position = this.gameState.getPosition(this.gameState.selectedCharacter);
      if (this.move(this.gameState.selectedCharacter, index)) {
        this.gamePlay.deselectCell(position);
        this.selectCharacter(this.gameState.selectedCharacter);
      } else {
        this.deselectCharacter();
      }
    }
    return null;
  }

  onCellEnter(index) {
    if (this.isGameOver) {
      return;
    }
    const character = this.gameState.findPCByPosition(index);
    const isEnemy = this.gameState.enemyTeam.has(character);
    if (character) {
      const message = `🎖${character.level} ⚔${character.attack} 🛡${character.defence} ❤${character.health}`;
      this.gamePlay.showCellTooltip(message, index);
      if (!isEnemy) {
        this.gamePlay.setCursor(cursors.pointer);
      }
    }
    if (!this.gameState.isPlayerMove) {
      return;
    }
    if (this.gameState.selectedCharacter && this.gameState.selectedCharacter !== character) {
      const position = this.gameState.getPosition(this.gameState.selectedCharacter);
      if (character) {
        if (isEnemy) {
          if (AI.canAttack(position, index, this.gameState.selectedCharacter.attackDistance)) {
            this.gamePlay.setCursor(cursors.crosshair);
            this.gamePlay.selectCell(index, 'red');
            this.temprorarySelectedCell = index;
          } else {
            this.gamePlay.setCursor(cursors.notallowed);
          }
        }
      } else if (AI.canMove(position, index, this.gameState.selectedCharacter.moveDistance)) {
        this.gamePlay.setCursor(cursors.pointer);
        this.gamePlay.selectCell(index, 'green');
        this.temprorarySelectedCell = index;
      }
    }
  }

  onCellLeave(index) {
    this.gamePlay.setCursor(cursors.auto);
    this.gamePlay.hideCellTooltip(index);
    if (this.temprorarySelectedCell !== undefined) {
      this.gamePlay.deselectCell(this.temprorarySelectedCell);
      this.temprorarySelectedCell = undefined;
    }
  }

  registerAction() {
    this.redraw();
    if (!this.gameState.enemyTeam.size) {
      return this.nextLevel();
    }
    if (!this.gameState.playerTeam.size) {
      return this.gameOver();
    }
    this.gameState.isPlayerMove = !this.gameState.isPlayerMove;
    if (!this.gameState.isPlayerMove) {
      this.makeEnemyMove();
    }
    return null;
  }

  redraw() {
    if (this.temprorarySelectedCell) {
      this.gamePlay.deselectCell(this.temprorarySelectedCell);
      this.temprorarySelectedCell = undefined;
    }
    this.gamePlay.redrawPositions(this.gameState.getAllPositionedCharacters());
  }

  move(character, targetCell) {
    const position = this.gameState.getPosition(character);
    if (!AI.canMove(position, targetCell, character.moveDistance)) {
      return false;
    }
    this.gameState.setPosition(character, targetCell);
    this.registerAction();
    return true;
  }

  attack(attacker, target) {
    const attackerPosition = this.gameState.getPosition(attacker);
    const targetPosition = this.gameState.getPosition(target);
    const selectedPosition = this.gameState.getPosition(this.gameState.selectedCharacter);
    return new Promise((resolve, reject) => {
      if (!(attacker instanceof Character) || !(target instanceof Character)) {
        reject(new Error('Can not attack because attacker or target is not instance of Character'));
      } else if (!AI.canAttack(attackerPosition, targetPosition, attacker.attackDistance)) {
        reject(new Error('Attack range is too low to attack this target!'));
      } else {
        const damage = target.damage(attacker.attack);
        this.gamePlay.showDamage(targetPosition, damage).then(() => {
          if (target.health <= 0) {
            if (this.gameState.enemyTeam.has(target)) {
              this.addScorePoints(POINTS_KILL * target.level);
            } else if (selectedPosition === targetPosition) {
              this.deselectCharacter();
              this.gamePlay.setCursor(cursors.auto);
            }
            this.gameState.removePosition(targetPosition);
          }
          this.registerAction();
          resolve();
        });
      }
    });
  }

  makeEnemyMove() {
    return new Promise((resolve) => {
      const playerTeam = this.gameState.playerTeam.characters.map(
        (character) => new PositionedCharacter(character, this.gameState.getPosition(character)),
      );
      const enemyTeam = this.gameState.enemyTeam.characters.map(
        (character) => new PositionedCharacter(character, this.gameState.getPosition(character)),
      );
      const threats = AI.getThreats(playerTeam, enemyTeam);
      if (threats.length) {
        threats.sort(
          (prev, next) => next.attacker.character.attack - prev.attacker.character.attack,
        );
        const threat = threats[0];
        this.attack(threat.attacker.character, threat.target.character).then(resolve);
        return;
      }
      const enemy = enemyTeam[Math.round(Math.random() * (enemyTeam.length - 1))];
      const distances = playerTeam.map((member) => {
        const [x, y] = AI.getDistance(enemy.position, member.position).map(Math.abs);
        return {
          position: member.position,
          distance: x + y,
        };
      });
      distances.sort((prev, next) => prev.distance - next.distance);
      for (const variant of AI.getMovesToCell(enemy, distances[0].position)) {
        if (!this.gameState.positions.includes(variant.position)) {
          this.move(enemy.character, variant.position);
          resolve();
          return;
        }
      }
    });
  }
}
