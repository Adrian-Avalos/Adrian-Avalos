const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
canvas.width = innerWidth;
canvas.height = innerHeight;

const socket = io();
let players = {};
let food = [];
let leaderboard = [];
const eatSound = document.getElementById("eat-sound");

document.addEventListener("mousemove", (e) => {
  const angle = Math.atan2(e.clientY - canvas.height / 2, e.clientX - canvas.width / 2);
  socket.emit("move", angle);
});

function moveDir(angle) {
  socket.emit("move", angle);
}

function setName() {
  const name = document.getElementById("name").value;
  socket.emit("setName", name);
}

socket.on("state", (data) => {
  players = data.players;
  food = data.food;
  leaderboard = data.leaderboard;
  draw();
});

function draw() {
  const me = players[socket.id];
  if (!me) return;
  const camX = me.x - canvas.width / 2;
  const camY = me.y - canvas.height / 2;

  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  food.forEach(f => {
    ctx.beginPath();
    ctx.fillStyle = f.color;
    ctx.arc(f.x - camX, f.y - camY, 4, 0, Math.PI * 2);
    ctx.fill();
  });

  Object.values(players).forEach((p, index) => {
    ctx.strokeStyle = p.color;
    ctx.lineWidth = 8;
    ctx.beginPath();
    p.tail.forEach((t, i) => {
      if (i === 0) ctx.moveTo(t.x - camX, t.y - camY);
      else ctx.lineTo(t.x - camX, t.y - camY);
    });
    ctx.stroke();

    ctx.font = "20px Arial";
    ctx.fillText("🐍", p.x - camX - 10, p.y - camY + 8);

    ctx.fillStyle = "white";
    ctx.font = "12px Arial";
    ctx.fillText(p.name, p.x - camX - 20, p.y - camY - 15);
  });

  document.getElementById("score").innerText = `Puntaje: ${me.score}`;
  document.getElementById("leaderboard").innerHTML =
    "<b>Ranking:</b><br>" +
    leaderboard.map((p, i) => `${i === 0 ? '👑' : ''} ${p.name}: ${p.score}`).join("<br>");
}
