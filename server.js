const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

const players = {};
let food = [];
let deathEffects = [];
const MAP_SIZE = 3000;
const FOOD_COUNT = 150;

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
    emoji: "🐍",
    color: `hsl(${Math.random() * 360}, 100%, 60%)`,
    alive: true,
    score: 0,
    turbo: false
  };

  socket.on("setName", ({ name, emoji }) => {
    if (players[socket.id]) {
      players[socket.id].name = name || "Jugador";
      players[socket.id].emoji = emoji || "🐍";
    }
  });

  socket.on("move", (angle) => {
    if (players[socket.id]) {
      players[socket.id].angle = angle;
    }
  });

  socket.on("turbo", (state) => {
    if (players[socket.id]) {
      players[socket.id].turbo = state;
    }
  });

  socket.on("disconnect", () => {
    delete players[socket.id];
  });
});

function killPlayer(p) {
  deathEffects.push({ x: p.x, y: p.y, color: p.color, time: Date.now() });

  // Genera comida al morir
  for (let i = 0; i < p.score; i += 5) {
    food.push({
      x: p.x + Math.random() * 40 - 20,
      y: p.y + Math.random() * 40 - 20,
      color: p.color
    });
  }

  // Reiniciar jugador
  p.tail = [];
  p.score = 0;
  p.x = Math.random() * MAP_SIZE - MAP_SIZE / 2;
  p.y = Math.random() * MAP_SIZE - MAP_SIZE / 2;
}

setInterval(() => {
  deathEffects = [];

  for (const id in players) {
    const p = players[id];
    if (!p.alive) continue;

    let speed = 2 + p.score * 0.01;
    if (p.turbo && p.score > 0) {
      speed *= 1.5;
      p.score -= 0.5;
    }

    p.x += Math.cos(p.angle) * speed;
    p.y += Math.sin(p.angle) * speed;

    // 💀 Si toca el borde, muere
    if (
      p.x < -MAP_SIZE / 2 || p.x > MAP_SIZE / 2 ||
      p.y < -MAP_SIZE / 2 || p.y > MAP_SIZE / 2
    ) {
      killPlayer(p);
      continue;
    }

    // Avanza y guarda cola
    p.tail.push({ x: p.x, y: p.y });
    if (p.tail.length > 100 + p.score) p.tail.shift();

    // Comer comida
    for (let i = 0; i < food.length; i++) {
      const f = food[i];
      const dx = p.x - f.x;
      const dy = p.y - f.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 20) {
        p.score += 5;
        food.splice(i, 1);
        i--;
      }
    }

    // Colisiones entre jugadores
    for (const otherId in players) {
      const other = players[otherId];
      if (otherId === id || !other.alive) continue;

      // Colisión con cola
      for (const part of other.tail) {
        const dx = p.x - part.x;
        const dy = p.y - part.y;
        if (Math.sqrt(dx * dx + dy * dy) < 10) {
          killPlayer(p);
        }
      }

      // Colisión cabeza contra cabeza
      const dx = p.x - other.x;
      const dy = p.y - other.y;
      if (Math.sqrt(dx * dx + dy * dy) < 10) {
        killPlayer(p);
        killPlayer(other);
      }
    }
  }

  // Ranking
  const sorted = Object.values(players).filter(p => p.alive).sort((a, b) => b.score - a.score);
  const topId = sorted.length > 0 ? sorted[0].id : null;
  const leaderboard = sorted.slice(0, 5);

  io.emit("state", {
    players,
    food,
    leaderboard,
    topId,
    deathEffects
  });
}, 50);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log("✅ Servidor corriendo en el puerto", PORT));
