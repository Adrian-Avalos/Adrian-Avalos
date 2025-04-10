const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const socket = io();
let playerId = null;
let players = {};
let food = [];
let leaderboard = [];

document.addEventListener('mousemove', (e) => {
  const angle = Math.atan2(e.clientY - canvas.height / 2, e.clientX - canvas.width / 2);
  socket.emit('move', { angle });
});

function setName() {
  const name = document.getElementById('nameInput').value;
  socket.emit('setName', name);
}

socket.on('state', (data) => {
  players = data.players;
  food = data.food;
  leaderboard = data.leaderboard;
  draw();
});

function draw() {
  ctx.fillStyle = '#111';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const me = players[socket.id];
  if (!me) return;

  const camX = me.x - canvas.width / 2;
  const camY = me.y - canvas.height / 2;

  // Dibujar comida
  food.forEach(f => {
    ctx.fillStyle = f.color;
    ctx.beginPath();
    ctx.arc(f.x - camX, f.y - camY, 5, 0, Math.PI * 2);
    ctx.fill();
  });

  // Dibujar serpientes
  Object.values(players).forEach(p => {
    ctx.strokeStyle = p.color;
    ctx.lineWidth = 10;
    ctx.beginPath();
    p.tail.forEach((t, i) => {
      if (i === 0) {
        ctx.moveTo(t.x - camX, t.y - camY);
      } else {
        ctx.lineTo(t.x - camX, t.y - camY);
      }
    });
    ctx.stroke();

    // Nombre
    ctx.fillStyle = 'white';
    ctx.font = '12px Arial';
    ctx.fillText(p.name, p.x - camX - 15, p.y - camY - 10);
  });

  // Score
  document.getElementById('score').innerText = `Puntaje: ${me.score}`;

  // Leaderboard
  document.getElementById('leaderboard').innerHTML = '<b>Ranking:</b><br>' + leaderboard.map(p => `${p.name}: ${p.score}`).join('<br>');
}
