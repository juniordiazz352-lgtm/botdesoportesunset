require('dotenv').config();
const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const { loadCommands } = require('./handlers/commandHandler');
const { loadEvents } = require('./handlers/eventHandler');
const http = require('http');

// Solo conectar MongoDB si existe la URI
if (process.env.MONGO_URI) {
    try {
        const { connectDB } = require('./utils/database');
        connectDB();
    } catch (e) {
        console.log('⚠️ MongoDB no disponible');
    }
} else {
    console.log('⚠️ MongoDB no configurado, usando solo JSON');
}

// ... resto del index.js (igual que antes)
