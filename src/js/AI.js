export default class AI {
  static boardSize = undefined;

  static getDistance(from, to, boardSize) {
    const size = boardSize || AI.boardSize;
    if (!size || !Number.isInteger(size)) {
      throw new Error('Unknown board size!');
    }
    const fromRow = Math.floor(from / size);
    const toRow = Math.floor(to / size);
    const y = toRow - fromRow;
    const fromCol = from - (fromRow * size);
    const toCol = to - (toRow * size);
    const x = toCol - fromCol;
    return [x, y];
  }

  static canAttack(attackerPosition, targetPosition, attackRange, boardSize) {
    const size = boardSize || AI.boardSize;
    if (!size || !Number.isInteger(size)) {
      throw new Error('Unknown board size!');
    }
    const [dX, dY] = AI.getDistance(attackerPosition, targetPosition, size);
    return Math.abs(dX) <= attackRange && Math.abs(dY) <= attackRange;
  }

  static canMove(from, to, moveRange, boardSize) {
    const size = boardSize || AI.boardSize;
    if (!size || !Number.isInteger(size)) {
      throw new Error('Unknown board size!');
    }
    const [dX, dY] = this.getDistance(from, to, size);
    const [mX, mY] = [dX, dY].map(Math.abs);
    return ((dX === 0 || dY === 0) && (mX || mY) <= moveRange)
      || (Math.abs(dX) === Math.abs(dY) && Math.abs(dX) <= moveRange);
  }

  static getThreats(team, enemyTeam, boardSize) {
    const size = boardSize || AI.boardSize;
    if (!size || !Number.isInteger(size)) {
      throw new Error('Unknown board size!');
    }
    const threats = [];
    for (const attacker of enemyTeam) {
      const distance = attacker.character.attackDistance;
      for (const defender of team) {
        if (AI.canAttack(attacker.position, defender.position, distance, size)) {
          threats.push({ attacker, target: defender });
        }
      }
    }
    return threats;
  }

  static getMovesToCell(positionedCharacter, position, boardSize) {
    const size = boardSize || AI.boardSize;
    if (!size || !Number.isInteger(size)) {
      throw new Error('Unknown board size!');
    }
    const variants = [];
    const distance = positionedCharacter.character.moveDistance;
    for (let i = distance * -1; i <= distance; i += 1) {
      for (let j = distance * -1; j <= distance; j += 1) {
        if (i === 0 || j === 0 || Math.abs(i) === Math.abs(j)) {
          const cell = positionedCharacter.position + i + (size * j);
          if (cell >= 0 && AI.canMove(positionedCharacter.position, cell, distance, size)) {
            const d = AI.getDistance(cell, position, size)
              .map(Math.abs).reduce((sum, v) => sum + v, 0);
            variants.push({
              position: cell,
              distance: d,
            });
          }
        }
      }
    }
    variants.sort((a, b) => a.distance - b.distance);
    return variants;
  }
}
