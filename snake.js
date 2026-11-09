const SNAKE_TARGET = "jKe-3dM0YyQ?si=aXtSgTX6FPgNAGdR";
const SNAKE_LINK = "https://youtube.com/shorts/jKe-3dM0YyQ?si=aXtSgTX6FPgNAGdR";

const snakeWindow = document.getElementById("snake-window");
const snakeResultWindow = document.getElementById("snake-result-window");
const snakeBoard = document.getElementById("snake-board");
const snakeStatus = document.getElementById("snake-status");
const snakeCollected = document.getElementById("snake-collected");
const snakeResultLink = document.getElementById("snake-result-link");

const COLS = 32;
const ROWS = 32;
let snake = [];
let dir = { x: 1, y: 0 };
let nextDir = { x: 1, y: 0 };
let food = null;
let progress = 0;
let running = false;
let timer = null;

function resetSnake() {
  snake = [
    { x: 20, y: 10 },
    { x: 19, y: 10 },
    { x: 18, y: 10 },
  ];
  dir = { x: 1, y: 0 };
  nextDir = { x: 1, y: 0 };
  progress = 0;
  placeFood();
}

function placeFood() {
  const occupied = new Set(snake.map((p) => `${p.x},${p.y}`));
  let x;
  let y;
  do {
    x = Math.floor(Math.random() * COLS);
    y = Math.floor(Math.random() * ROWS);
  } while (occupied.has(`${x},${y}`));
  food = { x, y, char: SNAKE_TARGET[progress] };
}

function renderSnake() {
  const grid = [];
  for (let y = 0; y < ROWS; y += 1) {
    const row = [];
    for (let x = 0; x < COLS; x += 1) {
      row.push({ char: ".", color: "dot" });
    }
    grid.push(row);
  }
  if (food) {
    grid[food.y][food.x] = { char: food.char, color: "food" };
  }
  snake.forEach((part, index) => {
    grid[part.y][part.x] = { char: index === 0 ? "0" : "o", color: "snake" };
  });
  snakeBoard.innerHTML = grid
    .map((row) =>
      row
        .map((cell) => `<span class="snake-${cell.color}">${cell.char}</span>`)
        .join("")
    )
    .join("\n");
  snakeStatus.textContent = `Progreso: ${progress}/${SNAKE_TARGET.length}  |  Recoge: ${SNAKE_TARGET[progress] ?? "✓"}`;
  if (snakeCollected) {
    snakeCollected.textContent = SNAKE_TARGET.slice(0, progress) || "—";
  }
}

function stepSnake() {
  dir = nextDir;
  const head = snake[0];
  const newHead = { x: head.x + dir.x, y: head.y + dir.y };

  if (
    newHead.x < 0 ||
    newHead.x >= COLS ||
    newHead.y < 0 ||
    newHead.y >= ROWS ||
    snake.some((part) => part.x === newHead.x && part.y === newHead.y)
  ) {
    stopSnake();
    snakeStatus.textContent = "Game over. Pulsa REINICIAR.";
    return;
  }

  snake.unshift(newHead);
  if (food && newHead.x === food.x && newHead.y === food.y) {
    progress += 1;
    if (progress >= SNAKE_TARGET.length) {
      stopSnake();
      renderSnake();
      snakeStatus.textContent = "¡Completado! Abriendo enlace...";
      if (snakeResultLink) {
        snakeResultLink.href = SNAKE_LINK;
      }
      if (typeof openWindow === "function" && snakeResultWindow) {
        openWindow(snakeResultWindow);
      }
      return;
    }
    placeFood();
  } else {
    snake.pop();
  }
  renderSnake();
}

function startSnake() {
  if (running) {
    return;
  }
  if (progress >= SNAKE_TARGET.length) {
    resetSnake();
  }
  running = true;
  timer = window.setInterval(stepSnake, 150);
  renderSnake();
}

function stopSnake() {
  running = false;
  if (timer) {
    window.clearInterval(timer);
    timer = null;
  }
}

function restartSnake() {
  stopSnake();
  resetSnake();
  renderSnake();
}

const snakeStartBtn = document.getElementById("snake-start");
const snakePauseBtn = document.getElementById("snake-pause");
const snakeRestartBtn = document.getElementById("snake-restart");

if (snakeStartBtn) {
  snakeStartBtn.addEventListener("click", startSnake);
}
if (snakePauseBtn) {
  snakePauseBtn.addEventListener("click", stopSnake);
}
if (snakeRestartBtn) {
  snakeRestartBtn.addEventListener("click", restartSnake);
}

window.addEventListener("keydown", (event) => {
  if (!snakeWindow || !snakeWindow.classList.contains("open")) {
    return;
  }
  const key = event.key;
  if (key === "ArrowUp" && dir.y !== 1) {
    nextDir = { x: 0, y: -1 };
    event.preventDefault();
  } else if (key === "ArrowDown" && dir.y !== -1) {
    nextDir = { x: 0, y: 1 };
    event.preventDefault();
  } else if (key === "ArrowLeft" && dir.x !== 1) {
    nextDir = { x: -1, y: 0 };
    event.preventDefault();
  } else if (key === "ArrowRight" && dir.x !== -1) {
    nextDir = { x: 1, y: 0 };
    event.preventDefault();
  }
});

resetSnake();
renderSnake();
