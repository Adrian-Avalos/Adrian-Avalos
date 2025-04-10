const socket = io();
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const tileSize = 20;
let playerId;
let players = {};
let fruit = {}, bomb = {}, speedBoost = {};

socket.on('init', (data) => {
  playerId = data.id;
  players = data.players;
  fruit = data.fruit;
  bomb = data.bomb;
  speedBoost = data.speedBoost;
});

socket.on('new-player', ({ id, data }) => {
  players[id] = data;
});

socket.on('remove-player', (id) => {
  delete players[id];
});

socket.on('state', (data) => {
  players = data.players;
  fruit = data.fruit;
  bomb = data.bomb;
  speedBoost = data.speedBoost;
  draw();
});

document.addEventListener('keydown', (e) => {
  const dirs = {
    ArrowUp: [0, -1], ArrowDown: [0, 1],
    ArrowLeft: [-1, 0], ArrowRight: [1, 0]
  };
  if (dirs[e.key]) {
    socket.emit('move', { dx: dirs[e.key][0], dy: dirs[e.key][1] });
  }
});

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawItem(fruit, 'lime');
  drawItem(bomb, 'red');
  drawItem(speedBoost, 'cyan');

  for (const id in players) {
    const p = players[id];
    if (!p.alive) continue;
    ctx.fillStyle = p.color;
    p.tail.forEach(part => drawItem(part, p.color));
  }
}

function drawItem(pos, color) {
  ctx.fillStyle = color;
  ctx.fillRect(pos.x * tileSize, pos.y * tileSize, tileSize, tileSize);
}
