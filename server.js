const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

const players = {};
let food = generateFood();

function generateFood(count = 100) {
  const foodItems = [];
  for (let i = 0; i < count; i++) {
    foodItems.push({
      x: Math.random() * 3000 - 1500,
      y: Math.random() * 3000 - 1500,
      color: `hsl(${Math.random() * 360}, 100%, 50%)`
    });
  }
  return foodItems;
}

io.on('connection', (socket) => {
  console.log(`Jugador conectado: ${socket.id}`);

  players[socket.id] = {
    x: 0,
    y: 0,
    angle: 0,
    tail: [],
    name: `Jugador-${socket.id.slice(0, 4)}`,
    color: `hsl(${Math.random() * 360}, 100%, 60%)`,
    score: 0
  };

  socket.on('setName', (name) => {
    players[socket.id].name = name;
  });

  socket.on('move', (data) => {
    if (players[socket.id]) {
      players[socket.id].angle = data.angle;
    }
  });

  socket.on('disconnect', () => {
    console.log(`Jugador desconectado: ${socket.id}`);
    delete players[socket.id];
  });
});

setInterval(() => {
  for (const id in players) {
    const p = players[id];
    const speed = 2 + (p.score / 100);
    p.x += Math.cos(p.angle) * speed;
    p.y += Math.sin(p.angle) * speed;
    p.tail.push({ x: p.x, y: p.y });
    if (p.tail.length > 100 + p.score) p.tail.shift();

    // Colisión con comida
    food.forEach((f, index) => {
      const dx = f.x - p.x;
      const dy = f.y - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 20) {
        p.score += 5;
        food[index] = {
          x: Math.random() * 3000 - 1500,
          y: Math.random() * 3000 - 1500,
          color: `hsl(${Math.random() * 360}, 100%, 50%)`
        };
      }
    });
  }

  io.emit('state', {
    players,
    food,
    leaderboard: Object.values(players)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
  });
}, 50);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Servidor corriendo en ${PORT}`));
