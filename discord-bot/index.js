/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║           BOT DE SOPORTE - CORE SYSTEM PRO              ║
 * ║        Arquitectura avanzada + Render Ready             ║
 * ╚══════════════════════════════════════════════════════════╝
 */

require('dotenv').config();

const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const { loadCommands } = require('./handlers/commandHandler');
const { loadEvents } = require('./handlers/eventHandler');
const http = require('http');

// ───────────────────────────────────────────────────────────
// 🧠 VALIDACIÓN DE VARIABLES DE ENTORNO
// ───────────────────────────────────────────────────────────
if (!process.env.DISCORD_TOKEN) {
    console.error('❌ ERROR: DISCORD_TOKEN no definido');
    process.exit(1);
}

// ───────────────────────────────────────────────────────────
// 🌐 SERVIDOR HTTP (KEEP-ALIVE PARA RENDER)
// ───────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;

global.server = http.createServer((req, res) => {
    if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'ok',
            uptime: process.uptime(),
            memory: process.memoryUsage().rss
        }));
    } else {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('🤖 Bot de Soporte PRO — Online');
    }
});

global.server.listen(PORT, () => {
    console.log(`🌐 HTTP listo en puerto ${PORT}`);
});

// ───────────────────────────────────────────────────────────
// 🤖 CLIENTE DISCORD (OPTIMIZADO)
// ───────────────────────────────────────────────────────────
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildMessageReactions,
    ],
    partials: [Partials.Channel, Partials.Message, Partials.User],
});

// GLOBAL (para dashboard)
global.discordClient = client;

// ───────────────────────────────────────────────────────────
// 📦 COLECCIONES
// ───────────────────────────────────────────────────────────
client.commands = new Collection();
client.cooldowns = new Collection();

// ───────────────────────────────────────────────────────────
// 🔄 CARGA SEGURA DE HANDLERS
// ───────────────────────────────────────────────────────────
(async () => {
    try {
        console.log('🔄 Cargando sistema...');

        await loadCommands(client);
        console.log('✅ Comandos cargados');

        await loadEvents(client);
        console.log('✅ Eventos cargados');

    } catch (err) {
        console.error('❌ Error cargando sistema:', err);
        process.exit(1);
    }
})();

// ───────────────────────────────────────────────────────────
// 🚀 LOGIN SEGURO
// ───────────────────────────────────────────────────────────
client.login(process.env.DISCORD_TOKEN)
    .then(() => console.log(`🤖 Bot conectado como ${client.user?.tag || '...'}`))
    .catch(err => {
        console.error('❌ Error al iniciar sesión:', err);
        process.exit(1);
    });

// ───────────────────────────────────────────────────────────
// 🌐 DASHBOARD WEB
// ───────────────────────────────────────────────────────────
try {
    require('./web/server');
    console.log('🌐 Dashboard cargado');
} catch (err) {
    console.warn('⚠️ Dashboard no encontrado (opcional)');
}

// ───────────────────────────────────────────────────────────
// 🛑 MANEJO GLOBAL DE ERRORES
// ───────────────────────────────────────────────────────────
process.on('unhandledRejection', (err) => {
    console.error('❌ Unhandled Rejection:', err);
});

process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err);
});

// ───────────────────────────────────────────────────────────
// 🔄 MONITOREO (OPCIONAL PRO)
// ───────────────────────────────────────────────────────────
setInterval(() => {
    const mem = process.memoryUsage().rss / 1024 / 1024;
    console.log(`📊 RAM: ${mem.toFixed(2)} MB`);
}, 60000);
