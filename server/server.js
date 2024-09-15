const express = require("express")
const {createServer} = require("http")
const {Server} = require("socket.io")
const {exec} = require("child_process")

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

let codeVersion = 0;
let currentCode = '// Start coding...';
const connectedUsers = new Map(); // Changed to Map for username tracking

io.on('connection', (socket) => {
  console.log('New client connected');
  socket.emit('requestUsername'); // Request username from the client

  socket.on('setUsername', (username) => {
    connectedUsers.set(socket.id, username);
    io.emit('userList', Array.from(connectedUsers.values()));
    socket.broadcast.emit('userJoined', username);
  });

  socket.emit('codeChange', currentCode);
  io.emit('userList', Array.from(connectedUsers.values()));

  socket.on('codeChange', (newCode) => {
    codeVersion += 1;
    currentCode = newCode;
    io.emit('codeChange', newCode);
  });

  socket.on('cursorMove', (data) => {
    socket.broadcast.emit('cursorMove', data);
  });

  socket.on('executeCode', (code) => {
    exec(`node -e "${code.replace(/"/g, '\\"')}"`, (error, stdout, stderr) => {
      if (error) {
        socket.emit('codeOutput', `Error: ${error.message}`);
        return;
      }
      if (stderr) {
        socket.emit('codeOutput', `Error: ${stderr}`);
        return;
      }
      console.log(stdout,"stdout")
      socket.emit('codeOutput', stdout);
    });
  });

  socket.on('disconnect', () => {
    const username = connectedUsers.get(socket.id);
    connectedUsers.delete(socket.id);
    io.emit('userList', Array.from(connectedUsers.values()));
    socket.broadcast.emit('userLeft', username);
  });
});

const PORT = 8080;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
