require('dotenv').config();
const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const { loadCommands } = require('./handlers/commandHandler');
const { loadEvents } = require('./handlers/eventHandler');
const http = require('http');

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

loadCommands(client);
loadEvents(client);

client.login(process.env.DISCORD_TOKEN).catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
});

try { require('./web/server'); } catch(e) { console.log('⚠️ Dashboard opcional'); }

process.on('unhandledRejection', console.error);
process.on('uncaughtException', console.error);
