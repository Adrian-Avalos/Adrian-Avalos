const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

const players = {};

io.on('connection', (socket) => {
  console.log('Nuevo jugador conectado:', socket.id);

  players[socket.id] = {
    x: Math.floor(Math.random() * 30),
    y: Math.floor(Math.random() * 30),
    dx: 1,
    dy: 0,
    tail: [],
    color: '#' + Math.floor(Math.random()*16777215).toString(16)
  };

  socket.emit('init', { id: socket.id, players });

  socket.broadcast.emit('new-player', { id: socket.id, data: players[socket.id] });

  socket.on('move', (data) => {
    if (players[socket.id]) {
      players[socket.id].dx = data.dx;
      players[socket.id].dy = data.dy;
    }
  });

  socket.on('disconnect', () => {
    console.log('Jugador desconectado:', socket.id);
    delete players[socket.id];
    io.emit('remove-player', socket.id);
  });

  setInterval(() => {
    Object.values(players).forEach(player => {
      player.x += player.dx;
      player.y += player.dy;
      player.tail.push({ x: player.x, y: player.y });
      if (player.tail.length > 10) player.tail.shift();
    });
    io.emit('state', players);
  }, 150);
});

server.listen(3000, () => {
  console.log('Servidor corriendo en http://localhost:3000');
});
