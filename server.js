
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

const PORT = process.env.PORT || 3000;
app.use(express.static(__dirname));

app.get('/env-config.js', (req, res) => {
  res.set('Content-Type', 'application/javascript');
  res.send(`
    window.process = window.process || {};
    window.process.env = window.process.env || {};
    window.process.env.API_KEY = "${process.env.API_KEY || ''}";
    console.log("[VartaSphere] Nexus Environment Synchronized.");
  `);
});

io.on('connection', (socket) => {
  console.log(`[Liaison Connect] SID: ${socket.id}`);

  socket.on('join_room', (data) => {
    socket.join(data.id);
    console.log(`[Room Action] SID ${socket.id} joined ${data.id}`);
  });

  socket.on('send_message', (data) => {
    const rid = data.roomId;
    console.log(`[Transmission] Origin: ${data.senderId} | Target: ${rid}`);
    
    // Crucial: 'varta_global_signaling' is the discovery channel. 
    // We broadcast globally to ensure PING/PONG reaches everyone.
    if (rid === "varta_global_signaling") {
        io.emit('message', data);
    } else {
        // Direct room broadcast for established protocol channels.
        io.to(rid).emit('message', data);
    }
  });

  socket.on('disconnect', () => {
    console.log(`[Liaison Disconnect] SID: ${socket.id}`);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('--------------------------------------------------');
  console.log('VARTASPHERE NEXUS SERVER ACTIVE');
  console.log(`URL: http://localhost:${PORT}`);
  console.log('--------------------------------------------------');
});
