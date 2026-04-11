const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// leer tickets
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
        <title>Dashboard Bot</title>
        <style>
            body { font-family: Arial; background: #1e1e2f; color: white; }
            .card { background: #2b2d31; padding: 15px; margin: 10px; border-radius: 10px; }
            button { padding: 10px; border: none; background: red; color: white; cursor: pointer; }
        </style>
    </head>
    <body>
        <h1>🎫 Tickets Activos</h1>
    `;

    for (const userId in tickets) {
        html += `
        <div class="card">
            👤 Usuario: ${userId}<br>
            📁 Canal: ${tickets[userId]}<br>
            <button onclick="cerrar('${tickets[userId]}')">Cerrar</button>
        </div>`;
    }

    html += `
        <script>
            function cerrar(channelId) {
                fetch('/close/' + channelId)
                .then(() => location.reload());
            }
        </script>
    </body>
    </html>
    `;

    res.send(html);
});

// cerrar ticket desde web
app.get('/close/:channelId', async (req, res) => {
    const channelId = req.params.channelId;

    const client = global.discordClient;
    const channel = client.channels.cache.get(channelId);

    if (channel) {
        await channel.delete().catch(() => {});
    }

    res.send("ok");
});

// health check (Render)
app.get('/health', (req, res) => res.send('OK'));

app.listen(PORT, () => {
    console.log(`🌐 Dashboard activo en puerto ${PORT}`);
});
