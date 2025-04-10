const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

const players = {};
let fruit = getRandomPos();
let bomb = getRandomPos();
let speedBoost = getRandomPos();

function getRandomPos() {
  return { x: Math.floor(Math.random() * 30), y: Math.floor(Math.random() * 30) };
}

io.on('connection', (socket) => {
  console.log('Nuevo jugador conectado:', socket.id);

  players[socket.id] = {
    x: Math.floor(Math.random() * 30),
    y: Math.floor(Math.random() * 30),
    dx: 1,
    dy: 0,
    tail: [],
    color: '#' + Math.floor(Math.random()*16777215).toString(16),
    speed: 150,
    alive: true
  };

  socket.emit('init', {
    id: socket.id,
    players,
    fruit,
    bomb,
    speedBoost
  });

  socket.broadcast.emit('new-player', { id: socket.id, data: players[socket.id] });

  socket.on('move', (data) => {
    const p = players[socket.id];
    if (p && p.alive) {
      p.dx = data.dx;
      p.dy = data.dy;
    }
  });

  socket.on('disconnect', () => {
    console.log('Jugador desconectado:', socket.id);
    delete players[socket.id];
    io.emit('remove-player', socket.id);
  });
});

setInterval(() => {
  for (const id in players) {
    const p = players[id];
    if (!p.alive) continue;

    p.x += p.dx;
    p.y += p.dy;
    p.tail.push({ x: p.x, y: p.y });
    if (p.tail.length > 10) p.tail.shift();

    // Fruta
    if (p.x === fruit.x && p.y === fruit.y) {
      p.tail.push({});
      fruit = getRandomPos();
    }

    // Bomba
    if (p.x === bomb.x && p.y === bomb.y) {
      p.alive = false;
    }

    // Power-up velocidad
    if (p.x === speedBoost.x && p.y === speedBoost.y) {
      p.speed = 75;
      setTimeout(() => { p.speed = 150 }, 5000);
      speedBoost = getRandomPos();
    }

    // Límites del mapa
    if (p.x < 0 || p.y < 0 || p.x >= 30 || p.y >= 30) {
      p.alive = false;
    }
  }

  io.emit('state', { players, fruit, bomb, speedBoost });
}, 100);
