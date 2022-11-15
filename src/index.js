const WIDTH = 20;
const HEIGHT = 20;
const BOMB = 80;

const blocks = [];

let mode = 'pointer';
const pointerModeButton = document.getElementById('pointer');
const flagModeButton = document.getElementById('flag');
pointerModeButton.addEventListener('click', () => {
  pointerModeButton.classList.add('active');
  flagModeButton.classList.remove('active');
  mode = 'pointer';
});
flagModeButton.addEventListener('click', () => {
  flagModeButton.classList.add('active');
  pointerModeButton.classList.remove('active');
  mode = 'flag';
});

const bombCount = document.getElementById('bomb-count');

const board = document.getElementById('board');
const gameover = document.getElementById('gameover');
const gameoverTitle = document.getElementById('gameover-title');
const overlay = document.getElementById('overlay');

const restartButton = document.getElementById('restart');
restartButton.addEventListener('click', restart);

function initialize() {
  for (let i = 0; i < HEIGHT; i++) {
    blocks.push(new Array(WIDTH));
  }
  const blockLength = board.clientWidth / WIDTH;
  for (let i = 0; i < HEIGHT; i++) {
    const row = document.createElement('div');
    row.classList.add('row');
    for (let j = 0; j < WIDTH; j++) {
      blocks[i][j] = {
        bomb: false,
        count: 0,
        show: false,
      };
      const block = document.createElement('div');
      block.classList.add('block');
      block.style.width = `${blockLength}px`;
      block.style.height = `${blockLength}px`;
      block.dataset.x = i;
      block.dataset.y = j;
      block.addEventListener('click', handleClick, true);
      row.appendChild(block);
    }
    board.appendChild(row);
  }
  bombCount.textContent = BOMB;
}

function getSurroundings(x, y) {
  return [
    { x: x - 1, y: y - 1 },
    { x: x, y: y - 1 },
    { x: x + 1, y: y - 1 },
    { x: x - 1, y: y },
    { x: x + 1, y: y },
    { x: x - 1, y: y + 1 },
    { x: x, y: y + 1 },
    { x: x + 1, y: y + 1 },
  ].filter((surrounding) => isValidBlock(surrounding.x, surrounding.y));
}

function isValidBlock(x, y) {
  return 0 <= x && x < HEIGHT && 0 <= y && y < WIDTH;
}

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

function toIndex(x, y) {
  return x * WIDTH + y;
}

function toXY(index) {
  const x = Math.floor(index / WIDTH);
  const y = index % WIDTH;
  return { x, y };
}

function setBombs(firstX, firstY) {
  const bombSet = new Set();
  const excludeXYList = getSurroundings(firstX, firstY);
  excludeXYList.push({ x: firstX, y: firstY });
  const excludeIndexList = excludeXYList.map((excludeXY) => {
    return toIndex(excludeXY.x, excludeXY.y);
  });
  for (let i = 0; i < BOMB; i++) {
    bombSet.add(getRandomInt(WIDTH * HEIGHT));
  }
  for (const excludeIndex of excludeIndexList) {
    bombSet.delete(excludeIndex);
  }
  while (bombSet.size < BOMB) {
    const bomb = getRandomInt(WIDTH * HEIGHT);
    if (excludeIndexList.includes(bomb)) continue;
    bombSet.add(bomb);
  }
  const bombArray = Array.from(bombSet);
  bombArray.sort((a, b) => a - b);
  for (const bomb of bombArray) {
    const { x, y } = toXY(bomb);
    blocks[x][y].bomb = true;
    const countUpList = getSurroundings(x, y);
    for (const countUp of countUpList) {
      blocks[countUp.x][countUp.y].count += 1;
    }
  }
}

let isFirstClick = true;

function handleClick(event) {
  const block = event.target;
  if (block.classList.contains('show')) return;
  if (mode === 'flag' || event.altKey) {
    const leftBombs = Number(bombCount.textContent);
    if (block.classList.contains('flag')) {
      block.classList.remove('flag');
      bombCount.textContent = leftBombs + 1;
    } else if (leftBombs > 0) {
      block.classList.add('flag');
      bombCount.textContent = leftBombs - 1;
    }
    return;
  }
  const blockX = Number(block.dataset.x);
  const blockY = Number(block.dataset.y);
  if (block.classList.contains('flag')) return;
  if (isFirstClick) {
    setBombs(blockX, blockY);
    isFirstClick = false;
  }
  openBlock(block, blockX, blockY, true);
  checkClear();
  bombCount.textContent = BOMB - document.querySelectorAll('.flag').length;
}

function openBlock(block, x, y, checkBomb) {
  blocks[x][y].show = true;
  block.classList.add('show');
  block.classList.remove('flag');
  if (checkBomb && blocks[x][y].bomb) {
    block.textContent = '💣';
    toGameover('GAMEOVER');
    return;
  }
  if (blocks[x][y].count > 0) {
    block.textContent = blocks[x][y].count;
    block.classList.add('c' + blocks[x][y].count);
  } else {
    openSurrounding(x, y);
  }
}

function openSurrounding(blockX, blockY) {
  if (blocks[blockX][blockY].count !== 0) return;
  blocks[blockX][blockY].done = true;
  const surroudings = getSurroundings(blockX, blockY);
  for (const surrouding of surroudings) {
    if (blocks[surrouding.x][surrouding.y].done) continue;
    const block = document.querySelector(
      `[data-x="${surrouding.x}"][data-y="${surrouding.y}"]`
    );
    openBlock(block, surrouding.x, surrouding.y, false);
  }
}

function checkClear() {
  const results = [];
  for (let i = 0; i < HEIGHT; i++) {
    results.push(...blocks[i].filter((block) => !block.bomb && !block.show));
    if (results.length > 0) return;
  }
  toGameover('GAMECLEAR');
}

function toGameover(title) {
  gameover.style.display = 'flex';
  overlay.style.display = 'block';
  gameoverTitle.textContent = title;
}

function restart() {
  blocks.length = 0;
  const rows = document.querySelectorAll('.row');
  for (const row of rows) {
    board.removeChild(row);
  }
  gameover.style.display = 'none';
  overlay.style.display = 'none';
  isFirstClick = true;
  initialize();
}

initialize();
