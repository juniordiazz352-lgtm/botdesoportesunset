/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║           BOT DE SOPORTE - ENTRY POINT                  ║
 * ║     Con servidor HTTP keep-alive para Render (gratis)   ║
 * ╚══════════════════════════════════════════════════════════╝
 */

const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const { loadCommands } = require('./handlers/commandHandler');
const { loadEvents } = require('./handlers/eventHandler');
const { initData } = require('./utils/dataManager');
const http = require('http');
require('dotenv').config();

// ── Servidor HTTP para que Render no duerma el servicio ─────
// Render exige que el proceso escuche en un puerto HTTP.
// Este servidor también sirve como health-check endpoint.
const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', uptime: process.uptime() }));
  } else {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('🤖 Bot de Soporte Discord — Online');
  }
});

server.listen(PORT, () => {
  console.log(`🌐 Servidor HTTP escuchando en puerto ${PORT}`);
});

// ── Crear cliente con todos los intents necesarios ──────────
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
global.discordClient = client;
// ── Colecciones del cliente ──────────────────────────────────
client.commands = new Collection();
client.cooldowns = new Collection();

// ── Inicializar datos persistentes ──────────────────────────
initData();

// ── Cargar handlers ─────────────────────────────────────────
loadCommands(client);
loadEvents(client);

// ── Login ────────────────────────────────────────────────────
client.login(process.env.DISCORD_TOKEN).catch(err => {
  console.error('❌ Error al iniciar sesión:', err);
  process.exit(1);
});
require('./web/server');

