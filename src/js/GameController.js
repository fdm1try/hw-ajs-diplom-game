import themes from './themes';
import GamePlay from './GamePlay';
import GameState from './GameState';
import { generateTeam } from './generators';
import PositionedCharacter from './PositionedCharacter';
import cursors from './cursors';
import AI from './AI';

const isEnemy = (character) => ['daemon', 'undead', 'vampire'].includes(character.type);
const THEME_LIST = ['prairie', 'desert', 'arctic', 'mountain'];
const POINTS_KILL = 10;
const POINTS_LEVEL = 100;

export default class GameController {
  constructor(gamePlay, stateService) {
    this.gamePlay = gamePlay;
    this.isGameOver = false;
    this.gameState = new GameState();
    this.stateService = stateService;
    this.selectedCell = null;
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
      // todo: what to do?
    }
    AI.boardSize = this.gamePlay.boardSize;
    this.teamSize = 4;
    this.gamePlay.addCellEnterListener((index) => this.onCellEnter(index));
    this.gamePlay.addCellLeaveListener((index) => this.onCellLeave(index));
    this.gamePlay.addCellClickListener((index) => this.onCellClick(index));
    this.gamePlay.addNewGameListener(() => this.newGame());
    this.gamePlay.addSaveGameListener(() => {
      this.stateService.save(this.gameState.json);
      GamePlay.showMessage('Game saved successfully.');
    });
    this.gamePlay.addLoadGameListener(() => {
      try {
        const data = this.stateService.load();
        const { highScore } = this.gameState;
        this.gameState = GameState.from(data);
        this.gameState.highScore = highScore;
        this.runLevel(
          this.gameState.playerTeam,
          this.gameState.enemyTeam,
          this.gameState.level,
          this.gameState.isPlayerMove,
        );
        GamePlay.showMessage('Game loaded successfully.');
      } catch (error) {
        GamePlay.showError(error);
      }
    });
    this.newGame();
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

  newGame() {
    this.isGameOver = false;
    this.gameState.reset();
    const playerTeam = generateTeam(['bowman', 'swordsman', 'magician'], 1, this.teamSize);
    const enemyTeam = generateTeam(['daemon', 'undead', 'vampire'], 1, this.teamSize);
    for (const character of playerTeam.characters) {
      const positionedCharacter = new PositionedCharacter(character, this.getRandomPosition());
      this.gameState.playerTeam.push(positionedCharacter);
    }
    for (const character of enemyTeam.characters) {
      const positionedCharacter = new PositionedCharacter(character, this.getRandomPosition(6));
      this.gameState.enemyTeam.push(positionedCharacter);
    }
    this.runLevel(this.gameState.playerTeam, this.gameState.enemyTeam);
  }

  runLevel(playerTeam, enemyTeam, level = 0, isPlayerMove = true) {
    if (!Array.isArray(playerTeam) || !playerTeam.length
      || !Array.isArray(enemyTeam) || !enemyTeam.length) {
      return this.gameOver();
    }
    this.isGameOver = false;
    this.gameState.level = level;
    this.gameState.isPlayerMove = isPlayerMove;
    this.gameState.playerTeam = playerTeam;
    this.gameState.enemyTeam = enemyTeam;
    const theme = THEME_LIST[this.gameState.level];
    this.gamePlay.drawUi(themes[theme]);
    this.gamePlay.redrawScoreBoard(this.gameState.score, this.gameState.highScore);
    this.gamePlay.redrawPositions(this.gameState.allCharacters);
    return null;
  }

  nextLevel() {
    this.gameState.level += 1;
    const pointsPenalty = (this.teamSize - this.gameState.playerTeam.length) * POINTS_KILL * 3;
    this.addScorePoints((POINTS_LEVEL * this.gameState.level) - pointsPenalty);
    if (this.gameState.level > 3) {
      return this.gameOver(true);
    }
    this.gamePlay.enemyTeam = [];
    const enemyTeam = generateTeam(['daemon', 'undead', 'vampire'], this.gameState.level + 1, this.teamSize);
    for (const character of enemyTeam.characters) {
      const positionedCharacter = new PositionedCharacter(character, this.getRandomPosition(6));
      this.gameState.enemyTeam.push(positionedCharacter);
    }
    for (const character of this.gameState.playerTeam) {
      character.character.levelUp();
      character.position = this.getRandomPosition();
    }
    this.runLevel(this.gameState.playerTeam, this.gameState.enemyTeam, this.gameState.level);
    return null;
  }

  gameOver() {
    this.isGameOver = true;
    const text = this.gameState.playerTeam.length ? 'You are WIN! Congratulations!' : 'You LOOSE!';
    GamePlay.showMessage(text);
    if (this.selectedCell) {
      this.gamePlay.deselectCell(this.selectedCell.position);
      this.selectedCell = null;
    }
  }

  addScorePoints(points) {
    const { highScore } = this.gameState;
    this.gameState.score += points;
    if (this.gameState.score > highScore) {
      this.stateService.saveByLabel('state-highscore', this.gameState.highScore);
    }
    this.gamePlay.redrawScoreBoard(this.gameState.score, this.gameState.highScore);
  }

  onCellClick(index) {
    if (!this.gameState.isPlayerMove || this.isGameOver) {
      return null;
    }
    const entity = this.gameState.allCharacters.find((item) => item.position === index);
    if (entity) {
      if (!this.selectedCell) {
        if (isEnemy(entity.character)) {
          return GamePlay.showError('Нельзя выбрать персонажа вражеской команды');
        }
        this.selectedCell = entity;
        this.gamePlay.selectCell(index);
        return null;
      }
      if (!isEnemy(entity.character)) {
        if (this.selectedCell) {
          this.gamePlay.deselectCell(this.selectedCell.position);
        }
        this.gamePlay.selectCell(index);
        this.selectedCell = entity;
      } else if (this.selectedCell) {
        this.attack(this.selectedCell, entity).catch((error) => GamePlay.showError(error));
      }
    } else if (this.selectedCell) {
      const currentPosition = this.selectedCell.position;
      if (this.move(this.selectedCell, index)) {
        this.gamePlay.deselectCell(currentPosition);
        this.gamePlay.selectCell(index);
      } else {
        this.gamePlay.deselectCell(this.selectedCell.position);
        this.selectedCell = undefined;
      }
    }
    return null;
  }

  onCellEnter(index) {
    if (this.isGameOver) {
      return;
    }
    const entity = this.gameState.allCharacters.find((item) => item.position === index);
    if (entity) {
      const message = `🎖${entity.character.level} ⚔${entity.character.attack} 🛡${entity.character.defence} ❤${entity.character.health}`;
      this.gamePlay.showCellTooltip(message, index);
      if (!isEnemy(entity.character)) {
        this.gamePlay.setCursor(cursors.pointer);
      }
    }
    if (!this.gameState.isPlayerMove) {
      return;
    }
    if (this.selectedCell && this.selectedCell !== entity) {
      if (entity) {
        if (isEnemy(entity.character)) {
          if (AI.canAttack(this.selectedCell.position, index, this.selectedCell.attackDistance)) {
            this.gamePlay.setCursor(cursors.crosshair);
            this.gamePlay.selectCell(index, 'red');
            this.temprorarySelectedCell = index;
          } else {
            this.gamePlay.setCursor(cursors.notallowed);
          }
        }
      } else if (AI.canMove(this.selectedCell.position, index, this.selectedCell.moveDistance)) {
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
    if (!this.gameState.enemyTeam.length) {
      return this.nextLevel();
    }
    if (!this.gameState.playerTeam.length) {
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
    this.gamePlay.redrawPositions(this.gameState.allCharacters);
  }

  move(positionedCharacter, targetCell) {
    if (!AI.canMove(positionedCharacter.position, targetCell, positionedCharacter.moveDistance)) {
      return false;
    }
    const entity = positionedCharacter;
    entity.position = targetCell;
    this.registerAction();
    return true;
  }

  attack(attacker, target) {
    return new Promise((resolve, reject) => {
      if (!(attacker instanceof PositionedCharacter) || !(target instanceof PositionedCharacter)) {
        reject(new Error('Can not attack because attacker or target is not instance of PositionedCharacter'));
      } else if (!AI.canAttack(attacker.position, target.position, attacker.attackDistance)) {
        reject(new Error('Attack range is too low to attack this target!'));
      } else {
        const damage = target.character.damage(attacker.character.attack);
        this.gamePlay.showDamage(target.position, damage).then(() => {
          const { character, position } = target;
          if (character.health <= 0) {
            if (isEnemy(character)) {
              this.addScorePoints(POINTS_KILL * character.level);
            } else if (this.selectedCell.position === position) {
              this.gamePlay.deselectCell(position);
              this.selectedCell = undefined;
              this.gamePlay.setCursor(cursors.auto);
            }
            this.gameState.removePosition(position);
          }
          this.registerAction();
          resolve();
        });
      }
    });
  }

  makeEnemyMove() {
    return new Promise((resolve) => {
      const threats = AI.getThreats(this.gameState.playerTeam, this.gameState.enemyTeam);
      if (threats.length) {
        threats.sort(
          (prev, next) => next.attacker.character.attack - prev.attacker.character.attack,
        );
        const threat = threats[0];
        this.attack(threat.attacker, threat.target).then(resolve);
        return;
      }
      const enemies = this.gameState.enemyTeam.filter((member) => member.character.health >= 0);
      const enemy = enemies[Math.round(Math.random() * (enemies.length - 1))];
      const distances = this.gameState.playerTeam.filter((member) => member.character.health > 0)
        .map((member) => {
          const [x, y] = AI.getDistance(enemy.position, member.position).map(Math.abs);
          return {
            position: member.position,
            distance: x + y,
          };
        });
      distances.sort((prev, next) => prev.distance - next.distance);
      for (const variant of AI.getMovesToCell(enemy, distances[0].position)) {
        if (!this.gameState.positions.includes(variant.position)) {
          this.move(enemy, variant.position);
          resolve();
          return;
        }
      }
    });
  }
}
