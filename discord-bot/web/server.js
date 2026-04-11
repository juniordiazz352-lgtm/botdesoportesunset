const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// guardar conexiones
global.io = io;

// leer data
function getData() {
    const file = path.join(__dirname, '../data/data.json');
    if (!fs.existsSync(file)) return { tickets: {} };
    return JSON.parse(fs.readFileSync(file));
}

// dashboard
app.get('/dashboard', (req, res) => {
    const data = getData();
    const tickets = data.tickets || {};

    let html = `
    <html>
    <head>
        <title>Dashboard Live</title>
        <script src="/socket.io/socket.io.js"></script>
        <style>
            body { font-family: Arial; background: #1e1e2f; color: white; }
            .chat { background: #2b2d31; padding: 10px; margin: 10px; border-radius: 10px; max-height: 300px; overflow-y: auto; }
        </style>
    </head>
    <body>
        <h1>📡 Tickets en Vivo</h1>
        <div id="chat" class="chat"></div>

        <script>
            const socket = io();

            socket.on('message', (data) => {
                const div = document.getElementById('chat');
                div.innerHTML += "<p><b>" + data.user + ":</b> " + data.content + "</p>";
                div.scrollTop = div.scrollHeight;
            });
        </script>
    </body>
    </html>
    `;

    res.send(html);
});

// health
app.get('/health', (req, res) => res.send('OK'));

server.listen(PORT, () => {
    console.log('🌐 Dashboard con sockets activo');
});
