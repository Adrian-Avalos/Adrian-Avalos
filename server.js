const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// 👇 Esta línea es clave para evitar "Cannot GET /"
app.use(express.static('public'));

const players = {};
let fruit = randomPos();
let bomb = randomPos();
let boost = randomPos();

function randomPos() {
  return { x: Math.floor(Math.random() * 30), y: Math.floor(Math.random() * 30) };
}

io.on('connection', (socket) => {
  console.log('Jugador conectado:', socket.id);

  players[socket.id] = {
    x: Math.floor(Math.random() * 30),
    y: Math.floor(Math.random() * 30),
    dx: 1,
    dy: 0,
    tail: [],
    color: '#' + Math.floor(Math.random() * 16777215).toString(16),
    alive: true,
    speed: 100
  };

  socket.emit('init', {
    id: socket.id,
    players,
    fruit,
    bomb,
    boost
  });

  socket.broadcast.emit('new-player', { id: socket.id, data: players[socket.id] });

  socket.on('move', ({ dx, dy }) => {
    const p = players[socket.id];
    if (p && p.alive) {
      p.dx = dx;
      p.dy = dy;
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

    // Colisiones
    if (p.x === fruit.x && p.y === fruit.y) {
      p.tail.push({});
      fruit = randomPos();
    }

    if (p.x === bomb.x && p.y === bomb.y) {
      p.alive = false;
    }

    if (p.x === boost.x && p.y === boost.y) {
      p.speed = 50;
      setTimeout(() => { p.speed = 100; }, 5000);
      boost = randomPos();
    }

    // Límite del mapa
    if (p.x < 0 || p.y < 0 || p.x >= 30 || p.y >= 30) {
      p.alive = false;
    }
  }

  io.emit('state', {
    players,
    fruit,
    bomb,
    boost
  });
}, 100);

// 🔥 Puerto dinámico para Render
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
