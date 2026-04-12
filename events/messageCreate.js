const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const { priorities, getPriorityEmoji } = require('../utils/prioritySystem');
const { Ticket } = require('../utils/database');

// ... (código anterior se mantiene)

// Nuevo: !priority <baja|media|alta>
if (message.content.startsWith('!priority')) {
    const args = message.content.split(' ');
    const priority = args[1];
    if (!priority || !priorities[priority]) {
        return message.reply('❌ Usa: !priority baja | media | alta');
    }
    // Verificar staff y ticket
    const config = JSON.parse(fs.readFileSync('./data/config.json'));
    if (!message.member.roles.cache.has(config.rol_staff)) return message.reply('❌ Solo staff');
    if (!message.channel.name.startsWith('ticket-')) return message.reply('❌ Solo en tickets');
    
    // Actualizar en MongoDB
    await Ticket.findOneAndUpdate({ channelId: message.channel.id }, { priority });
    await message.channel.send(`✅ Prioridad cambiada a ${priorities[priority].name}`);
    await message.delete();
}

// !transfer @staff
if (message.content.startsWith('!transfer')) {
    const staff = message.mentions.members.first();
    if (!staff) return message.reply('❌ Menciona al staff');
    // lógica de transferencia...
}

// !wait (poner ticket en espera)
if (message.content === '!wait') {
    // cambiar estado a waiting, renombrar canal, notificar
}

// !close mejorado con registro en MongoDB y DM con rating
// !claim actualizado para MongoDB
// etc.
