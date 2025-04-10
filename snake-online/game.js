const socket = io();
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const tileSize = 20;
let playerId;
let players = {};

socket.on('init', (data) => {
  playerId = data.id;
  players = data.players;
});

socket.on('new-player', ({ id, data }) => {
  players[id] = data;
});

socket.on('remove-player', (id) => {
  delete players[id];
});

socket.on('state', (serverPlayers) => {
  players = serverPlayers;
  draw();
});

document.addEventListener('keydown', (e) => {
  const dir = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };
  if (dir[e.key]) {
    socket.emit('move', { dx: dir[e.key][0], dy: dir[e.key][1] });
  }
});

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  Object.values(players).forEach(p => {
    ctx.fillStyle = p.color;
    p.tail.forEach(part => {
      ctx.fillRect(part.x * tileSize, part.y * tileSize, tileSize, tileSize);
    });
  });
}
