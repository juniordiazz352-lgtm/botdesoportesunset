require('dotenv').config();
const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const { loadCommands } = require('./handlers/commandHandler');
const { loadEvents } = require('./handlers/eventHandler');
const http = require('http');

// ============================================
// SERVIDOR HTTP PARA RENDER (KEEP-ALIVE)
// ============================================
const PORT = process.env.PORT || 3000;
const server = http.createServer((req, res) => {
    if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', uptime: process.uptime() }));
    } else {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('Bot Online');
    }
});
server.listen(PORT, () => console.log(`🌐 HTTP en puerto ${PORT}`));

// ============================================
// CONEXIÓN A MONGODB (OPCIONAL)
// ============================================
if (process.env.MONGO_URI) {
    try {
        const { connectDB } = require('./utils/database');
        connectDB();
    } catch (e) {
        console.log('⚠️ Error conectando MongoDB:', e.message);
    }
} else {
    console.log('⚠️ MongoDB no configurado, usando solo JSON');
}

// ============================================
// CLIENTE DE DISCORD
// ============================================
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
    ],
    partials: [Partials.Channel, Partials.Message],
});

global.discordClient = client;
client.commands = new Collection();
client.cooldowns = new Collection();

// ============================================
// CARGAR COMANDOS Y EVENTOS
// ============================================
loadCommands(client);
loadEvents(client);

// ============================================
// LOGIN
// ============================================
client.login(process.env.DISCORD_TOKEN).catch(err => {
    console.error('❌ Error login:', err);
    process.exit(1);
});

// ============================================
// DASHBOARD OPCIONAL
// ============================================
try {
    require('./web/server');
    console.log('🌐 Dashboard web cargado');
} catch (e) {
    console.log('⚠️ Dashboard no encontrado');
}

// ============================================
// MANEJADORES DE ERRORES GLOBALES
// ============================================
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection:', reason);
});
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
});
