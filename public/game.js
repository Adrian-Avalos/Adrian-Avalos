const socket = io();
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const tileSize = 20;
let playerId;
let players = {};
let fruit = {};
let bomb = {};
let speedBoost = {};

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
  const dir = {
    ArrowUp: [0, -1],
    ArrowDown: [0, 1],
    ArrowLeft: [-1, 0],
    ArrowRight: [1, 0]
  };
  if (dir[e.key]) {
    socket.emit('move', { dx: dir[e.key][0], dy: dir[e.key][1] });
  }
});

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Power-ups
  drawTile(fruit, 'green');
  drawTile(bomb, 'red');
  drawTile(speedBoost, 'cyan');

  // Jugadores
  Object.values(players).forEach(p => {
    if (!p.alive) return;
    ctx.fillStyle = p.color;
    p.tail.forEach(part => {
      drawTile(part, p.color);
    });
  });
}

function drawTile(pos, color) {
  ctx.fillStyle = color;
  ctx.fillRect(pos.x * tileSize, pos.y * tileSize, tileSize, tileSize);
}
