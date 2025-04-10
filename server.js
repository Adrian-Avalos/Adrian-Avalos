const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

const players = {};
const food = [];
const MAP_SIZE = 3000;
const FOOD_COUNT = 200;

function generateFood() {
  while (food.length < FOOD_COUNT) {
    food.push({
      x: Math.random() * MAP_SIZE - MAP_SIZE / 2,
      y: Math.random() * MAP_SIZE - MAP_SIZE / 2,
      color: `hsl(${Math.random() * 360}, 100%, 50%)`
    });
  }
}
generateFood();

io.on("connection", (socket) => {
  players[socket.id] = {
    id: socket.id,
    x: 0,
    y: 0,
    angle: 0,
    tail: [],
    name: "Jugador",
    color: `hsl(${Math.random() * 360}, 100%, 60%)`,
    alive: true,
    score: 0
  };

  socket.on("setName", (name) => {
    if (players[socket.id]) players[socket.id].name = name;
  });

  socket.on("move", (angle) => {
    if (players[socket.id]) {
      players[socket.id].angle = angle;
    }
  });

  socket.on("disconnect", () => {
    delete players[socket.id];
  });
});

setInterval(() => {
  for (const id in players) {
    const p = players[id];
    if (!p.alive) continue;

    const speed = 2 + p.score * 0.01;
    p.x += Math.cos(p.angle) * speed;
    p.y += Math.sin(p.angle) * speed;

    p.x = Math.max(Math.min(p.x, MAP_SIZE / 2), -MAP_SIZE / 2);
    p.y = Math.max(Math.min(p.y, MAP_SIZE / 2), -MAP_SIZE / 2);

    p.tail.push({ x: p.x, y: p.y });
    if (p.tail.length > 100 + p.score) p.tail.shift();

    for (let i = 0; i < food.length; i++) {
      const f = food[i];
      const dx = p.x - f.x;
      const dy = p.y - f.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 20) {
        p.score += 5;
        food[i] = {
          x: Math.random() * MAP_SIZE - MAP_SIZE / 2,
          y: Math.random() * MAP_SIZE - MAP_SIZE / 2,
          color: `hsl(${Math.random() * 360}, 100%, 50%)`
        };
      }
    }
  }

  const leaderboard = Object.values(players)
    .filter(p => p.alive)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  io.emit("state", { players, food, leaderboard });
}, 50);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log("Servidor en puerto", PORT));
