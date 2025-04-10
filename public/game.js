const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
canvas.width = innerWidth;
canvas.height = innerHeight;

const socket = io();
let players = {};
let food = [];
let leaderboard = [];
let topId = null;
let deathEffects = [];

let turboActive = false;
let playerName = "";
let playerEmoji = "🐍";

function turbo(state) {
  turboActive = state;
  socket.emit("turbo", state);
}

// Mouse = dirección
document.addEventListener("mousemove", (e) => {
  const angle = Math.atan2(e.clientY - canvas.height / 2, e.clientX - canvas.width / 2);
  socket.emit("move", angle);
});

// Tecla Shift = turbo
document.addEventListener("keydown", e => {
  if (e.key === "Shift") turbo(true);
});
document.addEventListener("keyup", e => {
  if (e.key === "Shift") turbo(false);
});

function setName() {
  playerName = document.getElementById("name").value || "Jugador";
  playerEmoji = document.getElementById("emoji").value || "🐍";
  socket.emit("setName", { name: playerName, emoji: playerEmoji });
}

socket.on("state", (data) => {
  players = data.players;
  food = data.food;
  leaderboard = data.leaderboard;
  topId = data.topId;
  deathEffects = data.deathEffects;
  draw();
});

function draw() {
  const me = players[socket.id];
  if (!me) return;

  const MAP_SIZE = 3000;
  const zoom = 1 + (me.score / 300);
  ctx.save();
  ctx.scale(1 / zoom, 1 / zoom);

  const camX = me.x - (canvas.width / 2) * (1 / zoom);
  const camY = me.y - (canvas.height / 2) * (1 / zoom);

  // Fondo
  const grd = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, 100, canvas.width / 2, canvas.height / 2, 1000);
  grd.addColorStop(0, "#222");
  grd.addColorStop(1, "#111");
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // BORDES del mapa
  ctx.strokeStyle = "#444";
  ctx.lineWidth = 10;
  ctx.strokeRect(-MAP_SIZE / 2 - camX, -MAP_SIZE / 2 - camY, MAP_SIZE, MAP_SIZE);

  // Comida
  food.forEach(f => {
    ctx.fillStyle = f.color;
    ctx.beginPath();
    ctx.arc(f.x - camX, f.y - camY, 4, 0, Math.PI * 2);
    ctx.fill();
  });

  // Serpientes
  Object.values(players).forEach(p => {
    const isTop = p.id === topId;
    for (let i = 0; i < p.tail.length; i++) {
      const seg = p.tail[i];
      const x = seg.x - camX;
      const y = seg.y - camY;

      const grad = ctx.createRadialGradient(x, y, 2, x, y, isTop ? 16 : 10);
      grad.addColorStop(0, "white");
      grad.addColorStop(0.3, p.color);
      grad.addColorStop(1, "#000");

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, isTop ? 12 : 8, 0, Math.PI * 2);
      ctx.fill();
    }

    // Cabeza
    ctx.font = "20px Arial";
    ctx.fillText(p.emoji || "🐍", p.x - camX - 10, p.y - camY + 8);

    // Nombre
    ctx.fillStyle = "white";
    ctx.font = "12px Arial";
    ctx.fillText(p.name, p.x - camX - 20, p.y - camY - 15);
  });

  // Explosiones
  deathEffects.forEach(e => {
    for (let i = 0; i < 10; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * 20;
      const x = e.x + Math.cos(angle) * dist;
      const y = e.y + Math.sin(angle) * dist;
      ctx.fillStyle = e.color;
      ctx.beginPath();
      ctx.arc(x - camX, y - camY, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  ctx.restore();

  // Minimapa
  const radius = 80;
  const mapX = canvas.width - radius - 20;
  const mapY = radius + 20;
  ctx.beginPath();
  ctx.arc(mapX, mapY, radius, 0, Math.PI * 2);
  ctx.fillStyle = "#222";
  ctx.fill();

  Object.values(players).forEach(p => {
    const dotX = mapX + (p.x / MAP_SIZE) * radius;
    const dotY = mapY + (p.y / MAP_SIZE) * radius;
    ctx.fillStyle = p.id === socket.id ? "white" : "gray";
    ctx.beginPath();
    ctx.arc(dotX, dotY, 3, 0, Math.PI * 2);
    ctx.fill();
  });

  // UI
  document.getElementById("score").innerText = `Puntaje: ${me.score.toFixed(1)}`;
  document.getElementById("leaderboard").innerHTML =
    "<b>Ranking:</b><br>" +
    leaderboard.map((p, i) => `${i === 0 ? '👑' : ''} ${p.name}: ${p.score.toFixed(0)}`).join("<br>");
}
